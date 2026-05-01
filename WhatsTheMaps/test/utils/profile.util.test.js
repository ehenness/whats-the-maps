const test = require('node:test');
const { afterEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const profileUtil = require('../../utils/profile.util');
const profileConfig = require('../../config/profileConfig');

afterEach(() => sinon.restore());

test('trimString trims strings and returns empty strings for non-string values', () => {
  assert.equal(profileUtil.trimString('  Houston  '), 'Houston');
  assert.equal(profileUtil.trimString(null), '');
  assert.equal(profileUtil.trimString(42), '');
});

test('getProfileImage prefers a valid uploaded image', () => {
  sinon.stub(profileConfig, 'listPresetProfileImages').returns([
    '/images/avatars/Dr_Horn1.jpeg'
  ]);

  const result = profileUtil.getProfileImage({
    selectedAvatar: '/images/avatars/Dr_Horn1.jpeg',
    uploadedImageData: 'data:image/png;base64,abc123',
    currentImage: '/images/avatars/Dr_Horn2.jpeg'
  });

  assert.deepEqual(result, {
    profileImageUrl: 'data:image/png;base64,abc123'
  });
});

test('getProfileImage rejects invalid uploaded image data', () => {
  sinon.stub(profileConfig, 'listPresetProfileImages').returns([]);

  const result = profileUtil.getProfileImage({
    selectedAvatar: '',
    uploadedImageData: 'not-an-image',
    currentImage: null
  });

  assert.deepEqual(result, { error: 'image' });
});

test('getProfileImage accepts a whitelisted preset avatar', () => {
  sinon.stub(profileConfig, 'listPresetProfileImages').returns([
    '/images/avatars/Dr_Horn1.jpeg'
  ]);

  const result = profileUtil.getProfileImage({
    selectedAvatar: '  /images/avatars/Dr_Horn1.jpeg  ',
    uploadedImageData: '',
    currentImage: '/images/avatars/Dr_Horn2.jpeg'
  });

  assert.deepEqual(result, {
    profileImageUrl: '/images/avatars/Dr_Horn1.jpeg'
  });
});

test('getProfileImage falls back to the current image when nothing new is provided', () => {
  sinon.stub(profileConfig, 'listPresetProfileImages').returns([
    '/images/avatars/Dr_Horn1.jpeg'
  ]);

  const result = profileUtil.getProfileImage({
    selectedAvatar: '/images/avatars/not-allowed.jpeg',
    uploadedImageData: '',
    currentImage: '/images/avatars/Dr_Horn2.jpeg'
  });

  assert.deepEqual(result, {
    profileImageUrl: '/images/avatars/Dr_Horn2.jpeg'
  });
});
