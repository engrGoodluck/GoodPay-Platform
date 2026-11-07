const express = require("express");
const router = express.Router();

const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

// Get the authenticated user's wallets
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, currency, balance, created_at
       FROM wallets
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.user.id],
    );

    res.json({
      success: true,
      wallets: result.rows,
    });
  } catch (error) {
    console.error("Wallet retrieval error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve wallets.",
    });
  }
});

const crypto = require("crypto");

// Development-only simulated wallet funding
router.post("/fund", authenticateToken, async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({
      success: false,
      message: "This development feature is unavailable.",
    });
  }

  const amount = String(req.body.amount ?? "");

  // Accept positive amounts with up to two decimal places.
  if (
    !/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(amount) ||
    Number(amount) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid amount greater than zero.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the user's NGN wallet while funding it.
    const walletResult = await client.query(
      `SELECT id, currency, balance
       FROM wallets
       WHERE user_id = $1 AND currency = 'NGN'
       FOR UPDATE`,
      [req.user.id],
    );

    if (walletResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "NGN wallet not found.",
      });
    }

    const wallet = walletResult.rows[0];

    // Increase the wallet balance.
    const updatedWallet = await client.query(
      `UPDATE wallets
       SET balance = balance + $1::numeric
       WHERE id = $2
       RETURNING id, currency, balance`,
      [amount, wallet.id],
    );

    // Record the simulated deposit.
    const reference = `GP-SIM-${crypto.randomUUID()}`;

    const transactionResult = await client.query(
      `INSERT INTO transactions (
         reference,
         recipient_wallet_id,
         currency,
         amount,
         transaction_type,
         status,
         description
       )
       VALUES ($1, $2, $3, $4, 'deposit', 'successful', $5)
       RETURNING id, reference, currency, amount,
                 transaction_type, status, description, created_at`,
      [
        reference,
        wallet.id,
        wallet.currency,
        amount,
        "Development-only simulated wallet funding",
      ],
    );

    await client.query("COMMIT");

    // CREATE ADD MONEY NOTIFICATION
    try {
      const formattedAmount = Number(amount).toLocaleString("en-NG");

      await client.query(
        `INSERT INTO notifications (
       user_id, title, message, type, is_read
     )
     VALUES ($1, $2, $3, $4, FALSE)`,
        [
          req.user.id,
          "Money Added Successfully",
          `₦${formattedAmount} has been successfully added to your GoodPay wallet through simulated funding.`,
          "transaction",
        ],
      );
    } catch (notificationError) {
      console.error("Add Money notification error:", notificationError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Simulated wallet funding successful.",
      wallet: updatedWallet.rows[0],
      transaction: transactionResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Wallet funding error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fund wallet.",
    });
  } finally {
    client.release();
  }
});

module.exports = router;
