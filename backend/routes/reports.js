const express = require('express');
const { createReport, getReports, signReport } = require('../controllers/reportController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createReport);
router.get('/', auth, getReports);
router.post('/sign', auth, signReport);

module.exports = router;