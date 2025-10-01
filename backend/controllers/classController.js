const pool = require('../config/database');

const getClasses = async (req, res) => {
  try {
    const classes = await pool.query(`
      SELECT cl.*, c.name as course_name, c.code as course_code, f.name as faculty_name
      FROM classes cl
      LEFT JOIN courses c ON cl.course_id = c.id
      LEFT JOIN faculties f ON c.faculty_id = f.id
      WHERE c.faculty_id = $1
      ORDER BY cl.name
    `, [req.user.faculty_id]);
    
    res.json(classes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const createClass = async (req, res) => {
  const { name, course_id, total_students } = req.body;

  try {
    const newClass = await pool.query(
      'INSERT INTO classes (name, course_id, total_students) VALUES ($1, $2, $3) RETURNING *',
      [name, course_id, total_students]
    );

    res.status(201).json({
      message: 'Class created successfully',
      class: newClass.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = { getClasses, createClass };