const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

// Full profile: everything the dashboard needs in one call.
router.get("/me", async (req, res) => {
  try {
    const userId = req.userId;

    const [userRes, skillsRes, hangulRes, wordsRes, badgesRes, topikRes] = await Promise.all([
      db.query(
        `SELECT id, name, email, level, learning_style, xp, streak, show_leaderboard, created_at
         FROM users WHERE id = $1`,
        [userId]
      ),
      db.query("SELECT pronunciation, writing, listening, reading FROM skill_scores WHERE user_id = $1", [userId]),
      db.query("SELECT character FROM hangul_progress WHERE user_id = $1", [userId]),
      db.query("SELECT word_ko, theme FROM word_progress WHERE user_id = $1", [userId]),
      db.query("SELECT badge_name, earned_at FROM badges WHERE user_id = $1", [userId]),
      db.query("SELECT level, readiness FROM topik_readiness WHERE user_id = $1", [userId]),
    ]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const topikReadiness = { I: 0, II: 0 };
    topikRes.rows.forEach((r) => { topikReadiness[r.level] = r.readiness; });

    res.json({
      user: userRes.rows[0],
      skills: skillsRes.rows[0] || { pronunciation: 40, writing: 40, listening: 40, reading: 40 },
      hangulLearned: hangulRes.rows.map((r) => r.character),
      wordsLearned: wordsRes.rows,
      badges: badgesRes.rows,
      topikReadiness,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load profile." });
  }
});

// Update account-level preferences (level, learning style, leaderboard visibility).
router.patch("/me", async (req, res) => {
  try {
    const { level, learningStyle, showLeaderboard, name } = req.body;
    const fields = [];
    const values = [];
    let i = 1;

    if (level !== undefined) { fields.push(`level = $${i++}`); values.push(level); }
    if (learningStyle !== undefined) { fields.push(`learning_style = $${i++}`); values.push(learningStyle); }
    if (showLeaderboard !== undefined) { fields.push(`show_leaderboard = $${i++}`); values.push(showLeaderboard); }
    if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No updatable fields provided." });
    }

    values.push(req.userId);
    const result = await db.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${i}
       RETURNING id, name, email, level, learning_style, xp, streak, show_leaderboard`,
      values
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update profile." });
  }
});

module.exports = router;
