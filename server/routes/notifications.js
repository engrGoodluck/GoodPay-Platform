const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// GET USER NOTIFICATIONS
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await pool.query(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );

    const unread = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId],
    );

    return res.json({
      success: true,
      notifications: notifications.rows,
      unreadCount: unread.rows[0].unread_count,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
});

// MARK ONE NOTIFICATION AS READ
router.patch("/:id/read", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Mark notification read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification.",
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.patch("/read-all", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id],
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
});

// DELETE ONE NOTIFICATION
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("Delete notification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete notification.",
    });
  }
});

module.exports = router;
