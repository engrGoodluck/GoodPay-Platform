const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { z } = require("zod");

const pool = require("../db");
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../utils/email");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// VALIDATION
const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(72),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email().max(255),
  token: z.string().length(64),
  password: z.string().min(8).max(72),
});

// REGISTER
router.post("/register", async (req, res) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid registration details.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { firstName, lastName, email, phone, password } = validation.data;

  let client;

  try {
    client = await pool.connect();

    const passwordHash = await bcrypt.hash(password, 12);
    const code = crypto.randomInt(100000, 1000000).toString();

    const codeHash = crypto
      .createHmac("sha256", process.env.OTP_SECRET || process.env.JWT_SECRET)
      .update(code)
      .digest("hex");

    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users
       (first_name, last_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, email, phone, created_at`,
      [firstName, lastName, email.toLowerCase(), phone || null, passwordHash],
    );

    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO verification_codes
       (user_id, code_hash, channel, destination, expires_at)
       VALUES ($1, $2, 'email', $3, NOW() + INTERVAL '10 minutes')`,
      [user.id, codeHash, user.email],
    );

    await client.query("COMMIT");

    try {
      await sendVerificationEmail(user.email, code);
    } catch (emailError) {
      console.error("Verification email error:", emailError.message);

      return res.status(502).json({
        success: false,
        message:
          "Your account was created, but we could not send the verification email. Please try again later.",
        userId: user.id,
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email for your verification code.",
      userId: user.id,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create your account.",
    });
  } finally {
    if (client) client.release();
  }
});

// VERIFY REGISTRATION EMAIL
router.post("/verify-registration", async (req, res) => {
  const schema = z.object({
    userId: z.string().uuid(),
    code: z.string().regex(/^\d{6}$/, "Enter a valid six-digit code."),
  });

  const validation = schema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid user ID and six-digit code.",
    });
  }

  const { userId, code } = validation.data;
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const codeResult = await client.query(
      `SELECT id, code_hash, attempts, expires_at, verified_at
       FROM verification_codes
       WHERE user_id = $1
         AND channel = 'email'
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [userId],
    );

    const verification = codeResult.rows[0];

    if (!verification || verification.verified_at) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Verification code is invalid or has already been used.",
      });
    }

    if (new Date(verification.expires_at) <= new Date()) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Your verification code has expired. Please request a new one.",
      });
    }

    if (verification.attempts >= 5) {
      await client.query("ROLLBACK");

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const submittedHash = crypto
      .createHmac("sha256", process.env.OTP_SECRET || process.env.JWT_SECRET)
      .update(code)
      .digest("hex");

    const submittedBuffer = Buffer.from(submittedHash, "hex");
    const storedBuffer = Buffer.from(verification.code_hash, "hex");

    const isValid =
      submittedBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(submittedBuffer, storedBuffer);

    if (!isValid) {
      await client.query(
        `UPDATE verification_codes
         SET attempts = attempts + 1
         WHERE id = $1`,
        [verification.id],
      );

      await client.query("COMMIT");

      return res.status(400).json({
        success: false,
        message: "Incorrect verification code.",
      });
    }

    const userResult = await client.query(
      `UPDATE users
       SET email_verified = TRUE,
           is_verified = TRUE,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, first_name, last_name, email, phone, created_at`,
      [userId],
    );

    const user = userResult.rows[0];

    if (!user) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    await client.query(
      `UPDATE verification_codes
       SET verified_at = NOW()
       WHERE id = $1`,
      [verification.id],
    );

    await client.query(
      `INSERT INTO wallets (user_id, currency)
       VALUES ($1, 'NGN')
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [user.id],
    );

    await client.query("COMMIT");

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({
      success: true,
      message: "Email verified successfully. Your GoodPay account is ready.",
      token,
      user,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Email verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify your email at this time.",
    });
  } finally {
    if (client) client.release();
  }
});

// RESEND REGISTRATION VERIFICATION EMAIL
router.post("/resend-verification", async (req, res) => {
  const schema = z.object({
    userId: z.string().uuid(),
  });

  const validation = schema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "A valid user ID is required.",
    });
  }

  const { userId } = validation.data;
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT id, email, is_verified
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId],
    );

    const user = userResult.rows[0];

    if (!user || user.is_verified) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "This account cannot request another verification code.",
      });
    }

    const recentResult = await client.query(
      `SELECT
         COUNT(*)::int AS total,
         MAX(created_at) AS last_sent
       FROM verification_codes
       WHERE user_id = $1
         AND channel = 'email'
         AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId],
    );

    const { total, last_sent } = recentResult.rows[0];

    if (Number(total) >= 5) {
      await client.query("ROLLBACK");

      return res.status(429).json({
        success: false,
        message:
          "You have requested too many codes. Please try again in an hour.",
      });
    }

    if (last_sent && Date.now() - new Date(last_sent).getTime() < 60 * 1000) {
      await client.query("ROLLBACK");

      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another code.",
      });
    }

    const code = crypto.randomInt(100000, 1000000).toString();

    const codeHash = crypto
      .createHmac("sha256", process.env.OTP_SECRET || process.env.JWT_SECRET)
      .update(code)
      .digest("hex");

    await client.query(
      `UPDATE verification_codes
   SET expires_at = NOW()
   WHERE user_id = $1
     AND channel = 'email'
     AND verified_at IS NULL`,
      [userId],
    );

    await client.query(
      `INSERT INTO verification_codes
       (user_id, code_hash, channel, destination, expires_at)
       VALUES ($1, $2, 'email', $3, NOW() + INTERVAL '10 minutes')`,
      [userId, codeHash, user.email],
    );

    await client.query("COMMIT");

    await sendVerificationEmail(user.email, code);

    return res.json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Resend verification error:", error.message);

    return res.status(500).json({
      success: false,
      message:
        "Unable to resend your verification code. Please try again later.",
    });
  } finally {
    if (client) client.release();
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email and password.",
    });
  }

  const { email, password } = validation.data;

  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone,
        password_hash, status, is_verified
 FROM users
 WHERE LOWER(email) = LOWER($1)`,
      [email],
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in.",
        requiresVerification: true,
        userId: user.id,
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is not currently active.",
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    delete user.password_hash;

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in at this time.",
    });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  const validation = forgotPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  const email = validation.data.email.toLowerCase();

  try {
    const userResult = await pool.query(
      `SELECT id, email
       FROM users
       WHERE LOWER(email) = LOWER($1)
       AND status = 'active'`,
      [email],
    );

    const user = userResult.rows[0];

    // Always return the same response to avoid revealing registered emails.
    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account exists for this email, password reset instructions will be sent.",
      });
    }

    // Generate a secure, random, one-time token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the SHA-256 hash in the database.
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await pool.query(
      `DELETE FROM password_resets
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id],
    );

    await pool.query(
      `INSERT INTO password_resets
       (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [user.id, tokenHash],
    );

    const resetUrl =
      `${process.env.CLIENT_URL}/reset-password` +
      `?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      console.error("Password reset email error:", emailError.message);

      // Remove the unusable token if email delivery fails.
      await pool.query(`DELETE FROM password_resets WHERE token_hash = $1`, [
        tokenHash,
      ]);
    }

    return res.json({
      success: true,
      message:
        "If an account exists for this email, password reset instructions will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your request right now.",
    });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const validation = resetPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        "Please provide a valid email, reset token and password of at least 8 characters.",
    });
  }

  const { email, token, password } = validation.data;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  let client;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT id
       FROM users
       WHERE LOWER(email) = LOWER($1)
       AND status = 'active'`,
      [email],
    );

    const user = userResult.rows[0];

    if (!user) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or has expired.",
      });
    }

    const resetResult = await client.query(
      `SELECT id
       FROM password_resets
       WHERE user_id = $1
       AND token_hash = $2
       AND used_at IS NULL
       AND expires_at > NOW()
       FOR UPDATE`,
      [user.id, tokenHash],
    );

    const resetRecord = resetResult.rows[0];

    if (!resetRecord) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or has expired.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await client.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id],
    );

    await client.query(
      `UPDATE password_resets
       SET used_at = NOW()
       WHERE id = $1`,
      [resetRecord.id],
    );

    // Invalidate any other outstanding reset links.
    await client.query(
      `DELETE FROM password_resets
       WHERE user_id = $1
       AND id != $2`,
      [user.id, resetRecord.id],
    );

    await client.query("COMMIT");

    // CREATE PASSWORD RESET NOTIFICATION
    try {
      await client.query(
        `INSERT INTO notifications (
       user_id, title, message, type, is_read
     )
     VALUES ($1, $2, $3, $4, FALSE)`,
        [
          user.id,
          "Password Reset Successful",
          "Your GoodPay account password was reset successfully. If you did not make this change, please contact support immediately.",
          "security",
        ],
      );
    } catch (notificationError) {
      console.error(
        "Password reset notification error:",
        notificationError.message,
      );
    }

    return res.json({
      success: true,
      message: "Your password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Reset password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset your password right now.",
    });
  } finally {
    if (client) client.release();
  }
});

// CHANGE PASSWORD
router.patch("/change-password", authenticateToken, async (req, res) => {
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z.string().min(8).max(72),
  });

  const validation = changePasswordSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        "Please provide a valid current password and a new password of at least 8 characters.",
    });
  }

  const { currentPassword, newPassword } = validation.data;

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message:
        "Your new password must be different from your current password.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT password_hash
       FROM users
       WHERE id = $1 AND status = 'active'`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Your current password is incorrect.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, req.user.id],
    );

    // CREATE PASSWORD CHANGE NOTIFICATION
    try {
      await pool.query(
        `INSERT INTO notifications (
       user_id, title, message, type, is_read
     )
     VALUES ($1, $2, $3, $4, FALSE)`,
        [
          req.user.id,
          "Password Changed",
          "Your GoodPay account password was changed successfully. If you did not make this change, please contact support immediately.",
          "security",
        ],
      );
    } catch (notificationError) {
      console.error(
        "Password change notification error:",
        notificationError.message,
      );
    }

    return res.json({
      success: true,
      message: "Your password has been changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to change your password right now.",
    });
  }
});

module.exports = router;
