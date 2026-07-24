const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

const VALID_LEVELS = ["beginner", "some", "intermediate"];
const VALID_STYLES = ["visual", "quiz", "practice"];

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, level, learningStyle } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    const finalLevel = VALID_LEVELS.includes(level) ? level : "beginner";
    const finalStyle = VALID_STYLES.includes(learningStyle) ? learningStyle : "visual";

    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, level, learning_style)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, level, learning_style, xp, streak, show_leaderboard, created_at`,
      [name, email.toLowerCase(), passwordHash, finalLevel, finalStyle]
    );
    const user = result.rows[0];

    await db.query("INSERT INTO skill_scores (user_id) VALUES ($1)", [user.id]);
    await db.query(
      "INSERT INTO topik_readiness (user_id, level, readiness) VALUES ($1, 'I', 0), ($1, 'II', 0)",
      [user.id]
    );

    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const result = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user.id);
    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not log in." });
  }
});

module.exports = router;
