// backend/server.js (refactored)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./src/routes/auth");
const habitRoutes = require("./src/routes/habits");
const { authMiddleware } = require("./src/middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Basic security headers (minimal)
app.disable("x-powered-by");

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(bodyParser.json());

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// Routes (public)
app.use("/auth", authRoutes);

// Protected routes (require JWT)
app.use("/habits", authMiddleware, habitRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB || "habbitz",
    });
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

start();
