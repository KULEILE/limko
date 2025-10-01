import React, { useState, useEffect } from 'react';
import API from '../services/api';
import SignaturePad from './SignaturePad';

const ClassRepresentative = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    try {
      const response = await API.get('/reports');
      // Filter reports that are pending signature for this class
      const pendingReports = response.data.filter(report => 
        report.status === 'pending' && report.class_id === user.class_id
      );
      setReports(pendingReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const handleSignReport = async (signature) => {
    try {
      await API.post('/reports/sign', {
        report_id: selectedReport.id,
        signature: signature
      });
      
      setMessage('Report signed successfully! Moving to PRL for review.');
      setShowSignaturePad(false);
      setSelectedReport(null);
      fetchReports();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to sign report');
    }
  };

  if (user.role !== 'student' || !user.is_class_rep) {
    return (
      <div className="main-content">
        <div className="card">
          <h2>Access Denied</h2>
          <p>Only Class Representatives can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <h2>Class Representative Dashboard</h2>
        <p>Welcome, {user.name}. You are the class representative for your class.</p>
        
        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '1rem', 
          borderRadius: '4px',
          marginBottom: '2rem'
        }}>
          <h4>  Your Responsibilities:</h4>
          <ul style={{ marginLeft: '1.5rem', color: '#ccc' }}>
            <li>Review lecture reports submitted by lecturers</li>
            <li>Confirm the accuracy of reported information</li>
            <li>Provide your digital signature using mouse/touch</li>
            <li>Reports will then be sent to PRL automatically</li>
          </ul>
        </div>

        <h3>Reports Waiting for Your Signature</h3>
        
        {reports.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Lecturer</th>
                <th>Topic</th>
                <th>Students Present</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id}>
                  <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                  <td>{report.course_name}</td>
                  <td>{report.lecturer_name}</td>
                  <td title={report.topic_taught}>
                    {report.topic_taught.length > 50 
                      ? report.topic_taught.substring(0, 50) + '...' 
                      : report.topic_taught}
                  </td>
                  <td>{report.students_present}</td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedReport(report)}
                    >
                      Review & Sign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: '#ccc'
          }}>
            <p>No reports pending your signature.</p>
            <p>Lecturers will submit reports here for your approval.</p>
          </div>
        )}

        {/* Report Details Modal */}
        {selectedReport && !showSignaturePad && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#333',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h3>Review Report Details</h3>
              
              <div style={{ 
                backgroundColor: '#2a2a2a', 
                padding: '1rem', 
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <h4>Report Information:</h4>
                <p><strong>Class:</strong> {selectedReport.class_name}</p>
                <p><strong>Course:</strong> {selectedReport.course_name} ({selectedReport.course_code})</p>
                <p><strong>Lecturer:</strong> {selectedReport.lecturer_name}</p>
                <p><strong>Date:</strong> {new Date(selectedReport.date_of_lecture).toLocaleDateString()}</p>
                <p><strong>Students Present:</strong> {selectedReport.students_present}</p>
                <p><strong>Venue:</strong> {selectedReport.venue}</p>
                <p><strong>Time:</strong> {selectedReport.scheduled_time}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4>Topic Taught:</h4>
                <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '4px' }}>
                  {selectedReport.topic_taught}
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4>Learning Outcomes:</h4>
                <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '4px' }}>
                  {selectedReport.learning_outcomes}
                </p>
              </div>

              {selectedReport.recommendations && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4>Recommendations:</h4>
                  <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '4px' }}>
                    {selectedReport.recommendations}
                  </p>
                </div>
              )}

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-success"
                  onClick={() => setShowSignaturePad(true)}
                >
                  ✅ Confirm and Sign
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedReport(null);
                    setMessage('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Use the SignaturePad component */}
        {showSignaturePad && (
          <SignaturePad 
            onSave={handleSignReport}
            onClose={() => setShowSignaturePad(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ClassRepresentative;