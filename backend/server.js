const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/database'); // Your db.js file

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serve static files

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/export', require('./routes/export'));
app.use('/api/system', require('./routes/system'));
app.use('/api/public', require('./routes/public'));
app.use('/api/upload', require('./routes/upload'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    message: '✅ Server is running!',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // ✅ Test DB connection once at startup
  try {
    const client = await pool.connect();
    console.log('✅ Database connection test successful!');
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
});
