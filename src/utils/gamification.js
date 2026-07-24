const db = require("../db");
const { nextStreak } = require("./streak");
const { BADGES } = require("../data/badges");

// Awards XP, updates the daily streak, then checks for newly-earned badges.
// Returns { xp, streak, newBadges } so a route can report what changed.
async function awardXp(userId, amount) {
  const userRes = await db.query("SELECT xp, streak, last_active_date FROM users WHERE id = $1", [userId]);
  const current = userRes.rows[0];
  if (!current) throw new Error("User not found");

  const { streak, dateStr } = nextStreak(current.streak, current.last_active_date);
  const newXp = current.xp + amount;

  await db.query(
    "UPDATE users SET xp = $1, streak = $2, last_active_date = $3 WHERE id = $4",
    [newXp, streak, dateStr, userId]
  );

  const newBadges = await checkBadges(userId, { xp: newXp, streak });
  return { xp: newXp, streak, newBadges };
}

async function checkBadges(userId, extra = {}) {
  const [hangulRes, wordsRes, topikRes, earnedRes] = await Promise.all([
    db.query("SELECT COUNT(*)::int AS c FROM hangul_progress WHERE user_id = $1", [userId]),
    db.query("SELECT COUNT(*)::int AS c FROM word_progress WHERE user_id = $1", [userId]),
    db.query("SELECT level, readiness FROM topik_readiness WHERE user_id = $1", [userId]),
    db.query("SELECT badge_name FROM badges WHERE user_id = $1", [userId]),
  ]);

  const topikReadiness = {};
  topikRes.rows.forEach((r) => { topikReadiness[r.level] = r.readiness; });
  const alreadyEarned = new Set(earnedRes.rows.map((r) => r.badge_name));

  const snapshot = {
    hangulLearned: hangulRes.rows[0].c,
    wordsLearned: wordsRes.rows[0].c,
    streak: extra.streak ?? 0,
    topikReadiness,
  };

  const newlyEarned = [];
  for (const badge of BADGES) {
    if (!alreadyEarned.has(badge.name) && badge.check(snapshot)) {
      await db.query(
        "INSERT INTO badges (user_id, badge_name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [userId, badge.name]
      );
      newlyEarned.push(badge.name);
    }
  }
  return newlyEarned;
}

module.exports = { awardXp, checkBadges };
