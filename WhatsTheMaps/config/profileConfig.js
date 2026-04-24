const fs = require('fs');
const path = require('path');

const maxBioLength = 500;
const maxUploadedImageLength = 12_000_000;
const presetImagesDirectory = path.join(__dirname, 'public', 'images', 'avatars');
const allowedPresetExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function isAllowedPresetImage(fileName) {
  return allowedPresetExtensions.has(path.extname(fileName).toLowerCase());
}

function listPresetProfileImages() {
  try {
    if (!fs.existsSync(presetImagesDirectory)) {
      return [];
    }

    return fs
      .readdirSync(presetImagesDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter(isAllowedPresetImage)
      .sort((left, right) => left.localeCompare(right))
      .map((fileName) => `/images/avatars/${fileName}`);
  } catch (error) {
    console.error('Error loading preset profile images:', error);
    return [];
  }
}

const dashboardErrorMessages = {
  image: 'That image could not be saved. Try a smaller file or image dimensions.',
  update: 'We could not save your profile changes.',
  user: 'We could not find that account.'
};

module.exports = {
  listPresetProfileImages,
  maxBioLength,
  maxUploadedImageLength,
  dashboardErrorMessages
};
