const userRepository = require('../repositories/user.repository');
const scoreRepository = require('../repositories/score.repository');
const { getStoredProfile } = require('../profileStore');
const { calculateHighestLeaderboardRank } = require("./leaderboard.service")


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

const dashboardErrorMessages = {
  image: 'That image could not be saved. Try a smaller file or image dimensions.',
  update: 'We could not save your profile changes.',
  user: 'We could not find that account.'
};

module.exports = {
  getDashboardProfile,
  dashboardErrorMessages
};