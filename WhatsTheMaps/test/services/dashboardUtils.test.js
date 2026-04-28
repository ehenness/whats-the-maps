/** AI (Codex) was used to help write tests */

const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateHighestLeaderboardRank } = require('../../utils/dashboard.util');

test('calculateHighestLeaderboardRank returns the best rank a player ever reached', () => {
  const highestRank = calculateHighestLeaderboardRank(2, [
    { userId: 1, score: 150 },
    { userId: 2, score: 100 },
    { userId: 3, score: 90 },
    { userId: 2, score: 180 },
    { userId: 1, score: 175 }
  ]);

  assert.equal(highestRank, 1);
});

test('calculateHighestLeaderboardRank ignores non-improving scores and returns null for absent players', () => {
  const scoreHistory = [
    { userId: '4', score: '90' },
    { userId: '4', score: '70' },
    { userId: '5', score: '120' }
  ];

  assert.equal(calculateHighestLeaderboardRank(4, scoreHistory), 1);
  assert.equal(calculateHighestLeaderboardRank(99, scoreHistory), null);
});
