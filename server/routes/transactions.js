const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

// Get authenticated user's transactions with pagination and filters
router.get("/", authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );
    const offset = (page - 1) * limit;

    const { search, type, status, startDate, endDate } = req.query;

    const allowedTypes = ["deposit", "withdrawal", "transfer", "payment"];
    const allowedStatuses = ["pending", "successful", "failed", "reversed"];

    if (type && !allowedTypes.includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction type." });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction status." });
    }

    const validDate = (value) =>
      !value ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value)) &&
        new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) ===
          value);

    if (!validDate(startDate) || !validDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD.",
      });
    }

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date.",
      });
    }

    const values = [req.user.id];
    const conditions = ["(sender.user_id = $1 OR recipient.user_id = $1)"];

    const addValue = (value) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (search && search.trim()) {
      const searchParam = addValue(`%${search.trim()}%`);
      conditions.push(
        `(t.reference ILIKE ${searchParam} OR COALESCE(t.description, '') ILIKE ${searchParam})`,
      );
    }

    if (type) conditions.push(`t.transaction_type = ${addValue(type)}`);
    if (status) conditions.push(`t.status = ${addValue(status)}`);
    if (startDate)
      conditions.push(`t.created_at >= ${addValue(startDate)}::date`);
    if (endDate) {
      conditions.push(
        `t.created_at < (${addValue(endDate)}::date + INTERVAL '1 day')`,
      );
    }

    const whereClause = conditions.join(" AND ");

    const joins = `
      FROM transactions t
      LEFT JOIN wallets sender ON sender.id = t.sender_wallet_id
      LEFT JOIN wallets recipient ON recipient.id = t.recipient_wallet_id
      WHERE ${whereClause}
    `;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total ${joins}`,
      values,
    );

    const total = countResult.rows[0].total;

    const limitParam = addValue(limit);
    const offsetParam = addValue(offset);

    const result = await pool.query(
      `SELECT
         t.id,
         t.reference,
         t.currency,
         t.amount,
         t.transaction_type,
         t.status,
         t.description,
         t.created_at,
         CASE WHEN sender.user_id = $1 THEN 'debit' ELSE 'credit' END AS direction
       ${joins}
       ORDER BY t.created_at DESC
       LIMIT ${limitParam}
       OFFSET ${offsetParam}`,
      values,
    );

    return res.json({
      success: true,
      transactions: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Transaction retrieval error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve transactions.",
    });
  }
});

// Get the authenticated user's financial summary
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const range = req.query.range || "7days";

    const allowedRanges = ["today", "7days", "30days", "90days", "all"];

    if (!allowedRanges.includes(range)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range.",
      });
    }

    const result = await pool.query(
      `SELECT
         COALESCE(SUM(
           CASE WHEN recipient.user_id = $1 THEN t.amount ELSE 0 END
         ), 0) AS total_income,
         COALESCE(SUM(
           CASE WHEN sender.user_id = $1 THEN t.amount ELSE 0 END
         ), 0) AS total_expenses
       FROM transactions t
       LEFT JOIN wallets sender ON sender.id = t.sender_wallet_id
       LEFT JOIN wallets recipient ON recipient.id = t.recipient_wallet_id
       WHERE (sender.user_id = $1 OR recipient.user_id = $1)
         AND t.status = 'successful'
         AND t.currency = 'NGN'
         AND (
           $2 = 'all'
           OR ($2 = 'today' AND t.created_at >= CURRENT_DATE)
           OR ($2 = '7days' AND t.created_at >= CURRENT_DATE - INTERVAL '6 days')
           OR ($2 = '30days' AND t.created_at >= CURRENT_DATE - INTERVAL '29 days')
           OR ($2 = '90days' AND t.created_at >= CURRENT_DATE - INTERVAL '89 days')
         )
         AND t.created_at < CURRENT_DATE + INTERVAL '1 day'`,
      [req.user.id, range],
    );

    return res.json({
      success: true,
      summary: result.rows[0],
    });
  } catch (error) {
    console.error("Transaction summary error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve financial summary.",
    });
  }
});

// Get the authenticated user's monthly financial activity
router.get("/monthly-summary", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `WITH months AS (
         SELECT generate_series(
           date_trunc('month', CURRENT_DATE) - INTERVAL '6 months',
           date_trunc('month', CURRENT_DATE),
           INTERVAL '1 month'
         ) AS month_start
       ),
       monthly_totals AS (
         SELECT
           date_trunc('month', t.created_at) AS month_start,
           SUM(CASE WHEN recipient.user_id = $1 THEN t.amount ELSE 0 END) AS income,
           SUM(CASE WHEN sender.user_id = $1 THEN t.amount ELSE 0 END) AS expenses
         FROM transactions t
         LEFT JOIN wallets sender ON sender.id = t.sender_wallet_id
         LEFT JOIN wallets recipient ON recipient.id = t.recipient_wallet_id
         WHERE (sender.user_id = $1 OR recipient.user_id = $1)
           AND t.status = 'successful'
           AND t.currency = 'NGN'
           AND t.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '6 months'
         GROUP BY date_trunc('month', t.created_at)
       )
       SELECT
         TO_CHAR(months.month_start, 'Mon') AS month,
         COALESCE(monthly_totals.income, 0) AS income,
         COALESCE(monthly_totals.expenses, 0) AS expenses
       FROM months
       LEFT JOIN monthly_totals ON monthly_totals.month_start = months.month_start
       ORDER BY months.month_start`,
      [req.user.id],
    );

    return res.json({ success: true, monthlySummary: result.rows });
  } catch (error) {
    console.error("Monthly summary error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve monthly financial activity.",
    });
  }
});

// Get the authenticated user's daily financial activity
router.get("/daily-summary", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '29 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS day_start
      ),
      daily_totals AS (
        SELECT
          DATE(t.created_at) AS day_start,
          SUM(CASE WHEN recipient.user_id = $1 THEN t.amount ELSE 0 END) AS income,
          SUM(CASE WHEN sender.user_id = $1 THEN t.amount ELSE 0 END) AS expenses
        FROM transactions t
        LEFT JOIN wallets sender ON sender.id = t.sender_wallet_id
        LEFT JOIN wallets recipient ON recipient.id = t.recipient_wallet_id
        WHERE (sender.user_id = $1 OR recipient.user_id = $1)
          AND t.status = 'successful'
          AND t.currency = 'NGN'
          AND t.created_at >= CURRENT_DATE - INTERVAL '29 days'
          AND t.created_at < CURRENT_DATE + INTERVAL '1 day'
        GROUP BY DATE(t.created_at)
      )
      SELECT
        TO_CHAR(days.day_start, 'DD Mon') AS day,
        COALESCE(daily_totals.income, 0) AS income,
        COALESCE(daily_totals.expenses, 0) AS expenses
      FROM days
      LEFT JOIN daily_totals ON daily_totals.day_start = days.day_start
      ORDER BY days.day_start`,
      [req.user.id],
    );

    return res.json({ success: true, dailySummary: result.rows });
  } catch (error) {
    console.error("Daily summary error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch daily financial summary.",
    });
  }
});

// Get details of a single transaction belonging to the authenticated user
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.reference,
         t.currency,
         t.amount,
         t.transaction_type,
         t.status,
         t.description,
         t.created_at,
         sender_user.first_name AS sender_first_name,
         sender_user.last_name AS sender_last_name,
         sender_user.email AS sender_email,
         recipient_user.first_name AS recipient_first_name,
         recipient_user.last_name AS recipient_last_name,
         recipient_user.email AS recipient_email,
         CASE WHEN sender_wallet.user_id = $2 THEN 'debit' ELSE 'credit' END AS direction
       FROM transactions t
       LEFT JOIN wallets sender_wallet ON sender_wallet.id = t.sender_wallet_id
       LEFT JOIN users sender_user ON sender_user.id = sender_wallet.user_id
       LEFT JOIN wallets recipient_wallet ON recipient_wallet.id = t.recipient_wallet_id
       LEFT JOIN users recipient_user ON recipient_user.id = recipient_wallet.user_id
       WHERE t.id = $1
         AND (sender_wallet.user_id = $2 OR recipient_wallet.user_id = $2)
       LIMIT 1`,
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    console.error("Transaction details error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve transaction details.",
    });
  }
});

module.exports = router;
