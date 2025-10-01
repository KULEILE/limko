import React, { useState, useEffect } from 'react';
import API from '../services/api';

const Classes = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    total_students: ''
  });
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [classesRes, coursesRes] = await Promise.all([
        API.get('/classes'),
        API.get('/system/courses')
      ]);
      setClasses(classesRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/classes', formData);
      setMessage('Class created successfully!');
      setFormData({
        name: '',
        course_id: '',
        total_students: ''
      });
      fetchData();
    } catch (err) {
      setMessage('Failed to create class');
    }
  };

  return (
    <div className="main-content">
      <div className="card">
        <h2>Classes Management</h2>
        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Create Class Form - Only for PL */}
        {user.role === 'pl' && (
          <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #555', borderRadius: '4px' }}>
            <h3>Create New Class</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Class Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Course:</label>
                  <select
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Total Students:</label>
                  <input
                    type="number"
                    name="total_students"
                    value={formData.total_students}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                Create Class
              </button>
            </form>
          </div>
        )}

        {/* Classes List */}
        <div>
          <h3>Available Classes</h3>
          {classes.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Course</th>
                  <th>Faculty</th>
                  <th>Total Students</th>
                  <th>Class Rep</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id}>
                    <td>{cls.name}</td>
                    <td>{cls.course_name} ({cls.course_code})</td>
                    <td>{cls.faculty_name}</td>
                    <td>{cls.total_students}</td>
                    <td>
                      {/* In a real app, you would fetch class rep info here */}
                      <span className="status pending">To be assigned</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No classes found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Classes;