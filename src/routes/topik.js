const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { awardXp } = require("../utils/gamification");
const { publicQuestions, scoreAnswers } = require("../data/topikQuestions");

const router = express.Router();

const XP_MOCK_EXAM = 20;

// Public: fetch a question set (answers stripped) for level "I" or "II".
router.get("/questions/:level", (req, res) => {
  const level = req.params.level;
  const qs = publicQuestions(level);
  if (!qs) return res.status(404).json({ error: "Unknown TOPIK level. Use 'I' or 'II'." });
  res.json({ level, questions: qs });
});

// Authenticated: submit answers, get scored, update readiness + XP.
router.post("/attempts", requireAuth, async (req, res) => {
  try {
    const { level, answers } = req.body; // answers: [{ id, chosen }]
    if (!level || !Array.isArray(answers)) {
      return res.status(400).json({ error: "level and answers[] are required." });
    }

    const result = scoreAnswers(level, answers);
    if (!result) return res.status(404).json({ error: "Unknown TOPIK level." });

    await db.query(
      `INSERT INTO topik_attempts (user_id, level, score, correct_count, total_count, skill_breakdown)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.userId, level, result.score, result.correctCount, result.total, JSON.stringify(result.skillBreakdown)]
    );

    const bump = Math.round(result.score / 5);
    const readinessRes = await db.query(
      `UPDATE topik_readiness SET readiness = LEAST(100, readiness + $1)
       WHERE user_id = $2 AND level = $3 RETURNING readiness`,
      [bump, req.userId, level]
    );

    const gains = await awardXp(req.userId, XP_MOCK_EXAM);

    res.json({
      ...result,
      readiness: readinessRes.rows[0]?.readiness ?? null,
      ...gains,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not score TOPIK attempt." });
  }
});

// Authenticated: past attempt history, most recent first.
router.get("/attempts", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT level, score, correct_count, total_count, skill_breakdown, taken_at
       FROM topik_attempts WHERE user_id = $1 ORDER BY taken_at DESC LIMIT 50`,
      [req.userId]
    );
    res.json({ attempts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load attempt history." });
  }
});

module.exports = router;
