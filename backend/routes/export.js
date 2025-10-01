const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Public routes - no authentication required
router.get('/stats', async (req, res) => {
  try {
    const [
      facultiesCount,
      coursesCount,
      classesCount,
      reportsCount,
      usersCount
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM faculties'),
      pool.query('SELECT COUNT(*) FROM courses'),
      pool.query('SELECT COUNT(*) FROM classes'),
      pool.query('SELECT COUNT(*) FROM reports'),
      pool.query("SELECT COUNT(*) FROM users WHERE role IN ('lecturer', 'prl', 'pl', 'fmg')")
    ]);

    const stats = {
      totalFaculties: parseInt(facultiesCount.rows[0].count),
      totalCourses: parseInt(coursesCount.rows[0].count),
      totalClasses: parseInt(classesCount.rows[0].count),
      totalReports: parseInt(reportsCount.rows[0].count),
      totalStaff: parseInt(usersCount.rows[0].count)
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching public stats:', err);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

router.get('/faculties', async (req, res) => {
  try {
    const faculties = await pool.query(`
      SELECT f.*, 
             COUNT(DISTINCT c.id) as course_count,
             COUNT(DISTINCT cl.id) as class_count
      FROM faculties f
      LEFT JOIN courses c ON f.id = c.faculty_id
      LEFT JOIN classes cl ON c.id = cl.course_id
      GROUP BY f.id
      ORDER BY f.name
    `);
    res.json(faculties.rows);
  } catch (err) {
    console.error('Error fetching faculties:', err);
    res.status(500).json({ message: 'Error fetching faculties' });
  }
});

router.get('/staff-count', async (req, res) => {
  try {
    const staffCount = await pool.query(`
      SELECT 
        faculty_id,
        role,
        COUNT(*) as count
      FROM users 
      WHERE role IN ('lecturer', 'prl', 'pl', 'fmg')
      GROUP BY faculty_id, role
      ORDER BY faculty_id, role
    `);

    // Organize by faculty
    const result = {};
    staffCount.rows.forEach(row => {
      if (!result[row.faculty_id]) {
        result[row.faculty_id] = {
          total: 0,
          breakdown: {}
        };
      }
      result[row.faculty_id].breakdown[row.role] = parseInt(row.count);
      result[row.faculty_id].total += parseInt(row.count);
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching staff count:', err);
    res.status(500).json({ message: 'Error fetching staff count' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const reports = await pool.query(`
      SELECT r.id, r.week_number, r.date_of_lecture, r.topic_taught, r.status,
             c.name as class_name, cr.name as course_name, cr.code as course_code,
             f.name as faculty_name, u.name as lecturer_name
      FROM reports r
      LEFT JOIN classes c ON r.class_id = c.id
      LEFT JOIN courses cr ON r.course_id = cr.id
      LEFT JOIN faculties f ON r.faculty_id = f.id
      LEFT JOIN users u ON r.lecturer_id = u.id
      WHERE r.status = 'signed'
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    res.json(reports.rows);
  } catch (err) {
    console.error('Error fetching public reports:', err);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

module.exports = router;