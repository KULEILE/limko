import React, { useState, useEffect } from 'react';
import API from '../services/api';

const Monitoring = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMonitoringData();
  }, [user]);

  const fetchMonitoringData = async () => {
    try {
      const response = await API.get('/monitoring');
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  return (
    <div className="main-content">
      <div className="card">
        <h2>Monitoring Dashboard</h2>
        
        <div className="form-group">
          <label>Filter by Status:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="form-control"
            style={{ width: '200px' }}
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="signed">Signed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Course</th>
                <th>Lecturer</th>
                <th>Topic</th>
                <th>Date</th>
                <th>Students Present</th>
                <th>Status</th>
                <th>Ratings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id}>
                  <td>{report.class_name}</td>
                  <td>{report.course_name}</td>
                  <td>{report.lecturer_name}</td>
                  <td title={report.topic_taught}>
                    {report.topic_taught.length > 50 
                      ? report.topic_taught.substring(0, 50) + '...' 
                      : report.topic_taught}
                  </td>
                  <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                  <td>{report.students_present}</td>
                  <td>
                    <span className={`status ${report.status}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>
                    {report.average_rating 
                      ? `${parseFloat(report.average_rating).toFixed(1)}/5 (${report.rating_count})`
                      : 'No ratings'
                    }
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        // View report details
                        alert(`Topic: ${report.topic_taught}\nOutcomes: ${report.learning_outcomes}\nRecommendations: ${report.recommendations}`);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem' }}>
            No reports found for the selected filter.
          </p>
        )}
      </div>
    </div>
  );
};

export default Monitoring;