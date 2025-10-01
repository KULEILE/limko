// controllers/ratingController.js
const pool = require('../config/database');

const submitRating = async (req, res) => {
  const { report_id, lecturer_id, rating, comment } = req.body;

  try {
    // Validate that either report_id or lecturer_id is provided
    if (!report_id && !lecturer_id) {
      return res.status(400).json({ 
        message: 'Either report_id or lecturer_id must be provided' 
      });
    }

    // Prevent self-rating for lecturers
    if (lecturer_id && lecturer_id === req.user.id) {
      return res.status(400).json({ 
        message: 'You cannot rate yourself' 
      });
    }

    // Check if user has already rated this report/lecturer
    let checkQuery, checkParams;
    
    if (report_id) {
      checkQuery = 'SELECT * FROM ratings WHERE report_id = $1 AND student_id = $2';
      checkParams = [report_id, req.user.id];
    } else {
      checkQuery = 'SELECT * FROM ratings WHERE lecturer_id = $1 AND student_id = $2';
      checkParams = [lecturer_id, req.user.id];
    }

    const existingRating = await pool.query(checkQuery, checkParams);
    if (existingRating.rows.length > 0) {
      return res.status(400).json({ 
        message: 'You have already rated this ' + (report_id ? 'report' : 'lecturer') 
      });
    }

    // Validate faculty/class access (existing code remains the same)
    // ... [keep the existing validation logic]

    // Insert rating
    const newRating = await pool.query(
      `INSERT INTO ratings (report_id, lecturer_id, student_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [report_id, lecturer_id, req.user.id, rating, comment]
    );

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const getRatings = async (req, res) => {
  try {
    let query = `
      SELECT r.*, 
             rep.topic_taught, rep.class_id,
             c.name as class_name,
             u_lecturer.name as lecturer_name,
             u_student.name as student_name,
             CASE 
               WHEN r.lecturer_id IS NOT NULL THEN 'lecturer'
               ELSE 'report'
             END as rating_type
      FROM ratings r
      LEFT JOIN reports rep ON r.report_id = rep.id
      LEFT JOIN classes c ON rep.class_id = c.id
      LEFT JOIN users u_lecturer ON r.lecturer_id = u_lecturer.id
      LEFT JOIN users u_student ON r.student_id = u_student.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;

    if (req.user.role === 'student') {
      query += ` AND r.student_id = $${++paramCount}`;
      params.push(req.user.id);
    } else if (req.user.role === 'lecturer') {
      // Lecturers see ratings for their reports AND ratings about themselves
      query += ` AND (rep.lecturer_id = $${++paramCount} OR r.lecturer_id = $${paramCount})`;
      params.push(req.user.id);
    } else if (['prl', 'pl', 'fmg'].includes(req.user.role)) {
      // PRL, PL, FMG see all ratings from their faculty
      query += ` AND (rep.faculty_id = $${++paramCount} OR u_lecturer.faculty_id = $${paramCount})`;
      params.push(req.user.faculty_id);
    }

    query += ' ORDER BY r.created_at DESC';
    const ratings = await pool.query(query, params);
    res.json(ratings.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// New function to get lecturers for rating
const getLecturersForRating = async (req, res) => {
  try {
    const lecturers = await pool.query(
      `SELECT id, name, email, role 
       FROM users 
       WHERE faculty_id = $1 
       AND role IN ('lecturer', 'prl', 'pl', 'fmg')
       AND id != $2
       ORDER BY name`,
      [req.user.faculty_id, req.user.id]
    );
    res.json(lecturers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = { submitRating, getRatings, getLecturersForRating };