// routes/complaints.js
const express = require('express');
const { 
  createComplaint, 
  getComplaints, 
  respondToComplaint,
  getComplaintsForResponse  // Add this import
} = require('../controllers/complaintController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createComplaint);
router.get('/', auth, getComplaints);
router.post('/respond', auth, respondToComplaint);
router.get('/for-response', auth, getComplaintsForResponse); // Add this route

module.exports = router;