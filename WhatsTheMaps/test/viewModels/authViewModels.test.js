const test = require('node:test');
const assert = require('node:assert/strict');

const { buildLoginViewModel } = require('../../viewModels/authViewModels');

test('buildLoginViewModel uses empty defaults for a fresh login page', () => {
  assert.deepEqual(buildLoginViewModel(), {
    errorMessage: null,
    email: ''
  });
});

test('buildLoginViewModel preserves provided error and email values', () => {
  assert.deepEqual(
    buildLoginViewModel({
      errorMessage: 'No user found with that email and password',
      email: 'player@example.com'
    }),
    {
      errorMessage: 'No user found with that email and password',
      email: 'player@example.com'
    }
  );
});
