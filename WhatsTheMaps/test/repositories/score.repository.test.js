const test = require('node:test');
const assert = require('node:assert/strict');

const repositoryPath = require.resolve('../../repositories/score.repository');
const runQueryPath = require.resolve('../../lib/runQuery');
const dbPath = require.resolve('../../repositories/db');

function loadScoreRepository({ runQueryImpl = async () => [], queryImpl } = {}) {
  const previousRepository = require.cache[repositoryPath];
  const previousRunQuery = require.cache[runQueryPath];
  const previousDb = require.cache[dbPath];

  delete require.cache[repositoryPath];
  require.cache[runQueryPath] = {
    id: runQueryPath,
    filename: runQueryPath,
    loaded: true,
    exports: runQueryImpl
  };
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      query: queryImpl || ((sql, params, callback) => callback(null, { insertId: 1 }))
    }
  };

  const scoreRepository = require('../../repositories/score.repository');

  return {
    scoreRepository,
    restore() {
      delete require.cache[repositoryPath];

      if (previousRepository) {
        require.cache[repositoryPath] = previousRepository;
      }

      if (previousRunQuery) {
        require.cache[runQueryPath] = previousRunQuery;
      } else {
        delete require.cache[runQueryPath];
      }

      if (previousDb) {
        require.cache[dbPath] = previousDb;
      } else {
        delete require.cache[dbPath];
      }
    }
  };
}

test('getUserStats returns the first row from the stats query', async () => {
  const calls = [];
  const { scoreRepository, restore } = loadScoreRepository({
    runQueryImpl: async (sql, params) => {
      calls.push({ sql, params });
      return [{ quizzesPlayed: 7, totalPoints: 4100 }];
    }
  });

  try {
    const result = await scoreRepository.getUserStats(12);

    assert.equal(calls.length, 1);
    assert.match(calls[0].sql, /COUNT\(\*\) AS quizzesPlayed/);
    assert.deepEqual(calls[0].params, [12]);
    assert.deepEqual(result, { quizzesPlayed: 7, totalPoints: 4100 });
  } finally {
    restore();
  }
});

test('getUserStats falls back to an empty object when the query returns no rows', async () => {
  const { scoreRepository, restore } = loadScoreRepository({
    runQueryImpl: async () => []
  });

  try {
    const result = await scoreRepository.getUserStats(12);
    assert.deepEqual(result, {});
  } finally {
    restore();
  }
});

test('getScoreHistory forwards the ordered leaderboard query', async () => {
  const calls = [];
  const history = [{ userId: 12, score: 900 }];
  const { scoreRepository, restore } = loadScoreRepository({
    runQueryImpl: async (sql, params) => {
      calls.push({ sql, params });
      return history;
    }
  });

  try {
    const result = await scoreRepository.getScoreHistory();

    assert.equal(calls.length, 1);
    assert.match(calls[0].sql, /ORDER BY s\.played_at ASC, s\.id ASC/);
    assert.equal(calls[0].params, undefined);
    assert.deepEqual(result, history);
  } finally {
    restore();
  }
});

test('saveScore resolves inserted results', async () => {
  const queries = [];
  const { scoreRepository, restore } = loadScoreRepository({
    queryImpl: (sql, params, callback) => {
      queries.push({ sql, params });
      callback(null, { insertId: 44, affectedRows: 1 });
    }
  });

  try {
    const result = await scoreRepository.saveScore(12, 900);

    assert.deepEqual(queries, [
      {
        sql: 'INSERT INTO scores (user_id, score) VALUES (?, ?)',
        params: [12, 900]
      }
    ]);
    assert.deepEqual(result, { insertId: 44, affectedRows: 1 });
  } finally {
    restore();
  }
});

test('saveScore rejects database errors', async () => {
  const { scoreRepository, restore } = loadScoreRepository({
    queryImpl: (sql, params, callback) => {
      callback(new Error('insert failed'));
    }
  });

  try {
    await assert.rejects(
      () => scoreRepository.saveScore(12, 900),
      /insert failed/
    );
  } finally {
    restore();
  }
});
