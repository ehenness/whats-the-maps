const dashboardService = require('../services/dashboard.service');
const { listPresetProfileImages } = require('../profileConfig');

async function getDashboard(req, res) {
  const isEditing = req.query.edit === '1';

  try {
    const data = await dashboardService.getDashboardProfile(req.session.user.id);

    if (!data) {
      return res.redirect('/login');
    }

    return res.render('dashboard', {
      isEditing,
      isReadOnlyProfile: false,
      isOwnProfile: true,
      profile: data.profile,
      presetAvatars: listPresetProfileImages(),
      stats: data.stats,
      successMessage: req.query.updated === '1' ? 'Profile updated.' : null,
      errorMessage: {
        image: 'That image could not be saved.',
        update: 'We could not save your profile changes.'
      }[req.query.error] || null
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading dashboard.');
  }
}

async function getPlayerProfile(req, res) {
  const requestedUserId = Number(req.params.userId);

  if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
    return res.status(404).send('Player not found.');
  }

  if (req.session.user && req.session.user.id === requestedUserId) {
    return res.redirect('/dashboard');
  }

  try {
    const data = await dashboardService.getDashboardProfile(requestedUserId);

    if (!data) {
      return res.status(404).send('Player not found.');
    }

    return res.render('dashboard', {
      isEditing: false,
      isReadOnlyProfile: true,
      isOwnProfile: false,
      profile: data.profile,
      presetAvatars: [],
      stats: data.stats,
      successMessage: null,
      errorMessage: null
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading player profile.');
  }
}

module.exports = { getDashboard, getPlayerProfile };