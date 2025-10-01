const express = require('express');
const { assignCourse, getAssignments } = require('../controllers/assignmentController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, assignCourse);
router.get('/', auth, getAssignments);

module.exports = router;