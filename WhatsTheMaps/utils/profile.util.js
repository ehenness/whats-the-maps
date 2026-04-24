const profleConfig = require('../config/profileConfig');

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getProfileImage({ selectedAvatar, uploadedImageData, currentImage }) {
  const presetAvatars = profileConfig.listPresetProfileImages();

  const cleanAvatar = trimString(selectedAvatar);
  const cleanUpload = trimString(uploadedImageData);

  if (cleanUpload) {
    const looksLikeImage = cleanUpload.startsWith('data:image/');
    const fitsLimit = cleanUpload.length <= profileConfig.maxUploadedImageLength;

    if (!looksLikeImage || !fitsLimit) {
      return { error: 'image' };
    }

    return { profileImageUrl: cleanUpload };
  }

  if (cleanAvatar && presetAvatars.includes(cleanAvatar)) {
    return { profileImageUrl: cleanAvatar };
  }

  return { profileImageUrl: currentImage || null };
}

module.exports = {
  getProfileImage,
  trimString
};