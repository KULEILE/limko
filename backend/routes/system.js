const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Get faculties, courses, classes for dropdowns
router.get('/faculties', async (req, res) => {
  try {
    const faculties = await pool.query('SELECT * FROM faculties ORDER BY name');
    res.json(faculties.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/courses', async (req, res) => {
  try {
    const courses = await pool.query(`
      SELECT c.*, f.name as faculty_name 
      FROM courses c 
      LEFT JOIN faculties f ON c.faculty_id = f.id 
      ORDER BY c.code
    `);
    res.json(courses.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/classes', async (req, res) => {
  try {
    const classes = await pool.query(`
      SELECT cl.*, c.name as course_name, c.code as course_code 
      FROM classes cl 
      LEFT JOIN courses c ON cl.course_id = c.id 
      ORDER BY cl.name
    `);
    res.json(classes.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Add missing endpoint for single class
router.get('/classes/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await pool.query(`
      SELECT cl.*, c.name as course_name, c.code as course_code 
      FROM classes cl 
      LEFT JOIN courses c ON cl.course_id = c.id 
      WHERE cl.id = $1
    `, [id]);
    
    if (classData.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json(classData.rows[0]);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/users/:role', auth, async (req, res) => {
  try {
    const { role } = req.params;
    const users = await pool.query(
      'SELECT id, name, email FROM users WHERE role = $1 AND faculty_id = $2 ORDER BY name',
      [role, req.user.faculty_id]
    );
    res.json(users.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Add missing user profile endpoint
router.get('/user/profile', auth, async (req, res) => {
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
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;