const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, 'data');
const profileStorePath = path.join(dataDirectory, 'userProfiles.json');

function normalizeProfile(profile = {}) {
  return {
    bio: typeof profile.bio === 'string' ? profile.bio : '',
    profileImageUrl: typeof profile.profileImageUrl === 'string' ? profile.profileImageUrl : null
  };
}

function ensureStoreFile() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(profileStorePath)) {
    fs.writeFileSync(profileStorePath, JSON.stringify({}, null, 2));
  }
}

function readStore() {
  try {
    ensureStoreFile();
    const contents = fs.readFileSync(profileStorePath, 'utf8');
    const parsed = JSON.parse(contents);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Error reading profile store:', error);
    return {};
  }
}

function writeStore(store) {
  try {
    ensureStoreFile();
    fs.writeFileSync(profileStorePath, JSON.stringify(store, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing profile store:', error);
    return false;
  }
}

function getStoredProfile(userId) {
  const store = readStore();
  const savedProfile = store[String(userId)];
  return savedProfile ? normalizeProfile(savedProfile) : null;
}

function saveStoredProfile(userId, profile) {
  const store = readStore();
  store[String(userId)] = normalizeProfile(profile);

  return writeStore(store);
}

function deleteStoredProfile(userId) {
  const store = readStore();
  delete store[String(userId)];
  return writeStore(store);
}

module.exports = {
  deleteStoredProfile,
  getStoredProfile,
  saveStoredProfile
};
