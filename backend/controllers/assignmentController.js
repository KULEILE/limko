const pool = require('../config/database');

const assignCourse = async (req, res) => {
  const { lecturer_id, course_id, class_id } = req.body;

  try {
    // Check if PL is assigning within their faculty
    const course = await pool.query(
      'SELECT faculty_id FROM courses WHERE id = $1',
      [course_id]
    );

    if (course.rows[0].faculty_id !== req.user.faculty_id) {
      return res.status(403).json({ message: 'Can only assign courses within your faculty' });
    }

    const assignment = await pool.query(
      `INSERT INTO assignments (lecturer_id, course_id, class_id, assigned_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [lecturer_id, course_id, class_id, req.user.id]
    );

    res.status(201).json({
      message: 'Course assigned successfully',
      assignment: assignment.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const getAssignments = async (req, res) => {
  try {
    const assignments = await pool.query(
      `SELECT a.*, u.name as lecturer_name, c.name as course_name, c.code as course_code,
              cl.name as class_name, ub.name as assigned_by_name
       FROM assignments a
       LEFT JOIN users u ON a.lecturer_id = u.id
       LEFT JOIN courses c ON a.course_id = c.id
       LEFT JOIN classes cl ON a.class_id = cl.id
       LEFT JOIN users ub ON a.assigned_by = ub.id
       WHERE c.faculty_id = $1
       ORDER BY a.assigned_at DESC`,
      [req.user.faculty_id]
    );

    res.json(assignments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = { assignCourse, getAssignments };