const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Ensure the upload directory exists
const fs = require('fs');
const uploadDir = 'public/images/profiles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Simple naming: user-id + extension
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload profile image
router.post('/profile-image', auth, upload.single('profile_image'), async (req, res) => {
  try {
    console.log('Upload request received for user:', req.user.id);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imagePath = '/images/profiles/' + req.file.filename;
    console.log('Saving image path to database:', imagePath);

    // Update user's profile image in database
    const result = await pool.query(
      'UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING *',
      [imagePath, req.user.id]
    );

    console.log('Database update successful for user:', req.user.id);

    res.json({
      message: 'Profile image uploaded successfully',
      imagePath: imagePath
    });
  } catch (err) {
    console.error('Error uploading profile image:', err);
    
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Get current user's profile image
router.get('/my-profile-image', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT profile_image FROM users WHERE id = $1',
      [req.user.id]
    );
    
    res.json({ profile_image: result.rows[0]?.profile_image });
  } catch (err) {
    console.error('Error fetching profile image:', err);
    res.status(500).json({ message: 'Error fetching profile image' });
  }
});

module.exports = router;