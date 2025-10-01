import React, { useState, useEffect } from 'react';
import API from '../services/api';

const Assignment = ({ user }) => {
  const [assignments, setAssignments] = useState([]);
  const [formData, setFormData] = useState({
    lecturer_id: '',
    course_id: '',
    class_id: ''
  });
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user.role === 'pl') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [assignmentsRes, lecturersRes, coursesRes, classesRes] = await Promise.all([
        API.get('/assignments'),
        API.get('/system/users/lecturer'),
        API.get('/system/courses'),
        API.get('/system/classes')
      ]);
      setAssignments(assignmentsRes.data);
      setLecturers(lecturersRes.data);
      setCourses(coursesRes.data);
      setClasses(classesRes.data);
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
      await API.post('/assignments', formData);
      setMessage('Course assigned successfully!');
      setFormData({
        lecturer_id: '',
        course_id: '',
        class_id: ''
      });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to assign course');
    }
  };

  if (user.role !== 'pl') {
    return (
      <div className="main-content">
        <div className="card">
          <h2>Access Denied</h2>
          <p>Only Program Leaders (PL) can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <h2>Course Assignment</h2>
        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Assignment Form */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #555', borderRadius: '4px' }}>
          <h3>Assign Course to Lecturer</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Lecturer:</label>
                <select
                  name="lecturer_id"
                  value={formData.lecturer_id}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map(lecturer => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name} ({lecturer.email})
                    </option>
                  ))}
                </select>
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
                <label>Class:</label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Assign Course
            </button>
          </form>
        </div>

        {/* Assignments List */}
        <div>
          <h3>Current Assignments</h3>
          {assignments.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Lecturer</th>
                  <th>Course</th>
                  <th>Class</th>
                  <th>Assigned By</th>
                  <th>Date Assigned</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={assignment.id}>
                    <td>{assignment.lecturer_name}</td>
                    <td>{assignment.course_name} ({assignment.course_code})</td>
                    <td>{assignment.class_name}</td>
                    <td>{assignment.assigned_by_name}</td>
                    <td>{new Date(assignment.assigned_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No assignments found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assignment;