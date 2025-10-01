const express = require('express');
const { getClasses, createClass } = require('../controllers/classController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, getClasses);
router.post('/', auth, createClass);

module.exports = router;