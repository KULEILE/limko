import React from 'react';

const ReportDetails = ({ report, onClose }) => {
  if (!report) return null;

  return (
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
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Report Details</h3>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label><strong>Class:</strong></label>
            <p>{report.class_name}</p>
          </div>

          <div className="form-group">
            <label><strong>Course:</strong></label>
            <p>{report.course_name} ({report.course_code})</p>
          </div>

          <div className="form-group">
            <label><strong>Lecturer:</strong></label>
            <p>{report.lecturer_name}</p>
          </div>

          <div className="form-group">
            <label><strong>Date:</strong></label>
            <p>{new Date(report.date_of_lecture).toLocaleDateString()}</p>
          </div>

          <div className="form-group">
            <label><strong>Week:</strong></label>
            <p>{report.week_number}</p>
          </div>

          <div className="form-group">
            <label><strong>Students Present:</strong></label>
            <p>{report.students_present}</p>
          </div>

          <div className="form-group">
            <label><strong>Venue:</strong></label>
            <p>{report.venue}</p>
          </div>

          <div className="form-group">
            <label><strong>Scheduled Time:</strong></label>
            <p>{report.scheduled_time}</p>
          </div>
        </div>

        <div className="form-group">
          <label><strong>Topic Taught:</strong></label>
          <p style={{ whiteSpace: 'pre-wrap' }}>{report.topic_taught}</p>
        </div>

        <div className="form-group">
          <label><strong>Learning Outcomes:</strong></label>
          <p style={{ whiteSpace: 'pre-wrap' }}>{report.learning_outcomes}</p>
        </div>

        {report.recommendations && (
          <div className="form-group">
            <label><strong>Recommendations:</strong></label>
            <p style={{ whiteSpace: 'pre-wrap' }}>{report.recommendations}</p>
          </div>
        )}

        <div className="form-group">
          <label><strong>Status:</strong></label>
          <span className={`status ${report.status}`} style={{ marginLeft: '0.5rem' }}>
            {report.status}
          </span>
        </div>

        {report.student_signature && (
          <div className="form-group">
            <label><strong>Signed by Student Rep:</strong></label>
            <p>{report.student_signature} on {new Date(report.signed_at).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetails;