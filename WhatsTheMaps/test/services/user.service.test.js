const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const bcrypt = require('bcrypt');
const userService = require('../../services/user.service');
const userRepository = require('../../repositories/user.repository');
const { deleteStoredProfile, getStoredProfile, saveStoredProfile } = require('../../profileStore');

afterEach(() => sinon.restore());

test('signup hashes the password before creating the user', async () => {
  sinon.stub(bcrypt, 'hash').resolves('hashed-password');
  sinon.stub(userRepository, 'createUser').resolves(42);

  const result = await userService.signup('player1', 'player@example.com', 'secret');

  assert.equal(bcrypt.hash.calledOnceWithExactly('secret', 10), true);
  assert.equal(
    userRepository.createUser.calledOnceWithExactly('player1', 'player@example.com', 'hashed-password'),
    true
  );
  assert.equal(result, 42);
});

test('login returns the user and stored profile when email/password are valid', async () => {
  const userId = 910001;
  const storedProfile = {
    bio: 'Space City fan',
    profileImageUrl: '/images/avatars/Dr_Horn1.jpeg'
  };

  saveStoredProfile(userId, storedProfile);
  sinon.stub(userRepository, 'getUserByEmail').resolves({
    id: userId,
    username: 'player1',
    email: 'player@example.com',
    password: 'hashed-password'
  });
  sinon.stub(bcrypt, 'compare').resolves(true);

  const result = await userService.login('player@example.com', 'secret');

  assert.equal(userRepository.getUserByEmail.calledOnceWithExactly('player@example.com'), true);
  assert.equal(bcrypt.compare.calledOnceWithExactly('secret', 'hashed-password'), true);
  assert.deepEqual(result, {
    user: {
      id: userId,
      username: 'player1',
      email: 'player@example.com',
      password: 'hashed-password'
    },
    storedProfile
  });

  deleteStoredProfile(userId);
});

test('login falls back to username lookup when email lookup misses', async () => {
  sinon.stub(userRepository, 'getUserByEmail').resolves(undefined);
  sinon.stub(userRepository, 'getUserByUsername').resolves({
    id: 22,
    username: 'player1',
    email: 'player@example.com',
    password: 'hashed-password'
  });
  sinon.stub(bcrypt, 'compare').resolves(true);

  const result = await userService.login('player1', 'secret');

  assert.equal(userRepository.getUserByEmail.calledOnceWithExactly('player1'), true);
  assert.equal(userRepository.getUserByUsername.calledOnceWithExactly('player1'), true);
  assert.equal(result.user.username, 'player1');
  assert.deepEqual(result.storedProfile, {});
});

test('login throws when the password is incorrect', async () => {
  sinon.stub(userRepository, 'getUserByEmail').resolves({
    id: 22,
    username: 'player1',
    email: 'player@example.com',
    password: 'hashed-password'
  });
  sinon.stub(bcrypt, 'compare').resolves(false);

  await assert.rejects(
    () => userService.login('player@example.com', 'wrong'),
    /Incorrect password/
  );
});

test('deleteAccount soft deletes the user and removes stored profile data', async () => {
  const userId = 910002;

  saveStoredProfile(userId, {
    bio: 'Ready to delete',
    profileImageUrl: '/images/avatars/Dr_Horn2.jpeg'
  });
  sinon.stub(userRepository, 'getUserById').resolves({
    id: userId,
    password: 'hashed-password',
    is_deleted: false
  });
  sinon.stub(bcrypt, 'compare').resolves(true);
  sinon.stub(userRepository, 'deleteUser').resolves();

  await userService.deleteAccount(userId, 'secret');

  assert.equal(userRepository.getUserById.calledOnceWithExactly(userId), true);
  assert.equal(userRepository.deleteUser.calledOnceWithExactly(userId), true);
  assert.equal(getStoredProfile(userId), null);
});

test('deleteAccount rejects missing or already deleted users', async () => {
  sinon.stub(userRepository, 'getUserById').resolves(null);

  await assert.rejects(
    () => userService.deleteAccount(12, 'secret'),
    /Account not found/
  );
});
