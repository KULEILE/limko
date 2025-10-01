const pool = require('../config/database');
const ExcelJS = require('exceljs');

const exportUserData = async (req, res) => {
  const { start_date, end_date, data_type } = req.query;
  const userId = req.user.id;

  try {
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'LUCT Faculty Reporter';
    workbook.created = new Date();

    if (data_type === 'reports' || data_type === 'all') {
      await addReportsSheet(workbook, userId, start_date, end_date);
    }

    if (data_type === 'complaints' || data_type === 'all') {
      await addComplaintsSheet(workbook, userId, start_date, end_date);
    }

    if (data_type === 'ratings' || data_type === 'all') {
      await addRatingsSheet(workbook, userId, start_date, end_date);
    }

    if (data_type === 'activities' || data_type === 'all') {
      await addActivitiesSheet(workbook, userId, start_date, end_date);
    }

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=luct-activities-${userId}-${Date.now()}.xlsx`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Error generating export file' });
  }
};

const addReportsSheet = async (workbook, userId, startDate, endDate) => {
  const worksheet = workbook.addWorksheet('Lecture Reports');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Class', key: 'class_name', width: 20 },
    { header: 'Course', key: 'course_name', width: 25 },
    { header: 'Week', key: 'week_number', width: 10 },
    { header: 'Date', key: 'date_of_lecture', width: 15 },
    { header: 'Students Present', key: 'students_present', width: 15 },
    { header: 'Venue', key: 'venue', width: 15 },
    { header: 'Scheduled Time', key: 'scheduled_time', width: 15 },
    { header: 'Topic Taught', key: 'topic_taught', width: 40 },
    { header: 'Learning Outcomes', key: 'learning_outcomes', width: 40 },
    { header: 'Recommendations', key: 'recommendations', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Created Date', key: 'created_at', width: 20 }
  ];

  // Build query based on user role and date range
  let query = `
    SELECT r.*, c.name as class_name, cr.name as course_name, cr.code as course_code
    FROM reports r
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN courses cr ON r.course_id = cr.id
    WHERE 1=1
  `;

  const params = [];

  // Filter by user role
  if (req.user.role === 'lecturer') {
    query += ' AND r.lecturer_id = $1';
    params.push(userId);
  } else if (req.user.role === 'student') {
    query += ' AND r.class_id = $1';
    params.push(req.user.class_id);
  } else if (req.user.role === 'prl') {
    query += ' AND r.faculty_id = $1';
    params.push(req.user.faculty_id);
  }

  // Add date filter if provided
  if (startDate && endDate) {
    query += ` AND r.date_of_lecture BETWEEN $${params.length + 1} AND $${params.length + 2}`;
    params.push(startDate, endDate);
  }

  query += ' ORDER BY r.created_at DESC';

  const reports = await pool.query(query, params);

  // Add data to worksheet
  reports.rows.forEach(report => {
    worksheet.addRow({
      id: report.id,
      class_name: report.class_name,
      course_name: `${report.course_code} - ${report.course_name}`,
      week_number: report.week_number,
      date_of_lecture: new Date(report.date_of_lecture).toLocaleDateString(),
      students_present: report.students_present,
      venue: report.venue,
      scheduled_time: report.scheduled_time,
      topic_taught: report.topic_taught,
      learning_outcomes: report.learning_outcomes,
      recommendations: report.recommendations || 'N/A',
      status: report.status,
      created_at: new Date(report.created_at).toLocaleString()
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };
};

const addComplaintsSheet = async (workbook, userId, startDate, endDate) => {
  const worksheet = workbook.addWorksheet('Complaints');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Complaint Against', key: 'complaint_against_name', width: 25 },
    { header: 'Complaint Text', key: 'complaint_text', width: 40 },
    { header: 'Response', key: 'response_text', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Created Date', key: 'created_at', width: 20 },
    { header: 'Responded Date', key: 'responded_at', width: 20 }
  ];

  let query = `
    SELECT c.*, u.name as complaint_against_name
    FROM complaints c
    LEFT JOIN users u ON c.complaint_against_id = u.id
    WHERE c.complainant_id = $1
  `;

  const params = [userId];

  if (startDate && endDate) {
    query += ` AND c.created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`;
    params.push(startDate, endDate);
  }

  query += ' ORDER BY c.created_at DESC';

  const complaints = await pool.query(query, params);

  complaints.rows.forEach(complaint => {
    worksheet.addRow({
      id: complaint.id,
      complaint_against_name: complaint.complaint_against_name,
      complaint_text: complaint.complaint_text,
      response_text: complaint.response_text || 'No response yet',
      status: complaint.status,
      created_at: new Date(complaint.created_at).toLocaleString(),
      responded_at: complaint.responded_at ? new Date(complaint.responded_at).toLocaleString() : 'N/A'
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFE4E1' }
  };
};

const addRatingsSheet = async (workbook, userId, startDate, endDate) => {
  const worksheet = workbook.addWorksheet('Ratings');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Class', key: 'class_name', width: 20 },
    { header: 'Topic', key: 'topic_taught', width: 40 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Comment', key: 'comment', width: 30 },
    { header: 'Created Date', key: 'created_at', width: 20 }
  ];

  let query = `
    SELECT r.*, rep.topic_taught, c.name as class_name
    FROM ratings r
    LEFT JOIN reports rep ON r.report_id = rep.id
    LEFT JOIN classes c ON rep.class_id = c.id
    WHERE r.student_id = $1
  `;

  const params = [userId];

  if (startDate && endDate) {
    query += ` AND r.created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`;
    params.push(startDate, endDate);
  }

  query += ' ORDER BY r.created_at DESC';

  const ratings = await pool.query(query, params);

  ratings.rows.forEach(rating => {
    worksheet.addRow({
      id: rating.id,
      class_name: rating.class_name,
      topic_taught: rating.topic_taught,
      rating: `${rating.rating}/5`,
      comment: rating.comment || 'No comment',
      created_at: new Date(rating.created_at).toLocaleString()
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6FFE6' }
  };
};

const addActivitiesSheet = async (workbook, userId, startDate, endDate) => {
  const worksheet = workbook.addWorksheet('All Activities');

  worksheet.columns = [
    { header: 'Activity Type', key: 'type', width: 15 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Details', key: 'details', width: 30 }
  ];

  // Get combined activities from different tables
  const activities = [];

  // Reports activities
  let reportsQuery = `
    SELECT 'Report' as type, 
           CONCAT('Lecture report for ', c.name, ' - ', cr.name) as description,
           r.created_at as date,
           r.status,
           CONCAT('Students: ', r.students_present, ', Topic: ', SUBSTRING(r.topic_taught, 1, 50)) as details
    FROM reports r
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN courses cr ON r.course_id = cr.id
    WHERE r.lecturer_id = $1
  `;

  if (startDate && endDate) {
    reportsQuery += ` AND r.created_at BETWEEN $2 AND $3`;
  }

  const reportsParams = [userId];
  if (startDate && endDate) {
    reportsParams.push(startDate, endDate);
  }

  const reports = await pool.query(reportsQuery, reportsParams);
  activities.push(...reports.rows);

  // Complaints activities
  let complaintsQuery = `
    SELECT 'Complaint' as type,
           CONCAT('Complaint against ', u.name) as description,
           c.created_at as date,
           c.status,
           SUBSTRING(c.complaint_text, 1, 50) as details
    FROM complaints c
    LEFT JOIN users u ON c.complaint_against_id = u.id
    WHERE c.complainant_id = $1
  `;

  const complaintsParams = [userId];
  if (startDate && endDate) {
    complaintsQuery += ` AND c.created_at BETWEEN $2 AND $3`;
    complaintsParams.push(startDate, endDate);
  }

  const complaints = await pool.query(complaintsQuery, complaintsParams);
  activities.push(...complaints.rows);

  // Sort all activities by date
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Add to worksheet
  activities.forEach(activity => {
    worksheet.addRow({
      type: activity.type,
      description: activity.description,
      date: new Date(activity.date).toLocaleString(),
      status: activity.status,
      details: activity.details
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F8FF' }
  };
};

module.exports = { exportUserData };