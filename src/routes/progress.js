const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { awardXp } = require("../utils/gamification");

const router = express.Router();
router.use(requireAuth);

const XP_HANGUL = 5;
const XP_WORD = 3;
const XP_SENTENCE = 4;
const XP_GRAMMAR = 6;

// --- Hangul -------------------------------------------------------------
router.post("/hangul", async (req, res) => {
  try {
    const { character } = req.body;
    if (!character) return res.status(400).json({ error: "character is required." });

    await db.query(
      "INSERT INTO hangul_progress (user_id, character) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.userId, character]
    );
    const gains = await awardXp(req.userId, XP_HANGUL);
    res.json({ character, ...gains });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save hangul progress." });
  }
});

// --- Words ----------------------------------------------------------------
router.post("/words", async (req, res) => {
  try {
    const { wordKo, theme } = req.body;
    if (!wordKo || !theme) return res.status(400).json({ error: "wordKo and theme are required." });

    await db.query(
      "INSERT INTO word_progress (user_id, word_ko, theme) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [req.userId, wordKo, theme]
    );
    const gains = await awardXp(req.userId, XP_WORD);
    res.json({ wordKo, ...gains });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save word progress." });
  }
});

// --- Sentences --------------------------------------------------------------
router.post("/sentences", async (req, res) => {
  try {
    const { sentenceKo } = req.body;
    if (!sentenceKo) return res.status(400).json({ error: "sentenceKo is required." });

    await db.query(
      "INSERT INTO sentence_progress (user_id, sentence_ko) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.userId, sentenceKo]
    );
    const gains = await awardXp(req.userId, XP_SENTENCE);
    res.json({ sentenceKo, ...gains });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save sentence progress." });
  }
});

// --- Grammar ----------------------------------------------------------------
router.post("/grammar", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "topic is required." });

    await db.query(
      "INSERT INTO grammar_progress (user_id, topic) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.userId, topic]
    );
    const gains = await awardXp(req.userId, XP_GRAMMAR);
    res.json({ topic, ...gains });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save grammar progress." });
  }
});

// --- Skill scores (pronunciation / writing / listening / reading) -----------
const VALID_SKILLS = ["pronunciation", "writing", "listening", "reading"];

router.post("/skill", async (req, res) => {
  try {
    const { skill, delta, xp } = req.body;
    if (!VALID_SKILLS.includes(skill)) {
      return res.status(400).json({ error: `skill must be one of ${VALID_SKILLS.join(", ")}` });
    }
    const change = Number.isFinite(delta) ? delta : 0;

    const result = await db.query(
      `UPDATE skill_scores SET ${skill} = GREATEST(0, LEAST(100, ${skill} + $1))
       WHERE user_id = $2 RETURNING pronunciation, writing, listening, reading`,
      [change, req.userId]
    );

    const gains = await awardXp(req.userId, Number.isFinite(xp) ? xp : 0);
    res.json({ skills: result.rows[0], ...gains });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update skill score." });
  }
});

module.exports = router;
