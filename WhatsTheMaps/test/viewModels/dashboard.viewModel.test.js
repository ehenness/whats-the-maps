const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReadOnlyDashboardViewModel } = require('../../viewModels/dashboard.viewModel');

test('buildReadOnlyDashboardViewModel locks the dashboard into read-only mode', () => {
  const data = {
    profile: {
      userId: 12,
      username: 'player12',
      bio: 'Competitive player',
      profileImageUrl: null
    },
    stats: {
      quizzesPlayed: 7,
      totalPoints: 4100,
      bestScore: 900,
      averageScore: 586,
      highestLeaderboardRank: 3
    }
  };

  assert.deepEqual(buildReadOnlyDashboardViewModel(data), {
    isEditing: false,
    isReadOnlyProfile: true,
    isOwnProfile: false,
    profile: data.profile,
    presetAvatars: [],
    stats: data.stats,
    successMessage: null,
    errorMessage: null
  });
});
