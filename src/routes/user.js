const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getUserDetails, updateOnboardingStage } = require('../controllers/userController');

const router = express.Router();

router.get('/details', authMiddleware, getUserDetails);

router.patch('/onboarding-stage', authMiddleware, updateOnboardingStage);

module.exports = router;
