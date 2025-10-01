
const express = require('express');
const { getMonitoringData } = require('../controllers/monitoringController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, getMonitoringData);

module.exports = router;