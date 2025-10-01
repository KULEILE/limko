// routes/public.js
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
      usersCount,
      studentsCount
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM faculties'),
      pool.query('SELECT COUNT(*) FROM courses'),
      pool.query('SELECT COUNT(*) FROM classes'),
      pool.query('SELECT COUNT(*) FROM reports WHERE status = $1', ['signed']),
      pool.query("SELECT COUNT(*) FROM users WHERE role IN ('lecturer', 'prl', 'pl', 'fmg')"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'")
    ]);

    const stats = {
      totalFaculties: parseInt(facultiesCount.rows[0].count),
      totalCourses: parseInt(coursesCount.rows[0].count),
      totalClasses: parseInt(classesCount.rows[0].count),
      totalReports: parseInt(reportsCount.rows[0].count),
      totalStaff: parseInt(usersCount.rows[0].count),
      totalStudents: parseInt(studentsCount.rows[0].count)
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
             COUNT(DISTINCT cl.id) as class_count,
             COUNT(DISTINCT u.id) as staff_count,
             COUNT(DISTINCT s.id) as student_count
      FROM faculties f
      LEFT JOIN courses c ON f.id = c.faculty_id
      LEFT JOIN classes cl ON c.id = cl.course_id
      LEFT JOIN users u ON f.id = u.faculty_id AND u.role IN ('lecturer', 'prl', 'pl', 'fmg')
      LEFT JOIN users s ON f.id = s.faculty_id AND s.role = 'student'
      GROUP BY f.id
      ORDER BY f.name
    `);
    res.json(faculties.rows);
  } catch (err) {
    console.error('Error fetching faculties:', err);
    res.status(500).json({ message: 'Error fetching faculties' });
  }
});

// Updated staff hierarchy endpoint with actual names and positions
router.get('/staff-hierarchy', async (req, res) => {
  try {
    const staff = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        f.id as faculty_id,
        f.name as faculty_name,
        CASE 
          WHEN u.role = 'fmg' THEN 'Faculty Management'
          WHEN u.role = 'pl' THEN 'Program Leader'
          WHEN u.role = 'prl' THEN 'Program Representative Lecturer'
          WHEN u.role = 'lecturer' THEN 'Lecturer'
        END as position_title
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.id
      WHERE u.role IN ('lecturer', 'prl', 'pl', 'fmg')
      ORDER BY 
        f.name,
        CASE u.role
          WHEN 'fmg' THEN 1
          WHEN 'pl' THEN 2
          WHEN 'prl' THEN 3
          WHEN 'lecturer' THEN 4
        END,
        u.name
    `);

    // Organize by faculty and hierarchy with counts
    const hierarchy = {};
    staff.rows.forEach(member => {
      const facultyId = member.faculty_id;
      if (!hierarchy[facultyId]) {
        hierarchy[facultyId] = {
          faculty_name: member.faculty_name,
          total_staff: 0,
          fmg: [],
          pl: [],
          prl: [],
          lecturer: []
        };
      }
      hierarchy[facultyId][member.role].push({
        id: member.id,
        name: member.name,
        email: member.email,
        position: member.position_title
      });
      hierarchy[facultyId].total_staff++;
    });

    res.json(hierarchy);
  } catch (err) {
    console.error('Error fetching staff hierarchy:', err);
    res.status(500).json({ message: 'Error fetching staff hierarchy' });
  }
});

// Get staff count by faculty (simplified version)
router.get('/staff-count', async (req, res) => {
  try {
    const staffCount = await pool.query(`
      SELECT 
        faculty_id,
        role,
        COUNT(*) as count
      FROM users 
      WHERE role IN ('lecturer', 'prl', 'pl', 'fmg')
      AND faculty_id IS NOT NULL
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