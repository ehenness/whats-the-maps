const userRepository = require('../repositories/user.repository');
const scoreRepository = require('../repositories/score.repository');
const { getStoredProfile } = require('../profileStore');

function calculateHighestLeaderboardRank(userId, scoreHistory = []) {
  const bestScoreByUser = new Map();
  let highestRank = null;

  scoreHistory.forEach((entry) => {
    const entryUserId = Number(entry.userId);
    const score = Number(entry.score) || 0;
    const previousBest = bestScoreByUser.get(entryUserId) || 0;

    if (score <= previousBest) return;

    bestScoreByUser.set(entryUserId, score);

    if (entryUserId !== Number(userId)) return;

    const rank =
      1 +
      [...bestScoreByUser.entries()].filter(
        ([otherUserId, otherBest]) =>
          otherUserId !== entryUserId && otherBest > score
      ).length;

    highestRank = highestRank === null ? rank : Math.min(highestRank, rank);
  });

  return highestRank;
}

async function getDashboardStats(userId) {
  const userStats = await scoreRepository.getUserStats(userId);
  const scoreHistory = await scoreRepository.getScoreHistory();

  return {
    quizzesPlayed: Number(userStats.quizzesPlayed) || 0,
    totalPoints: Number(userStats.totalPoints) || 0,
    bestScore: Number(userStats.bestScore) || 0,
    averageScore: Math.round(Number(userStats.averageScore) || 0),
    highestLeaderboardRank: calculateHighestLeaderboardRank(userId, scoreHistory)
  };
}

async function getDashboardProfile(userId) {
  const user = await userRepository.getUserById(userId);

  if (!user || user.is_deleted) return null;

  const storedProfile = getStoredProfile(userId) || {};
  const stats = await getDashboardStats(userId);

  return {
    profile: {
      userId: Number(user.id),
      username: user.username,
      bio: storedProfile.bio || '',
      profileImageUrl: storedProfile.profileImageUrl || null
    },
    stats
  };
}

module.exports = {
  getDashboardProfile
};