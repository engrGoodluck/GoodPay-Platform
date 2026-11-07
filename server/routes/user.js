const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");

const router = express.Router();
const { z } = require("zod");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // Maximum 2 MB
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPG, PNG, and WEBP images are allowed."));
    }

    callback(null, true);
  },
});

// UPLOAD PROFILE PICTURE
router.post(
  "/profile-picture",
  authenticateToken,
  (req, res, next) => {
    upload.single("profilePicture")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a profile picture.",
        });
      }

      // Convert the image to a format Cloudinary can receive
      const base64Image = req.file.buffer.toString("base64");
      const imageData = `data:${req.file.mimetype};base64,${base64Image}`;

      // Upload image to Cloudinary
      const uploadedImage = await cloudinary.uploader.upload(imageData, {
        folder: "goodpay/profile-pictures",
        public_id: `user-${req.user.id}`,
        overwrite: true,
        resource_type: "image",
      });

      // Save the Cloudinary image URL in PostgreSQL
      const result = await pool.query(
        `UPDATE users
         SET profile_picture_url = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING id, profile_picture_url`,
        [uploadedImage.secure_url, req.user.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User account not found.",
        });
      }

      // CREATE PROFILE UPDATE NOTIFICATION
      try {
        await pool.query(
          `INSERT INTO notifications (
       user_id, title, message, type, is_read
     )
     VALUES ($1, $2, $3, $4, FALSE)`,
          [
            req.user.id,
            "Profile Updated",
            "Your GoodPay profile information was updated successfully.",
            "account",
          ],
        );
      } catch (notificationError) {
        console.error(
          "Profile update notification error:",
          notificationError.message,
        );
      }

      return res.json({
        success: true,
        message: "Profile picture uploaded successfully.",
        profilePictureUrl: result.rows[0].profile_picture_url,
      });
    } catch (error) {
      console.error("Profile picture upload error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to upload your profile picture.",
      });
    }
  },
);

// REMOVE PROFILE PICTURE
router.delete("/profile-picture", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT profile_picture_url
       FROM users
       WHERE id = $1`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (result.rows[0].profile_picture_url) {
      await cloudinary.uploader.destroy(
        `goodpay/profile-pictures/user-${req.user.id}`,
        { resource_type: "image" },
      );
    }

    await pool.query(
      `UPDATE users
       SET profile_picture_url = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [req.user.id],
    );

    return res.json({
      success: true,
      message: "Profile picture removed successfully.",
    });
  } catch (error) {
    console.error("Profile picture removal error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to remove your profile picture.",
    });
  }
});

// Get authenticated user's profile and wallets
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.nickname,
        u.gender,
        TO_CHAR(u.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
        u.email,
        u.phone,
        u.address_line_1,
        u.address_line_2,
        u.city,
        u.state,
        u.postal_code,
        u.country,
        u.profile_picture_url,
        u.status,
        u.email_verified,
        u.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', w.id,
              'currency', w.currency,
              'balance', w.balance
            )
          ) FILTER (WHERE w.id IS NOT NULL),
          '[]'
        ) AS wallets
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your profile.",
    });
  }
});

// UPDATE PROFILE
router.patch("/profile", authenticateToken, async (req, res) => {
  const profileSchema = z.object({
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
    phone: z.string().trim().max(30).nullable().optional(),
    nickname: z.string().trim().max(50).nullable().optional(),
    gender: z.string().trim().max(20).nullable().optional(),
    dateOfBirth: z.string().nullable().optional(),
    addressLine1: z.string().trim().max(255).nullable().optional(),
    addressLine2: z.string().trim().max(255).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    state: z.string().trim().max(100).nullable().optional(),
    postalCode: z.string().trim().max(20).nullable().optional(),
    country: z.string().trim().max(100).nullable().optional(),
  });

  const validation = profileSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid profile information.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const {
    firstName,
    lastName,
    phone,
    nickname,
    gender,
    dateOfBirth,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
  } = validation.data;

  try {
    const result = await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           phone = COALESCE($3, phone),
           nickname = COALESCE($4, nickname),
           gender = COALESCE($5, gender),
           date_of_birth = COALESCE(NULLIF($6, '')::date, date_of_birth),
           address_line_1 = COALESCE($7, address_line_1),
           address_line_2 = COALESCE($8, address_line_2),
           city = COALESCE($9, city),
           state = COALESCE($10, state),
           postal_code = COALESCE($11, postal_code),
           country = COALESCE($12, country),
           updated_at = NOW()
       WHERE id = $13
       RETURNING
         id,
         first_name,
         last_name,
         nickname,
         gender,
         TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
         email,
         phone,
         address_line_1,
         address_line_2,
         city,
         state,
         postal_code,
         country,
         profile_picture_url,
         status,
         email_verified,
         created_at`,
      [
        firstName,
        lastName,
        phone ?? null,
        nickname ?? null,
        gender ?? null,
        dateOfBirth ?? null,
        addressLine1 ?? null,
        addressLine2 ?? null,
        city ?? null,
        state ?? null,
        postalCode ?? null,
        country ?? null,
        req.user.id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // CREATE PROFILE UPDATE NOTIFICATION
    try {
      await pool.query(
        `INSERT INTO notifications (
       user_id, title, message, type, is_read
     )
     VALUES ($1, $2, $3, $4, FALSE)`,
        [
          req.user.id,
          "Profile Updated",
          "Your GoodPay profile information was updated successfully.",
          "account",
        ],
      );
    } catch (notificationError) {
      console.error(
        "Profile update notification error:",
        notificationError.message,
      );
    }

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Profile update error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update your profile.",
    });
  }
});

module.exports = router;
