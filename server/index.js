require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const pool = require("./db");
const authRoutes = require("./routes/auth");
const userRoutes = require('./routes/user');
const walletRoutes = require('./routes/wallet');
const transactionRoutes = require('./routes/transactions');
const transferRoutes = require('./routes/transfers');
const beneficiaryRoutes = require("./routes/beneficiaries");

const cardRoutes = require("./routes/cards");
const notificationsRoutes = require("./routes/notifications");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

// Limit repeated authentication requests
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GoodPay API is running!",
  });
});

// Database connection test
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "GoodPay database connected successfully!",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

// Authentication routes
app.use("/api/auth", authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transfers', transferRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/notifications", notificationsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`GoodPay API running on port ${PORT}`);
});
