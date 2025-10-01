import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    faculty_id: '',
    is_class_rep: false,
    class_id: ''
  });
  const [faculties, setFaculties] = useState([]);
  const [classes, setClasses] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [facultiesRes, classesRes] = await Promise.all([
        API.get('/system/faculties'),
        API.get('/system/classes')
      ]);
      setFaculties(facultiesRes.data);
      setClasses(classesRes.data);
    } catch (err) {
      console.error('Error fetching form data:', err);
      setMessage('Failed to load form data. Please refresh the page.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Convert numeric fields to numbers, keep others as strings
    const processedValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.faculty_id) {
      setMessage('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.is_class_rep && !formData.class_id) {
      setMessage('Please select a class if you are a class representative');
      setLoading(false);
      return;
    }

    // Prepare data for API
    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      faculty_id: formData.faculty_id,
      is_class_rep: formData.is_class_rep || false,
      class_id: formData.class_id || null
    };

    console.log('Submitting registration data:', submitData);

    try {
      const response = await API.post('/auth/register', submitData);
      setMessage('Registration successful! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Registration failed. Please try again.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="card" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <h2>Register</h2>
        
        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name: *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email: *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading}
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label>Password: *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              required
              minLength="6"
              disabled={loading}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-group">
            <label>Role: *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="prl">Principal Lecturer (PRL)</option>
              <option value="pl">Program Leader (PL)</option>
              <option value="fmg">Faculty Management (FMG)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Faculty: *</label>
            <select
              name="faculty_id"
              value={formData.faculty_id}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading}
            >
              <option value="">Select Faculty</option>
              {faculties.map(faculty => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          {formData.role === 'student' && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_class_rep"
                  checked={formData.is_class_rep}
                  onChange={handleChange}
                  disabled={loading}
                />
                Register as Class Representative
              </label>
            </div>
          )}

          {formData.is_class_rep && (
            <div className="form-group">
              <label>Class: *</label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                className="form-control"
                required
                disabled={loading}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.course_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;