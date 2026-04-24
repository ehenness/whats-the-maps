function buildReadOnlyDashboardViewModel(data) {
  return {
    isEditing: false,
    isReadOnlyProfile: true,
    isOwnProfile: false,
    profile: data.profile,
    presetAvatars: [],
    stats: data.stats,
    successMessage: null,
    errorMessage: null
  };
}

module.exports = { buildReadOnlyDashboardViewModel };