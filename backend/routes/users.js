const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.faculty_id, u.is_class_rep, u.class_id,
              f.name as faculty_name, c.name as class_name
       FROM users u
       LEFT JOIN faculties f ON u.faculty_id = f.id
       LEFT JOIN classes c ON u.class_id = c.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  const { name, email } = req.body;

  try {
    const updatedUser = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
      [name, email, req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;