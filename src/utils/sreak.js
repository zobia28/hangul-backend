// Given a user's current streak and the date they last practiced, figure out
// what today's streak should be. Call this any time XP is awarded.
function nextStreak(currentStreak, lastActiveDate) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  if (!lastActiveDate) {
    return { streak: 1, dateStr: todayStr };
  }

  const last = new Date(lastActiveDate);
  const lastStr = last.toISOString().slice(0, 10);

  if (lastStr === todayStr) {
    // Already practiced today — streak unchanged.
    return { streak: currentStreak, dateStr: todayStr };
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((new Date(todayStr) - new Date(lastStr)) / oneDayMs);

  if (diffDays === 1) {
    return { streak: currentStreak + 1, dateStr: todayStr };
  }
  // Missed one or more days — streak resets.
  return { streak: 1, dateStr: todayStr };
}

module.exports = { nextStreak };
