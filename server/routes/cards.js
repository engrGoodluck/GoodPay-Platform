const express = require("express");
const crypto = require("crypto");
const { z } = require("zod");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

// GET: Retrieve the logged-in user's saved cards
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        card_brand,
        last_four,
        expiry_month,
        expiry_year,
        is_default,
        created_at
       FROM payment_cards
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id],
    );

    res.json({
      success: true,
      cards: result.rows,
    });
  } catch (error) {
    console.error("Fetch cards error:", error);
    res.status(500).json({
      success: false,
      message: "Could not retrieve saved cards.",
    });
  }
});

// POST: Add a simulated development card
router.post("/", async (req, res) => {
  const schema = z.object({
    cardBrand: z.enum(["Visa", "Mastercard", "Verve", "American Express"]),
    lastFour: z.string().regex(/^\d{4}$/),
    expiryMonth: z.number().int().min(1).max(12),
    expiryYear: z
      .number()
      .int()
      .min(new Date().getFullYear())
      .max(new Date().getFullYear() + 20),
  });

  const validation = schema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid test card details.",
    });
  }

  const { cardBrand, lastFour, expiryMonth, expiryYear } = validation.data;

  const now = new Date();
  if (
    expiryYear < now.getFullYear() ||
    (expiryYear === now.getFullYear() && expiryMonth < now.getMonth() + 1)
  ) {
    return res.status(400).json({
      success: false,
      message: "This card has expired.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock this user's existing card records while adding a card.
    await client.query(
      "SELECT id FROM payment_cards WHERE user_id = $1 FOR UPDATE",
      [req.user.id],
    );

    const defaultCheck = await client.query(
      "SELECT id FROM payment_cards WHERE user_id = $1 AND is_default = TRUE",
      [req.user.id],
    );

    const isDefault = defaultCheck.rows.length === 0;

    // This is a development placeholder, not a real provider token.
    const providerToken = `dev_card_${crypto.randomUUID()}`;

    const result = await client.query(
      `INSERT INTO payment_cards (
        id,
        user_id,
        provider_token,
        card_brand,
        last_four,
        expiry_month,
        expiry_year,
        is_default
      )
      VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING
        id,
        card_brand,
        last_four,
        expiry_month,
        expiry_year,
        is_default,
        created_at`,
      [
        req.user.id,
        providerToken,
        cardBrand,
        lastFour,
        expiryMonth,
        expiryYear,
        isDefault,
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Development test card added successfully.",
      card: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add card error:", error);

    res.status(500).json({
      success: false,
      message: "Could not add this card.",
    });
  } finally {
    client.release();
  }
});

// PATCH: Set a saved card as default
router.patch("/:id/default", async (req, res) => {
  const { id } = req.params;

  if (!z.string().uuid().safeParse(id).success) {
    return res.status(400).json({
      success: false,
      message: "Invalid card ID.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const card = await client.query(
      "SELECT id FROM payment_cards WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [id, req.user.id],
    );

    if (card.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Card not found.",
      });
    }

    await client.query(
      "UPDATE payment_cards SET is_default = FALSE WHERE user_id = $1",
      [req.user.id],
    );

    await client.query(
      "UPDATE payment_cards SET is_default = TRUE WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Default card updated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Set default card error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update the default card.",
    });
  } finally {
    client.release();
  }
});

// DELETE: Remove a saved card
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!z.string().uuid().safeParse(id).success) {
    return res.status(400).json({
      success: false,
      message: "Invalid card ID.",
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM payment_cards
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Card not found.",
      });
    }

    res.json({
      success: true,
      message: "Card removed successfully.",
    });
  } catch (error) {
    console.error("Delete card error:", error);

    res.status(500).json({
      success: false,
      message: "Could not remove this card.",
    });
  }
});

module.exports = router;
