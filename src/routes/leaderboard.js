const express = require("express");
const db = require("../db");

const router = express.Router();

// Public leaderboard — only includes users who opted in via show_leaderboard.
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const result = await db.query(
      `SELECT name, xp FROM users WHERE show_leaderboard = true
       ORDER BY xp DESC LIMIT $1`,
      [limit]
    );
    res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load leaderboard." });
  }
});

module.exports = router;
