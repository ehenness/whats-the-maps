const { getProfileImage } = require('../utils/profile.util');

const imageResult = getProfileImage({
  selectedAvatar: body.selectedAvatar,
  uploadedImageData: body.uploadedImageData,
  currentImage: user.profileImageUrl
});

module.exports = { getProfileImage };