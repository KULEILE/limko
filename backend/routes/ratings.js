// routes/ratings.js
const express = require('express');
const { submitRating, getRatings, getLecturersForRating } = require('../controllers/ratingController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, submitRating);
router.get('/', auth, getRatings);
router.get('/lecturers', auth, getLecturersForRating); // New route

module.exports = router;