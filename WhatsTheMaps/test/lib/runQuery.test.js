const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const runQuery = require('../../lib/runQuery');
const db = require('../../repositories/db');

afterEach(() => sinon.restore());

test('runQuery resolves with database results', async () => {
  sinon.stub(db, 'query').callsFake((sql, params, callback) => {
    callback(null, [{ id: 1 }]);
  });

  const result = await runQuery('SELECT * FROM users WHERE id = ?', [1]);

  assert.deepEqual(result, [{ id: 1 }]);
});

test('runQuery rejects when the database reports an error', async () => {
  sinon.stub(db, 'query').callsFake((sql, params, callback) => {
    callback(new Error('query failed'));
  });

  await assert.rejects(
    () => runQuery('SELECT * FROM users WHERE id = ?', [1]),
    /query failed/
  );
});
