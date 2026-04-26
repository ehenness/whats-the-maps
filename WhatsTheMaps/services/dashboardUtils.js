/** Pure helpers for dashboard leaderboard calculations */
function calculateHighestLeaderboardRank(userId, scoreHistory = []) {
  const bestScoreByUser = new Map();
  let highestRank = null;

  scoreHistory.forEach((entry) => {
    const entryUserId = Number(entry.userId);
    const score = Number(entry.score) || 0;
    const previousBest = bestScoreByUser.get(entryUserId) || 0;

    if (score <= previousBest) {
      return;
    }

    bestScoreByUser.set(entryUserId, score);

    if (entryUserId !== Number(userId)) {
      return;
    }

    const rank =
      1 +
      [...bestScoreByUser.entries()].filter(
        ([otherUserId, otherUserBest]) => otherUserId !== entryUserId && otherUserBest > score
      ).length;

    highestRank = highestRank === null ? rank : Math.min(highestRank, rank);
  });

  return highestRank;
}

module.exports = {
  calculateHighestLeaderboardRank
};
