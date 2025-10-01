// React Component - Rating.js (Updated)
import React, { useState, useEffect } from 'react';
import API from '../services/api';

const Rating = ({ user }) => {
  const [ratings, setRatings] = useState([]);
  const [reports, setReports] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [formData, setFormData] = useState({
    report_id: '',
    lecturer_id: '',
    rating: 5,
    comment: '',
    rating_type: 'lecture'
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [ratingsRes, reportsRes, lecturersRes] = await Promise.all([
        API.get('/ratings'),
        API.get('/reports'),
        API.get('/ratings/lecturers') // New endpoint
      ]);
      
      setRatings(ratingsRes.data);
      setLecturers(lecturersRes.data);
      
      // Filter reports based on user's faculty/class
      let filteredReports = reportsRes.data;
      if (user.role === 'student') {
        filteredReports = reportsRes.data.filter(report => 
          report.class_id === user.class_id && report.status === 'signed'
        );
      } else if (['lecturer', 'prl', 'pl', 'fmg'].includes(user.role)) {
        filteredReports = reportsRes.data.filter(report => 
          report.faculty_id === user.faculty_id
        );
      }
      
      setReports(filteredReports);

    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Failed to load data');
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
    
    if ((formData.rating_type === 'lecture' && !formData.report_id) || 
        (formData.rating_type === 'lecturer' && !formData.lecturer_id)) {
      setMessage('Please select a lecture or lecturer to rate');
      return;
    }

    try {
      const payload = {
        rating: parseInt(formData.rating),
        comment: formData.comment
      };

      if (formData.rating_type === 'lecture') {
        payload.report_id = formData.report_id;
      } else {
        payload.lecturer_id = formData.lecturer_id;
      }

      await API.post('/ratings', payload);
      setMessage('Rating submitted successfully!');
      setFormData({
        report_id: '',
        lecturer_id: '',
        rating: 5,
        comment: '',
        rating_type: 'lecture'
      });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  return (
    <div className="main-content">
      <div className="card">
        <h2>Rating System</h2>
        
        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Submit Rating Form */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #555', borderRadius: '4px' }}>
          <h3>Submit New Rating</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rate:</label>
              <select
                name="rating_type"
                value={formData.rating_type}
                onChange={handleChange}
                className="form-control"
              >
                <option value="lecture">Lecture/Report</option>
                <option value="lecturer">Lecturer</option>
              </select>
            </div>

            {formData.rating_type === 'lecture' ? (
              <div className="form-group">
                <label>Select Lecture Report:</label>
                <select
                  name="report_id"
                  value={formData.report_id}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Choose a report...</option>
                  {reports.map(report => (
                    <option key={report.id} value={report.id}>
                      {report.class_name} - {report.topic_taught} ({new Date(report.date_of_lecture).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                {reports.length === 0 && (
                  <small style={{color: '#ccc'}}>No reports available for rating</small>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label>Select Lecturer:</label>
                <select
                  name="lecturer_id"
                  value={formData.lecturer_id}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Choose a lecturer...</option>
                  {lecturers.map(lecturer => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name} ({lecturer.role.toUpperCase()})
                    </option>
                  ))}
                </select>
                {lecturers.length === 0 && (
                  <small style={{color: '#ccc'}}>No lecturers available for rating</small>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Rating (1-5):</label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="form-control"
                required
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very Good</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Fair</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Comment (Optional):</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder="Share your feedback..."
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Submit Rating
            </button>
          </form>
        </div>

        {/* Ratings List */}
        <div>
          <h3>
            {user.role === 'student' ? 'Your Ratings' : 
             user.role === 'lecturer' ? 'Ratings for Your Reports & Performance' : 'All Ratings'}
          </h3>
          {ratings.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Target</th>
                  <th>Rating</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map(rating => (
                  <tr key={rating.id}>
                    <td>{new Date(rating.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className="status" style={{ 
                        backgroundColor: rating.rating_type === 'lecturer' ? '#ffc107' : '#007bff',
                        color: '#000',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {rating.rating_type === 'lecturer' ? 'Lecturer' : 'Lecture'}
                      </span>
                    </td>
                    <td>
                      {rating.rating_type === 'lecturer' ? 
                        `${rating.lecturer_name} (Lecturer)` : 
                        `${rating.class_name} - ${rating.topic_taught}`
                      }
                    </td>
                    <td>
                      <span style={{ 
                        color: rating.rating >= 4 ? '#28a745' : rating.rating >= 3 ? '#ffc107' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {rating.rating}/5
                      </span>
                    </td>
                    <td>{rating.comment || 'No comment'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>
              No ratings found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rating;