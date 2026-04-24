/** Loads the leaderboard datasets used by the leaderboard page */
const runQuery = require('../lib/runQuery');

const bestScoreLeaderboardSql = `
  SELECT u.id AS user_id, u.username, MAX(s.score) AS high_score
  FROM users u
  JOIN scores s ON u.id = s.user_id
  WHERE u.is_deleted = FALSE
  GROUP BY u.id
  ORDER BY high_score DESC, u.username ASC
  LIMIT 10
`;

const allTimePointsLeaderboardSql = `
  SELECT u.id AS user_id, u.username, COALESCE(SUM(s.score), 0) AS total_points
  FROM users u
  JOIN scores s ON u.id = s.user_id
  WHERE u.is_deleted = FALSE
  GROUP BY u.id
  ORDER BY total_points DESC, u.username ASC
  LIMIT 10
`;

// Leaderboard page shows separate rankings for best single score and cumulative points
async function getLeaderboards() {
  const [bestScores, allTimePoints] = await Promise.all([
    runQuery(bestScoreLeaderboardSql),
    runQuery(allTimePointsLeaderboardSql)
  ]);

  return {
    bestScores,
    allTimePoints
  };
}

module.exports = {
  getLeaderboards
};