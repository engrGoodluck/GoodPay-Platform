const express = require("express");
const { z } = require("zod");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

const beneficiarySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
});

// Get all beneficiaries belonging to the logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, bank_name, created_at
       FROM beneficiaries
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    return res.json({
      success: true,
      beneficiaries: result.rows,
    });
  } catch (error) {
    console.error("Get beneficiaries error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve beneficiaries.",
    });
  }
});

// Add a new beneficiary
router.post("/", authenticateToken, async (req, res) => {
  const validation = beneficiarySchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid name and email address.",
    });
  }

  const name = validation.data.name;
  const email = validation.data.email.toLowerCase();

  try {
    const result = await pool.query(
      `INSERT INTO beneficiaries (user_id, name, email)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, bank_name, created_at`,
      [req.user.id, name, email],
    );

    return res.status(201).json({
      success: true,
      message: "Beneficiary added successfully.",
      beneficiary: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This beneficiary email has already been saved.",
      });
    }

    console.error("Add beneficiary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to add beneficiary.",
    });
  }
});

// Update an existing beneficiary
router.patch("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (!z.string().uuid().safeParse(id).success) {
    return res.status(400).json({
      success: false,
      message: "Invalid beneficiary ID.",
    });
  }

  const validation = beneficiarySchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid name and email address.",
    });
  }

  const name = validation.data.name;
  const email = validation.data.email.toLowerCase();

  try {
    const result = await pool.query(
      `UPDATE beneficiaries
       SET name = $1, email = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, email, bank_name, created_at`,
      [name, email, id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Beneficiary not found.",
      });
    }

    return res.json({
      success: true,
      message: "Beneficiary updated successfully.",
      beneficiary: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This beneficiary email has already been saved.",
      });
    }

    console.error("Update beneficiary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update beneficiary.",
    });
  }
});

// Delete a beneficiary
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (!z.string().uuid().safeParse(id).success) {
    return res.status(400).json({
      success: false,
      message: "Invalid beneficiary ID.",
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM beneficiaries
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Beneficiary not found.",
      });
    }

    return res.json({
      success: true,
      message: "Beneficiary deleted successfully.",
    });
  } catch (error) {
    console.error("Delete beneficiary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete beneficiary.",
    });
  }
});

module.exports = router;
