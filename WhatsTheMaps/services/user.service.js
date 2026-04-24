const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');
const { saveStoredProfile } = require('../profileStore');
const { listPresetProfileImages, maxBioLength, maxUploadedImageLength } = require('../config/profileConfig');
const { getProfileImage, trimString } = require('../utils/profile.util');
const { buildSessionUser } = require('../utils/session.util');
const { getStoredProfile } = require('../profileStore');

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

async function signup(username, email, password) {
  const hashedPassword = await hashPassword(password);

  return userRepository.createUser(username, email, hashedPassword);
}

async function login(email, password) {
  const user = await userRepository.getUserByEmail(email);

  if (!user) {
    user = await userRepository.getUserByUsername(email);
    if (!user) {
      throw new Error('User not found');
    }
  }

  // if password doesn't match, throw error
  if (!(await comparePassword(password, user.password))) {
    throw new Error('Incorrect password.');
  }

  const storedProfile = getStoredProfile(user.id) || {};

  return { user, storedProfile };
}

async function deleteAccount(userId, password) {
  const user = await userRepository.getUserById(userId);

  if (!user || user.is_deleted) {
    throw new Error('Account not found.');
  }

  if (!(await comparePassword(password, user.password))) {
    throw new Error('Incorrect password.');
  }

  await userRepository.softDeleteUser(userId);
  deleteStoredProfile(userId);
}

async function updateProfile(user, body) {
  const bio = trimString(body.bio).slice(0, maxBioLength);

  const imageResult = getProfileImage({
    selectedAvatar: trimString(body.selectedAvatar),
    uploadedImageData: trimString(body.uploadedImageData),
    currentImage: user.profileImageUrl
  });

  if (imageResult.error) {
    return { error: 'image' };
  }

  const updatedProfile = {
    bio,
    profileImageUrl: imageResult.profileImageUrl
  };

  const saved = saveStoredProfile(user.id, updatedProfile);

  if (!saved) {
    return { error: 'update' };
  }

  return {
    updatedUser: buildSessionUser(user, storedProfile)
  };
}

module.exports = { signup, login, deleteAccount, updateProfile};