/** Reads and writes JSON store for profile bios and avatars */
const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, 'data');
const profileStorePath = path.join(dataDirectory, 'userProfiles.json');

// Keep saved profile data in consistent shape before reading/writing it
function normalizeProfile(profile = {}) {
  return {
    bio: typeof profile.bio === 'string' ? profile.bio : '',
    profileImageUrl: typeof profile.profileImageUrl === 'string' ? profile.profileImageUrl : null
  };
}

// Create backing directory and file on demand for local development
function ensureStoreFile() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(profileStorePath)) {
    fs.writeFileSync(profileStorePath, JSON.stringify({}, null, 2));
  }
}

// Read whole store
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

// Persist full profile store back to disk after updates
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
