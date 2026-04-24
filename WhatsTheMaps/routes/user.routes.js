const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { isAuthenticated } = require('../middlewear/auth.middlewear');


router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.get('/logout', userController.logout);
router.post('/update-profile', isAuthenticated, userController.updateProfile);
router.post('/delete-account', isAuthenticated, userController.deleteAccount);

module.exports = router;
