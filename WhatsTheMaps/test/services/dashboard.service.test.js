const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath = require.resolve('../../services/dashboard.service');
const userRepositoryPath = require.resolve('../../repositories/user.repository');
const scoreRepositoryPath = require.resolve('../../repositories/score.repository');
const profileStorePath = require.resolve('../../profileStore');
const dashboardUtilPath = require.resolve('../../utils/dashboard.util');

function loadDashboardService({
  getUserById = async () => null,
  getUserStats = async () => ({}),
  getScoreHistory = async () => [],
  getStoredProfile = () => null,
  calculateHighestLeaderboardRank = () => null
} = {}) {
  const previousService = require.cache[servicePath];
  const previousUserRepository = require.cache[userRepositoryPath];
  const previousScoreRepository = require.cache[scoreRepositoryPath];
  const previousProfileStore = require.cache[profileStorePath];
  const previousDashboardUtil = require.cache[dashboardUtilPath];

  delete require.cache[servicePath];
  require.cache[userRepositoryPath] = {
    id: userRepositoryPath,
    filename: userRepositoryPath,
    loaded: true,
    exports: { getUserById }
  };
  require.cache[scoreRepositoryPath] = {
    id: scoreRepositoryPath,
    filename: scoreRepositoryPath,
    loaded: true,
    exports: { getUserStats, getScoreHistory }
  };
  require.cache[profileStorePath] = {
    id: profileStorePath,
    filename: profileStorePath,
    loaded: true,
    exports: { getStoredProfile }
  };
  require.cache[dashboardUtilPath] = {
    id: dashboardUtilPath,
    filename: dashboardUtilPath,
    loaded: true,
    exports: { calculateHighestLeaderboardRank }
  };

  const dashboardService = require('../../services/dashboard.service');

  return {
    dashboardService,
    restore() {
      delete require.cache[servicePath];

      if (previousService) {
        require.cache[servicePath] = previousService;
      }

      if (previousUserRepository) {
        require.cache[userRepositoryPath] = previousUserRepository;
      } else {
        delete require.cache[userRepositoryPath];
      }

      if (previousScoreRepository) {
        require.cache[scoreRepositoryPath] = previousScoreRepository;
      } else {
        delete require.cache[scoreRepositoryPath];
      }

      if (previousProfileStore) {
        require.cache[profileStorePath] = previousProfileStore;
      } else {
        delete require.cache[profileStorePath];
      }

      if (previousDashboardUtil) {
        require.cache[dashboardUtilPath] = previousDashboardUtil;
      } else {
        delete require.cache[dashboardUtilPath];
      }
    }
  };
}

test('getDashboardProfile returns null for missing users', async () => {
  const { dashboardService, restore } = loadDashboardService();

  try {
    const result = await dashboardService.getDashboardProfile(12);
    assert.equal(result, null);
  } finally {
    restore();
  }
});

test('getDashboardProfile returns null for deleted users', async () => {
  const { dashboardService, restore } = loadDashboardService({
    getUserById: async () => ({ id: 12, is_deleted: true })
  });

  try {
    const result = await dashboardService.getDashboardProfile(12);
    assert.equal(result, null);
  } finally {
    restore();
  }
});

test('getDashboardProfile combines user, stored profile, and numeric stats', async () => {
  const calls = [];
  const { dashboardService, restore } = loadDashboardService({
    getUserById: async (userId) => {
      calls.push(['getUserById', userId]);
      return {
        id: '12',
        username: 'player12',
        is_deleted: false
      };
    },
    getStoredProfile: (userId) => {
      calls.push(['getStoredProfile', userId]);
      return {
        bio: 'Space City fan',
        profileImageUrl: '/images/avatars/Dr_Horn2.jpeg'
      };
    },
    getUserStats: async (userId) => {
      calls.push(['getUserStats', userId]);
      return {
        quizzesPlayed: '7',
        totalPoints: '4100',
        bestScore: '900',
        averageScore: '585.7'
      };
    },
    getScoreHistory: async () => {
      calls.push(['getScoreHistory']);
      return [{ userId: 12, score: 900 }];
    },
    calculateHighestLeaderboardRank: (userId, scoreHistory) => {
      calls.push(['calculateHighestLeaderboardRank', userId, scoreHistory]);
      return 3;
    }
  });

  try {
    const result = await dashboardService.getDashboardProfile(12);

    assert.deepEqual(calls, [
      ['getUserById', 12],
      ['getStoredProfile', 12],
      ['getUserStats', 12],
      ['getScoreHistory'],
      ['calculateHighestLeaderboardRank', 12, [{ userId: 12, score: 900 }]]
    ]);
    assert.deepEqual(result, {
      profile: {
        userId: 12,
        username: 'player12',
        bio: 'Space City fan',
        profileImageUrl: '/images/avatars/Dr_Horn2.jpeg'
      },
      stats: {
        quizzesPlayed: 7,
        totalPoints: 4100,
        bestScore: 900,
        averageScore: 586,
        highestLeaderboardRank: 3
      }
    });
  } finally {
    restore();
  }
});

test('getDashboardProfile falls back to empty profile metadata and zeroed stats', async () => {
  const { dashboardService, restore } = loadDashboardService({
    getUserById: async () => ({
      id: 24,
      username: 'player24',
      is_deleted: false
    }),
    getUserStats: async () => ({}),
    getStoredProfile: () => null,
    calculateHighestLeaderboardRank: () => null
  });

  try {
    const result = await dashboardService.getDashboardProfile(24);

    assert.deepEqual(result, {
      profile: {
        userId: 24,
        username: 'player24',
        bio: '',
        profileImageUrl: null
      },
      stats: {
        quizzesPlayed: 0,
        totalPoints: 0,
        bestScore: 0,
        averageScore: 0,
        highestLeaderboardRank: null
      }
    });
  } finally {
    restore();
  }
});
