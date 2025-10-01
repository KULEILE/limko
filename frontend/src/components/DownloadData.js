import React, { useState } from 'react';
import API from '../services/api';

const DownloadData = ({ user }) => {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    data_type: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (formData.start_date) params.append('start_date', formData.start_date);
      if (formData.end_date) params.append('end_date', formData.end_date);
      if (formData.data_type) params.append('data_type', formData.data_type);

      const response = await API.get(`/export/user-data?${params.toString()}`, {
        responseType: 'blob' // Important for file download
      });

      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `luct-activities-${user.id}-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage('Download started successfully!');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Download error:', err);
      setMessage('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getDefaultStartDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // One month ago
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="main-content">
      <div className="card">
        <h2>Download Your Data</h2>
        <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>
          Export your activities and reports from the LUCT Faculty Reporter system as Excel files.
        </p>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleDownload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date || getDefaultStartDate()}
                onChange={handleChange}
                className="form-control"
                max={getDefaultEndDate()}
              />
              <small style={{ color: '#ccc' }}>Start date for data export</small>
            </div>

            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date || getDefaultEndDate()}
                onChange={handleChange}
                className="form-control"
                max={getDefaultEndDate()}
              />
              <small style={{ color: '#ccc' }}>End date for data export</small>
            </div>
          </div>

          <div className="form-group">
            <label>Data to Include:</label>
            <select
              name="data_type"
              value={formData.data_type}
              onChange={handleChange}
              className="form-control"
            >
              <option value="all">All Activities (Complete Report)</option>
              <option value="reports">Lecture Reports Only</option>
              <option value="complaints">Complaints Only</option>
              <option value="ratings">Ratings Only</option>
              <option value="activities">Activity Summary</option>
            </select>
            <small style={{ color: '#ccc' }}>
              Choose what type of data you want to export
            </small>
          </div>

          <div style={{ 
            backgroundColor: '#2a2a2a', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>📊 Export Information</h4>
            <ul style={{ color: '#ccc', margin: 0, paddingLeft: '1.5rem' }}>
              <li>Files are exported in Excel format (.xlsx)</li>
              <li>Data includes timestamps and detailed information</li>
              <li>Export contains only your personal data</li>
              <li>Files are generated in real-time from the database</li>
            </ul>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? (
              <>
                <span>⏳ Generating File...</span>
              </>
            ) : (
              <>
                <span>📥 Download Excel File</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Download Options */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #444' }}>
          <h4>Quick Downloads</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFormData({
                  start_date: getDefaultStartDate(),
                  end_date: getDefaultEndDate(),
                  data_type: 'reports'
                });
                setTimeout(() => document.querySelector('form').dispatchEvent(new Event('submit')), 100);
              }}
              disabled={loading}
            >
              📋 Recent Reports
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFormData({
                  start_date: getDefaultStartDate(),
                  end_date: getDefaultEndDate(),
                  data_type: 'complaints'
                });
                setTimeout(() => document.querySelector('form').dispatchEvent(new Event('submit')), 100);
              }}
              disabled={loading}
            >
              📝 My Complaints
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFormData({
                  start_date: getDefaultStartDate(),
                  end_date: getDefaultEndDate(),
                  data_type: 'all'
                });
                setTimeout(() => document.querySelector('form').dispatchEvent(new Event('submit')), 100);
              }}
              disabled={loading}
            >
              📊 All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadData;