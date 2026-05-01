const test = require('node:test');
const assert = require('node:assert/strict');

const repositoryPath = require.resolve('../../repositories/user.repository');
const runQueryPath = require.resolve('../../lib/runQuery');

function loadUserRepositoryWithRunQuery(runQueryImpl) {
  const previousRepository = require.cache[repositoryPath];
  const previousRunQuery = require.cache[runQueryPath];

  delete require.cache[repositoryPath];
  require.cache[runQueryPath] = {
    id: runQueryPath,
    filename: runQueryPath,
    loaded: true,
    exports: runQueryImpl
  };

  const userRepository = require('../../repositories/user.repository');

  return {
    userRepository,
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
    }
  };
}

test('user repository lookups use the expected SQL and return the first row', async () => {
  const calls = [];
  const { userRepository, restore } = loadUserRepositoryWithRunQuery(async (sql, params) => {
    calls.push({ sql, params });
    return [{ id: 12, username: 'player12' }, { id: 99, username: 'ignored' }];
  });

  try {
    const byUsername = await userRepository.getUserByUsername('player12');
    const byEmail = await userRepository.getUserByEmail('player@example.com');
    const byId = await userRepository.getUserById(12);

    assert.deepEqual(calls, [
      {
        sql: 'SELECT * FROM users WHERE username = ? AND is_deleted = FALSE',
        params: ['player12']
      },
      {
        sql: 'SELECT * FROM users WHERE email = ? AND is_deleted = FALSE',
        params: ['player@example.com']
      },
      {
        sql: 'SELECT * FROM users WHERE id = ?',
        params: [12]
      }
    ]);
    assert.deepEqual(byUsername, { id: 12, username: 'player12' });
    assert.deepEqual(byEmail, { id: 12, username: 'player12' });
    assert.deepEqual(byId, { id: 12, username: 'player12' });
  } finally {
    restore();
  }
});

test('createUser returns the inserted user id and deleteUser forwards the update query', async () => {
  const calls = [];
  const { userRepository, restore } = loadUserRepositoryWithRunQuery(async (sql, params) => {
    calls.push({ sql, params });

    if (sql.startsWith('INSERT INTO users')) {
      return { insertId: 77 };
    }

    return { affectedRows: 1 };
  });

  try {
    const insertId = await userRepository.createUser('player77', 'player77@example.com', 'hashed-password');
    const deleteResult = await userRepository.deleteUser(77);

    assert.equal(insertId, 77);
    assert.deepEqual(deleteResult, { affectedRows: 1 });
    assert.deepEqual(calls, [
      {
        sql: 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        params: ['player77', 'player77@example.com', 'hashed-password']
      },
      {
        sql: 'UPDATE users SET is_deleted = TRUE WHERE id = ?',
        params: [77]
      }
    ]);
  } finally {
    restore();
  }
});
