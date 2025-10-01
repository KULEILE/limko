import React, { useState, useEffect } from 'react';
import API from '../services/api';

const ReportForm = ({ user }) => {
  const [formData, setFormData] = useState({
    class_id: '',
    week_number: '',
    date_of_lecture: '',
    course_id: '',
    students_present: '',
    venue: '',
    scheduled_time: '',
    topic_taught: '',
    learning_outcomes: '',
    recommendations: ''
  });
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState('');
  const [totalStudents, setTotalStudents] = useState(0);
  const [userAssignments, setUserAssignments] = useState([]);

  useEffect(() => {
    fetchFormData();
  }, [user]);

  const fetchFormData = async () => {
    try {
      let classesRes;
      
      // Fetch user's assignments if they are a lecturer
      if (user.role === 'lecturer') {
        const assignmentsRes = await API.get('/assignments');
        setUserAssignments(assignmentsRes.data);
        
        // Get class IDs from assignments
        const assignedClassIds = assignmentsRes.data.map(a => a.class_id);
        
        if (assignedClassIds.length > 0) {
          // Fetch only assigned classes
          const assignedClassesRes = await API.get('/system/classes');
          const filteredClasses = assignedClassesRes.data.filter(cls => 
            assignedClassIds.includes(cls.id)
          );
          classesRes = { data: filteredClasses };
        } else {
          classesRes = { data: [] };
        }
      } else {
        // For PRL, PL, FMG - show all classes in their faculty
        classesRes = await API.get('/system/classes');
      }
      
      const coursesRes = await API.get('/system/courses');
      setClasses(classesRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error('Error fetching form data:', err);
      setMessage('Error loading form data. Please refresh the page.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Auto-fill total students when class is selected
    if (name === 'class_id') {
      const selectedClass = classes.find(cls => cls.id === parseInt(value));
      if (selectedClass) {
        setTotalStudents(selectedClass.total_students);
      } else {
        setTotalStudents(0);
      }
    }
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor(diff / oneWeek) + 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.students_present > totalStudents) {
      setMessage(`Students present cannot exceed total class students (${totalStudents})`);
      return;
    }

    try {
      await API.post('/reports', formData);
      setMessage('Report submitted successfully! It will now go to class representatives for signing.');
      setFormData({
        class_id: '',
        week_number: getCurrentWeek().toString(),
        date_of_lecture: '',
        course_id: '',
        students_present: '',
        venue: '',
        scheduled_time: '',
        topic_taught: '',
        learning_outcomes: '',
        recommendations: ''
      });
      setTotalStudents(0);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Submission failed. Please try again.');
    }
  };

  const clearForm = () => {
    setFormData({
      class_id: '',
      week_number: getCurrentWeek().toString(),
      date_of_lecture: '',
      course_id: '',
      students_present: '',
      venue: '',
      scheduled_time: '',
      topic_taught: '',
      learning_outcomes: '',
      recommendations: ''
    });
    setTotalStudents(0);
    setMessage('');
  };

  // Get today's date in YYYY-MM-DD format for max date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="main-content">
      <div className="card">
        <h2>Create Lecture Report</h2>
        <p style={{ color: '#ccc', marginBottom: '1rem' }}>
          {user.role === 'lecturer' 
            ? 'You can only create reports for classes assigned to you.'
            : 'Fill in the lecture report details below.'
          }
        </p>
        
        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {user.role === 'lecturer' && userAssignments.length === 0 && (
          <div className="message error">
            You are not assigned to any classes. Please contact your Program Leader for class assignments.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Class Selection */}
            <div className="form-group">
              <label>Class: *</label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                className="form-control"
                required
                disabled={user.role === 'lecturer' && classes.length === 0}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.course_name}
                  </option>
                ))}
              </select>
              {user.role === 'lecturer' && (
                <small style={{ color: '#ccc' }}>
                  {classes.length === 0 ? 'No classes assigned' : `${classes.length} class(es) assigned`}
                </small>
              )}
              {totalStudents > 0 && (
                <small style={{ color: '#28a745', display: 'block', marginTop: '0.25rem' }}>
                  Total registered students: {totalStudents}
                </small>
              )}
            </div>

            {/* Week Number */}
            <div className="form-group">
              <label>Week Number: *</label>
              <input
                type="number"
                name="week_number"
                value={formData.week_number || getCurrentWeek()}
                onChange={handleChange}
                className="form-control"
                min="1"
                max="52"
                required
              />
              <small style={{ color: '#ccc' }}>Current academic week: {getCurrentWeek()}</small>
            </div>

            {/* Date of Lecture */}
            <div className="form-group">
              <label>Date of Lecture: *</label>
              <input
                type="date"
                name="date_of_lecture"
                value={formData.date_of_lecture}
                onChange={handleChange}
                className="form-control"
                max={getTodayDate()}
                required
              />
              <small style={{ color: '#ccc' }}>Cannot be a future date</small>
            </div>

            {/* Course Selection */}
            <div className="form-group">
              <label>Course: *</label>
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

            {/* Students Present */}
            <div className="form-group">
              <label>Students Present: *</label>
              <input
                type="number"
                name="students_present"
                value={formData.students_present}
                onChange={handleChange}
                className="form-control"
                min="1"
                max={totalStudents || 100}
                required
                disabled={!formData.class_id}
              />
              <small style={{ color: '#ccc' }}>
                {totalStudents > 0 
                  ? `Must be between 1 and ${totalStudents}`
                  : 'Select a class first'
                }
              </small>
            </div>

            {/* Venue */}
            <div className="form-group">
              <label>Venue: *</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="form-control"
                placeholder="e.g., Room 101, Lab A, Lecture Hall 3"
                required
              />
            </div>

            {/* Scheduled Time */}
            <div className="form-group">
              <label>Scheduled Time: *</label>
              <input
                type="time"
                name="scheduled_time"
                value={formData.scheduled_time}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          {/* Topic Taught */}
          <div className="form-group">
            <label>Topic Taught: *</label>
            <textarea
              name="topic_taught"
              value={formData.topic_taught}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="Describe the main topic covered in this lecture. Be specific about the content covered..."
              required
            />
            <small style={{ color: '#ccc' }}>Detailed description of what was taught</small>
          </div>

          {/* Learning Outcomes */}
          <div className="form-group">
            <label>Learning Outcomes: *</label>
            <textarea
              name="learning_outcomes"
              value={formData.learning_outcomes}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="What should students be able to do or understand after this lecture? List specific outcomes..."
              required
            />
            <small style={{ color: '#ccc' }}>Specific skills or knowledge students should gain</small>
          </div>

          {/* Recommendations */}
          <div className="form-group">
            <label>Recommendations:</label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="Any recommendations for improvement, follow-up actions, or additional support needed..."
            />
            <small style={{ color: '#ccc' }}>Optional suggestions for improvement or next steps</small>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={user.role === 'lecturer' && classes.length === 0}
            >
              Submit Report
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={clearForm}
            >
              Clear Form
            </button>
          </div>
        </form>

        {/* Report Workflow Information */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#2a2a2a', 
          borderRadius: '4px',
          borderLeft: '4px solid #007bff'
        }}>
          <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>Report Workflow</h4>
          <ol style={{ color: '#ccc', margin: 0, paddingLeft: '1.5rem' }}>
            <li>You submit this report</li>
            <li>Class representative reviews and signs the report</li>
            <li>Report goes to Principal Lecturer for review</li>
            <li>Final approval by Program Leader</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;