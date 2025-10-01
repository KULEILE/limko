// controllers/complaintController.js
const pool = require('../config/database');

const createComplaint = async (req, res) => {
  const { complaint_against_id, report_id, complaint_text } = req.body;

  try {
    // Prevent self-complaining
    if (complaint_against_id === req.user.id) {
      return res.status(400).json({ 
        message: 'You cannot file a complaint against yourself' 
      });
    }

    // Validate complaint_against_id exists and get their role
    const againstUser = await pool.query(
      'SELECT id, name, role, faculty_id FROM users WHERE id = $1',
      [complaint_against_id]
    );

    if (againstUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUser = againstUser.rows[0];

    // Determine the appropriate recipient based on hierarchy
    let recipient_role = '';
    
    if (req.user.role === 'student') {
      // Student complaints go to PRL
      recipient_role = 'prl';
    } else if (req.user.role === 'lecturer') {
      // Lecturer complaints about PRL go to PL
      if (targetUser.role === 'prl') {
        recipient_role = 'pl';
      } else {
        recipient_role = 'prl'; // Default for lecturer complaints
      }
    } else if (req.user.role === 'prl') {
      // PRL complaints about PL go to FMG
      if (targetUser.role === 'pl') {
        recipient_role = 'fmg';
      } else {
        recipient_role = 'pl'; // Default for PRL complaints
      }
    } else if (req.user.role === 'pl') {
      // PL complaints go to FMG
      recipient_role = 'fmg';
    }

    // Insert complaint
    const newComplaint = await pool.query(
      `INSERT INTO complaints 
       (complainant_id, complaint_against_id, report_id, complaint_text, status, recipient_role) 
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
      [req.user.id, complaint_against_id, report_id, complaint_text, recipient_role]
    );

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: newComplaint.rows[0]
    });
  } catch (err) {
    console.error('Error creating complaint:', err.message);
    res.status(500).send('Server error');
  }
};

const getComplaints = async (req, res) => {
  try {
    let query = `
      SELECT c.*,
             uc.name as complainant_name,
             ua.name as complaint_against_name,
             r.topic_taught,
             cl.name as class_name,
             responder.name as responder_name
      FROM complaints c
      LEFT JOIN users uc ON c.complainant_id = uc.id
      LEFT JOIN users ua ON c.complaint_against_id = ua.id
      LEFT JOIN reports r ON c.report_id = r.id
      LEFT JOIN classes cl ON r.class_id = cl.id
      LEFT JOIN users responder ON c.responded_by = responder.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;

    // Users cannot see complaints against themselves
    query += ` AND c.complaint_against_id != $${++paramCount}`;
    params.push(req.user.id);

    // Filter based on user role and hierarchy
    if (req.user.role === 'student') {
      query += ` AND c.complainant_id = $${++paramCount}`;
      params.push(req.user.id);
    } else if (req.user.role === 'lecturer') {
      // Lecturers see complaints where they are the target OR complaints they submitted
      query += ` AND (c.complaint_against_id = $${++paramCount} OR c.complainant_id = $${paramCount})`;
      params.push(req.user.id);
    } else if (req.user.role === 'prl') {
      // PRL sees complaints assigned to PRL OR complaints they submitted
      query += ` AND (c.recipient_role = $${++paramCount} OR c.complainant_id = $${++paramCount})`;
      params.push('prl', req.user.id);
    } else if (req.user.role === 'pl') {
      // PL sees complaints assigned to PL OR complaints they submitted
      query += ` AND (c.recipient_role = $${++paramCount} OR c.complainant_id = $${++paramCount})`;
      params.push('pl', req.user.id);
    } else if (req.user.role === 'fmg') {
      // FMG sees all complaints
      query += ` AND (c.recipient_role = $${++paramCount} OR c.complainant_id = $${++paramCount} OR 1=1)`;
      params.push('fmg', req.user.id);
    }

    query += ' ORDER BY c.created_at DESC';
    
    console.log('Executing query:', query);
    console.log('With params:', params);
    
    const complaints = await pool.query(query, params);
    res.json(complaints.rows);
  } catch (err) {
    console.error('Error fetching complaints:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

const respondToComplaint = async (req, res) => {
  const { complaint_id, response_text } = req.body;

  try {
    // Check if complaint exists
    const complaintCheck = await pool.query(
      `SELECT c.*, 
              uc.name as complainant_name,
              ua.name as against_name
       FROM complaints c
       LEFT JOIN users uc ON c.complainant_id = uc.id
       LEFT JOIN users ua ON c.complaint_against_id = ua.id
       WHERE c.id = $1`,
      [complaint_id]
    );

    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const complaint = complaintCheck.rows[0];

    // Check if user can respond to this complaint
    let canRespond = false;
    
    // User can respond if they are the recipient OR the complaint is against them
    if (req.user.role === complaint.recipient_role || complaint.complaint_against_id === req.user.id) {
      canRespond = true;
    }

    // Also allow PRL, PL, FMG to respond to complaints in their hierarchy
    if (['prl', 'pl', 'fmg'].includes(req.user.role) && req.user.role === complaint.recipient_role) {
      canRespond = true;
    }

    if (!canRespond) {
      return res.status(403).json({ 
        message: 'You are not authorized to respond to this complaint' 
      });
    }

    // Update complaint with response
    const updatedComplaint = await pool.query(
      `UPDATE complaints 
       SET response_text = $1, 
           status = 'resolved', 
           responded_at = CURRENT_TIMESTAMP, 
           responded_by = $2
       WHERE id = $3 
       RETURNING *`,
      [response_text, req.user.id, complaint_id]
    );

    res.json({
      message: 'Response submitted successfully',
      complaint: updatedComplaint.rows[0]
    });
  } catch (err) {
    console.error('Error responding to complaint:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// NEW FUNCTION: Get complaints for response
const getComplaintsForResponse = async (req, res) => {
  try {
    const query = `
      SELECT c.*,
             uc.name as complainant_name,
             ua.name as complaint_against_name,
             r.topic_taught,
             cl.name as class_name
      FROM complaints c
      LEFT JOIN users uc ON c.complainant_id = uc.id
      LEFT JOIN users ua ON c.complaint_against_id = ua.id
      LEFT JOIN reports r ON c.report_id = r.id
      LEFT JOIN classes cl ON r.class_id = cl.id
      WHERE c.status = 'pending'
      AND (c.recipient_role = $1 OR c.complaint_against_id = $2)
      ORDER BY c.created_at DESC
    `;
    
    const complaints = await pool.query(query, [req.user.role, req.user.id]);
    res.json(complaints.rows);
  } catch (err) {
    console.error('Error fetching complaints for response:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

module.exports = { 
  createComplaint, 
  getComplaints, 
  respondToComplaint,
  getComplaintsForResponse
};