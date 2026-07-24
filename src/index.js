require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const progressRoutes = require("./routes/progress");
const topikRoutes = require("./routes/topik");
const leaderboardRoutes = require("./routes/leaderboard");

const app = express();

app.use(helmet());
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
}));

// Basic protection against brute-force login/signup attempts.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use("/api/auth", authLimiter);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/topik", topikRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));

// Centralized error handler as a safety net for anything routes don't catch.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`HangulPath API listening on port ${PORT}`);
});
module.exports = app;
