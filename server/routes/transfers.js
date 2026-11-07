const express = require("express");
const crypto = require("crypto");
const { z } = require("zod");

const router = express.Router();

const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const transferSchema = z.object({
  recipientEmail: z.string().email().max(255),
  amount: z.string().regex(/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/),
  description: z.string().trim().max(160).optional().default(""),
});

router.post("/", authenticateToken, async (req, res) => {
  const validation = transferSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid recipient email and transfer amount.",
    });
  }

  const { recipientEmail, amount, description } = validation.data;

  if (Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Transfer amount must be greater than zero.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Find the recipient account.
    const recipientResult = await client.query(
      `SELECT id, first_name, last_name, email
       FROM users
       WHERE LOWER(email) = LOWER($1)
         AND status = 'active'`,
      [recipientEmail],
    );

    if (recipientResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "No active GoodPay account was found for that email.",
      });
    }

    const recipient = recipientResult.rows[0];

    if (recipient.id === req.user.id) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "You cannot transfer money to your own account.",
      });
    }

    // Find the sender's NGN wallet.
    const senderWalletResult = await client.query(
      `SELECT id, user_id, currency, balance
       FROM wallets
       WHERE user_id = $1 AND currency = 'NGN'`,
      [req.user.id],
    );

    // Find the recipient's NGN wallet.
    const recipientWalletResult = await client.query(
      `SELECT id, user_id, currency, balance
       FROM wallets
       WHERE user_id = $1 AND currency = 'NGN'`,
      [recipient.id],
    );

    if (
      senderWalletResult.rows.length === 0 ||
      recipientWalletResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "A required NGN wallet could not be found.",
      });
    }

    const senderWallet = senderWalletResult.rows[0];
    const recipientWallet = recipientWalletResult.rows[0];

    // Lock both wallets in a consistent order.
    const walletIds = [senderWallet.id, recipientWallet.id].sort();

    const lockedWallets = await client.query(
      `SELECT id, balance
       FROM wallets
       WHERE id = ANY($1::uuid[])
       ORDER BY id
       FOR UPDATE`,
      [walletIds],
    );

    if (lockedWallets.rows.length !== 2) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Unable to lock both wallets for this transfer.",
      });
    }

    const lockedSenderWallet = lockedWallets.rows.find(
      (wallet) => wallet.id === senderWallet.id,
    );

    if (Number(lockedSenderWallet.balance) < Number(amount)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    // Debit the sender.
    await client.query(
      `UPDATE wallets
       SET balance = balance - $1::numeric
       WHERE id = $2`,
      [amount, senderWallet.id],
    );

    // Credit the recipient.
    await client.query(
      `UPDATE wallets
       SET balance = balance + $1::numeric
       WHERE id = $2`,
      [amount, recipientWallet.id],
    );

    // Record the transfer.
    const reference = `GP-TRF-${crypto.randomUUID()}`;

    const transactionResult = await client.query(
      `INSERT INTO transactions (
         reference,
         sender_wallet_id,
         recipient_wallet_id,
         currency,
         amount,
         transaction_type,
         status,
         description
       )
       VALUES ($1, $2, $3, 'NGN', $4, 'transfer', 'successful', $5)
       RETURNING id, reference, currency, amount,
                 transaction_type, status, description, created_at`,
      [
        reference,
        senderWallet.id,
        recipientWallet.id,
        amount,
        description || `Transfer to ${recipient.email}`,
      ],
    );

    await client.query("COMMIT");

    // CREATE TRANSFER NOTIFICATIONS
    try {
      const formattedAmount = Number(amount).toLocaleString("en-NG");

      // Notify the sender.
      await client.query(
        `INSERT INTO notifications (
       user_id, title, message, type, is_read
     )
     VALUES ($1, $2, $3, $4, FALSE)`,
        [
          req.user.id,
          "Transfer Successful",
          `Your transfer of ₦${formattedAmount} to ${recipient.first_name} ${recipient.last_name} was completed successfully.`,
          "transaction",
        ],
      );

      // Notify the recipient.
      await client.query(
        `INSERT INTO notifications (
       user_id, title, message, type, is_read
     )
     VALUES ($1, $2, $3, $4, FALSE)`,
        [
          recipient.id,
          "Money Received",
          `You have received ₦${formattedAmount} into your GoodPay wallet.`,
          "transaction",
        ],
      );
    } catch (notificationError) {
      console.error("Transfer notification error:", notificationError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Transfer completed successfully.",
      transaction: transactionResult.rows[0],
      recipient: {
        firstName: recipient.first_name,
        lastName: recipient.last_name,
        email: recipient.email,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Transfer error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to complete this transfer.",
    });
  } finally {
    client.release();
  }
});

module.exports = router;
