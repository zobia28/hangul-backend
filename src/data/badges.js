// Each badge's `check` receives a snapshot of the user's current stats
// (after the triggering action has already been applied) and returns
// whether it should be (or already is) earned.
const BADGES = [
  {
    name: "Hangul Master",
    desc: "Learn every consonant & vowel",
    check: (snap) => snap.hangulLearned >= 24,
  },
  {
    name: "First 100 Words",
    desc: "Learn 100 vocabulary words",
    check: (snap) => snap.wordsLearned >= 100,
  },
  {
    name: "7-Day Streak",
    desc: "Practice 7 days in a row",
    check: (snap) => snap.streak >= 7,
  },
  {
    name: "TOPIK I Ready",
    desc: "Reach TOPIK I readiness",
    check: (snap) => (snap.topikReadiness?.I || 0) >= 70,
  },
];

module.exports = { BADGES };
