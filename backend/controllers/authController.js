const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const register = async (req, res) => {
  console.log('=== REGISTRATION REQUEST START ===');
  console.log('Request body:', req.body);
  
  let { email, password, name, role, faculty_id, is_class_rep, class_id } = req.body;

  try {
    // Convert string numbers to integers and handle empty strings
    faculty_id = faculty_id ? parseInt(faculty_id) : null;
    class_id = class_id ? parseInt(class_id) : null;
    
    console.log('Parsed IDs - faculty_id:', faculty_id, 'class_id:', class_id);

    // Validate required fields
    if (!email || !password || !name || !role || !faculty_id) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'All fields are required: email, password, name, role, faculty_id' 
      });
    }

    // Check if faculty_id is a valid number
    if (isNaN(faculty_id)) {
      console.log('Invalid faculty_id:', req.body.faculty_id);
      return res.status(400).json({ message: 'Invalid faculty selected' });
    }

    // Check if class_id is a valid number if provided
    if (class_id && isNaN(class_id)) {
      console.log('Invalid class_id:', req.body.class_id);
      return res.status(400).json({ message: 'Invalid class selected' });
    }

    // Check if user exists
    console.log('Checking if user exists...');
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate faculty exists
    console.log('Validating faculty...');
    const facultyCheck = await pool.query('SELECT * FROM faculties WHERE id = $1', [faculty_id]);
    if (facultyCheck.rows.length === 0) {
      console.log('Invalid faculty_id:', faculty_id);
      return res.status(400).json({ message: 'Invalid faculty selected' });
    }

    // Validate class if provided
    if (class_id) {
      console.log('Validating class...');
      const classCheck = await pool.query('SELECT * FROM classes WHERE id = $1', [class_id]);
      if (classCheck.rows.length === 0) {
        console.log('Invalid class_id:', class_id);
        return res.status(400).json({ message: 'Invalid class selected' });
      }
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully');

    // Create user
    console.log('Creating user in database...');
    const newUser = await pool.query(
      `INSERT INTO users (email, password, name, role, faculty_id, is_class_rep, class_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, name, role, faculty_id, is_class_rep, class_id`,
      [email, hashedPassword, name, role, faculty_id, is_class_rep || false, class_id || null]
    );

    console.log('User created successfully:', newUser.rows[0]);

    // If class rep, create class representative record
    if (is_class_rep && class_id) {
      try {
        console.log('Creating class representative record...');
        await pool.query(
          'INSERT INTO class_representatives (user_id, class_id) VALUES ($1, $2)',
          [newUser.rows[0].id, class_id]
        );
        console.log('Class representative record created');
      } catch (classRepError) {
        console.error('Error creating class rep record:', classRepError);
        // Don't fail registration if class rep record fails
      }
    }

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { userId: newUser.rows[0].id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('=== REGISTRATION SUCCESS ===');
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    
    // Handle specific PostgreSQL errors
    if (err.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        message: 'Invalid faculty or class selected. Please check your selections.' 
      });
    }
    
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    if (err.code === '23502') { // Not null violation
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    if (err.code === '22P02') { // Invalid text representation
      return res.status(400).json({ 
        message: 'Invalid data format. Please check your inputs.' 
      });
    }

    res.status(500).json({ 
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const login = async (req, res) => {
  console.log('=== LOGIN REQUEST ===');
  console.log('Login attempt for:', req.body.email);

  const { email, password } = req.body;

  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('User found, checking password...');
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      console.log('Password incorrect for:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.rows[0].id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        name: user.rows[0].name,
        role: user.rows[0].role,
        faculty_id: user.rows[0].faculty_id,
        is_class_rep: user.rows[0].is_class_rep,
        class_id: user.rows[0].class_id
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { register, login };