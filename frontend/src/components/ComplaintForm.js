import React, { useState, useEffect } from 'react';
import API from '../services/api';

const ComplaintForm = ({ user }) => {
  const [formData, setFormData] = useState({
    complaint_against_id: '',
    report_id: '',
    complaint_text: ''
  });
  const [complaints, setComplaints] = useState([]);
  const [complaintsForResponse, setComplaintsForResponse] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [responseData, setResponseData] = useState({
    complaint_id: '',
    response_text: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my-complaints');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [complaintsRes, reportsRes, forResponseRes] = await Promise.all([
        API.get('/complaints'),
        API.get('/reports'),
        API.get('/complaints/for-response')
      ]);
      
      setComplaints(complaintsRes.data);
      setComplaintsForResponse(forResponseRes.data);
      setReports(reportsRes.data);

      // Get users based on role for complaint against
      let roleToFetch = '';
      if (user.role === 'student') roleToFetch = 'lecturer';
      else if (user.role === 'lecturer') roleToFetch = 'prl';
      else if (user.role === 'prl') roleToFetch = 'pl';
      else if (user.role === 'pl') roleToFetch = 'fmg';

      if (roleToFetch) {
        const usersRes = await API.get(`/system/users/${roleToFetch}`);
        setUsers(usersRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Error loading data. Please refresh the page.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleResponseChange = (e) => {
    setResponseData({
      ...responseData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!formData.complaint_against_id || !formData.complaint_text.trim()) {
      setMessage('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      await API.post('/complaints', formData);
      setMessage('Complaint filed successfully! You will receive feedback soon.');
      setFormData({
        complaint_against_id: '',
        report_id: '',
        complaint_text: ''
      });
      fetchData(); // Refresh complaints list
    } catch (err) {
      console.error('Complaint submission error:', err);
      setMessage(err.response?.data?.message || 'Failed to file complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (!responseData.complaint_id || !responseData.response_text.trim()) {
      setMessage('Please fill in all response fields');
      return;
    }

    try {
      await API.post('/complaints/respond', responseData);
      setMessage('Response submitted successfully!');
      setResponseData({
        complaint_id: '',
        response_text: ''
      });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit response');
    }
  };

  const quickRespond = async (complaintId) => {
    const response = prompt('Enter your response:');
    if (response && response.trim()) {
      try {
        await API.post('/complaints/respond', {
          complaint_id: complaintId,
          response_text: response.trim()
        });
        setMessage('Response submitted successfully!');
        fetchData();
      } catch (err) {
        setMessage('Failed to submit response');
      }
    }
  };

  return (
    <div className="main-content">
      <div className="card">
        <h2>Complaints Management</h2>
        
        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* File Complaint Form */}
        {(user.role === 'student' || user.role === 'lecturer' || user.role === 'prl' || user.role === 'pl') && (
          <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #555', borderRadius: '4px' }}>
            <h3>File New Complaint</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Complaint Against: *</label>
                <select
                  name="complaint_against_id"
                  value={formData.complaint_against_id}
                  onChange={handleChange}
                  className="form-control"
                  required
                  disabled={loading}
                >
                  <option value="">Select Person</option>
                  {users.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name} ({person.email})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#ccc' }}>
                  {user.role === 'student' ? 'Complain against lecturers' : 
                   user.role === 'lecturer' ? 'Complain against PRL' : 
                   user.role === 'prl' ? 'Complain against Program Leader' :
                   'Complain against Faculty Management'}
                </small>
              </div>

              <div className="form-group">
                <label>Related Report (Optional):</label>
                <select
                  name="report_id"
                  value={formData.report_id}
                  onChange={handleChange}
                  className="form-control"
                  disabled={loading}
                >
                  <option value="">Select Report</option>
                  {reports.map(report => (
                    <option key={report.id} value={report.id}>
                      {report.class_name} - {report.topic_taught}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Complaint Details: *</label>
                <textarea
                  name="complaint_text"
                  value={formData.complaint_text}
                  onChange={handleChange}
                  className="form-control"
                  rows="4"
                  placeholder="Describe your complaint in detail..."
                  required
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'File Complaint'}
              </button>
            </form>
          </div>
        )}

        {/* Tabs for different views */}
        <div className="tabs" style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
          <button 
            className={`tab-button ${activeTab === 'my-complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-complaints')}
            style={{
              padding: '8px 16px',
              border: '1px solid #555',
              background: activeTab === 'my-complaints' ? '#007bff' : 'transparent',
              color: activeTab === 'my-complaints' ? 'white' : '#ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            My Complaints
          </button>
          
          {(user.role === 'prl' || user.role === 'pl' || user.role === 'fmg') && (
            <button 
              className={`tab-button ${activeTab === 'for-response' ? 'active' : ''}`}
              onClick={() => setActiveTab('for-response')}
              style={{
                padding: '8px 16px',
                border: '1px solid #555',
                background: activeTab === 'for-response' ? '#ffc107' : 'transparent',
                color: activeTab === 'for-response' ? 'black' : '#ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Complaints for Response ({complaintsForResponse.length})
            </button>
          )}
        </div>

        {/* My Complaints Tab */}
        {activeTab === 'my-complaints' && (
          <div>
            <h3>
              {user.role === 'student' ? 'Your Complaints' : 
               user.role === 'lecturer' ? 'Complaints Related to You' : 
               'All Complaints'}
            </h3>
            {complaints.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Complainant</th>
                    <th>Against</th>
                    <th>Complaint</th>
                    <th>Status</th>
                    <th>Response</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(complaint => (
                    <tr key={complaint.id}>
                      <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                      <td>{complaint.complainant_name}</td>
                      <td>{complaint.complaint_against_name}</td>
                      <td title={complaint.complaint_text}>
                        {complaint.complaint_text.length > 50 
                          ? complaint.complaint_text.substring(0, 50) + '...' 
                          : complaint.complaint_text}
                      </td>
                      <td>
                        <span className={`status ${complaint.status}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td>
                        {complaint.response_text ? (
                          <div>
                            <strong>Response:</strong> {complaint.response_text}
                            {complaint.responder_name && (
                              <div>
                                <small>By: {complaint.responder_name} on {new Date(complaint.responded_at).toLocaleDateString()}</small>
                              </div>
                            )}
                          </div>
                        ) : (
                          'No response yet'
                        )}
                      </td>
                      <td>
                        {/* Show respond button if user is the complaint target OR recipient */}
                        {(!complaint.response_text && 
                          (user.id === complaint.complaint_against_id || 
                           user.role === complaint.recipient_role)) && (
                          <button 
                            onClick={() => quickRespond(complaint.id)}
                            className="btn btn-primary btn-sm"
                            style={{ marginRight: '5px' }}
                          >
                            Respond
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>
                No complaints found.
              </p>
            )}
          </div>
        )}

        {/* Complaints for Response Tab */}
        {activeTab === 'for-response' && (
          <div>
            <h3>Complaints Requiring Your Response</h3>
            
            {/* Response Form */}
            {complaintsForResponse.length > 0 && (
              <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ffc107', borderRadius: '4px' }}>
                <h4>Submit Response</h4>
                <form onSubmit={handleSubmitResponse}>
                  <div className="form-group">
                    <label>Select Complaint to Respond:</label>
                    <select
                      name="complaint_id"
                      value={responseData.complaint_id}
                      onChange={handleResponseChange}
                      className="form-control"
                      required
                    >
                      <option value="">Choose a complaint...</option>
                      {complaintsForResponse.map(complaint => (
                        <option key={complaint.id} value={complaint.id}>
                          From: {complaint.complainant_name} - {complaint.complaint_text.substring(0, 50)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Your Response: *</label>
                    <textarea
                      name="response_text"
                      value={responseData.response_text}
                      onChange={handleResponseChange}
                      className="form-control"
                      rows="3"
                      placeholder="Enter your response to the complaint..."
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-warning">
                    Submit Response
                  </button>
                </form>
              </div>
            )}

            {complaintsForResponse.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From</th>
                    <th>Against</th>
                    <th>Complaint</th>
                    <th>Status</th>
                    <th>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaintsForResponse.map(complaint => (
                    <tr key={complaint.id} style={{ 
                      backgroundColor: responseData.complaint_id === complaint.id ? '#ffc10720' : 'transparent'
                    }}>
                      <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                      <td>{complaint.complainant_name}</td>
                      <td>{complaint.complaint_against_name}</td>
                      <td title={complaint.complaint_text}>
                        {complaint.complaint_text.length > 50 
                          ? complaint.complaint_text.substring(0, 50) + '...' 
                          : complaint.complaint_text}
                      </td>
                      <td>
                        <span className="status pending">
                          {complaint.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => quickRespond(complaint.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Quick Respond
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>
                No complaints requiring your response.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintForm;