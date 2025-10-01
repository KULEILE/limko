const pool = require('../config/database');

const getMonitoringData = async (req, res) => {
  try {
    let query = `
      SELECT 
        r.*, 
        c.name as class_name,
        cr.name as course_name,
        u.name as lecturer_name,
        f.name as faculty_name,
        COUNT(DISTINCT rat.id) as rating_count,
        AVG(rat.rating) as average_rating
      FROM reports r
      LEFT JOIN classes c ON r.class_id = c.id
      LEFT JOIN courses cr ON r.course_id = cr.id
      LEFT JOIN users u ON r.lecturer_id = u.id
      LEFT JOIN faculties f ON r.faculty_id = f.id
      LEFT JOIN ratings rat ON r.id = rat.report_id
    `;
    let params = [];
    let paramCount = 0;

    if (req.user.role === 'prl') {
      query += ` WHERE r.faculty_id = $${++paramCount}`;
      params.push(req.user.faculty_id);
    } else if (req.user.role === 'pl') {
      query += ` WHERE r.faculty_id = $${++paramCount}`;
      params.push(req.user.faculty_id);
    } else if (req.user.role === 'lecturer') {
      query += ` WHERE r.lecturer_id = $${++paramCount}`;
      params.push(req.user.id);
    }

    query += ` GROUP BY r.id, c.name, cr.name, u.name, f.name 
               ORDER BY r.created_at DESC`;

    const reports = await pool.query(query, params);
    res.json(reports.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = { getMonitoringData };