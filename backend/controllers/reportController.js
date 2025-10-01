const pool = require('../config/database');

const createReport = async (req, res) => {
  const {
    class_id, week_number, date_of_lecture, course_id,
    students_present, venue, scheduled_time, topic_taught,
    learning_outcomes, recommendations
  } = req.body;

  try {
    const classInfo = await pool.query(
      'SELECT * FROM classes WHERE id = $1',
      [class_id]
    );

    if (classInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const newReport = await pool.query(
      `INSERT INTO reports (
        faculty_id, class_id, week_number, date_of_lecture, course_id, lecturer_id,
        students_present, venue, scheduled_time, topic_taught, learning_outcomes, recommendations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        req.user.faculty_id, class_id, week_number, date_of_lecture, course_id, req.user.id,
        students_present, venue, scheduled_time, topic_taught, learning_outcomes, recommendations
      ]
    );

    res.status(201).json({
      message: 'Report created successfully',
      report: newReport.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const getReports = async (req, res) => {
  try {
    let query = `
      SELECT r.*, c.name as class_name, cr.name as course_name, cr.code as course_code,
             f.name as faculty_name, u.name as lecturer_name
      FROM reports r
      LEFT JOIN classes c ON r.class_id = c.id
      LEFT JOIN courses cr ON r.course_id = cr.id
      LEFT JOIN faculties f ON r.faculty_id = f.id
      LEFT JOIN users u ON r.lecturer_id = u.id
    `;
    let params = [];

    if (req.user.role === 'lecturer') {
      query += ' WHERE r.lecturer_id = $1';
      params = [req.user.id];
    } else if (req.user.role === 'student') {
      query += ' WHERE r.class_id = $1';
      params = [req.user.class_id];
    } else if (req.user.role === 'prl') {
      query += ' WHERE r.faculty_id = $1';
      params = [req.user.faculty_id];
    }

    query += ' ORDER BY r.created_at DESC';

    const reports = await pool.query(query, params);
    res.json(reports.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const signReport = async (req, res) => {
  const { report_id, signature } = req.body;

  try {
    const report = await pool.query(
      'UPDATE reports SET student_signature = $1, signed_at = CURRENT_TIMESTAMP, status = $2 WHERE id = $3 RETURNING *',
      [signature, 'signed', report_id]
    );

    res.json({
      message: 'Report signed successfully',
      report: report.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = { createReport, getReports, signReport };