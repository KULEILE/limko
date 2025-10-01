import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({});
  const [recentReports, setRecentReports] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const reportsRes = await API.get('/reports');
      
      setRecentReports(reportsRes.data.slice(0, 5));
      
      // Calculate real stats based on user role and actual data
      const userStats = {
        totalReports: reportsRes.data.length,
        pendingReports: reportsRes.data.filter(r => r.status === 'pending').length,
        signedReports: reportsRes.data.filter(r => r.status === 'signed').length,
        myReports: reportsRes.data.filter(r => r.lecturer_id === user.id).length
      };
      setStats(userStats);

      // Fetch user's classes based on role
      if (user.role === 'student' && user.class_id) {
        try {
          const classRes = await API.get(`/system/classes/${user.class_id}`);
          setUserClasses([classRes.data]);
        } catch (err) {
          console.log('No specific class data available');
          // If class endpoint fails, just show the class_id
          setUserClasses([{ 
            id: user.class_id, 
            name: `Class ${user.class_id}`,
            course_name: 'Your Class',
            course_code: 'CLASS'
          }]);
        }
      } else if (user.role === 'lecturer') {
        try {
          const assignmentsRes = await API.get('/assignments');
          setUserClasses(assignmentsRes.data);
        } catch (err) {
          console.log('No assignments data available');
          setUserClasses([]);
        }
      } else {
        // For other roles, show empty classes
        setUserClasses([]);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const messages = {
      student: "Welcome to your student dashboard. Check your class reports and ratings.",
      lecturer: "Welcome to your lecturer dashboard. Create reports and monitor your classes.",
      prl: "Welcome Principal Lecturer. Monitor reports and provide feedback.",
      pl: "Welcome Program Leader. Manage courses and assignments.",
      fmg: "Welcome Faculty Management. Overview of all faculty activities."
    };
    return messages[user.role] || "Welcome to LUCT Faculty Reporter";
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <h2>Welcome back, {user.name}!</h2>
        <p><strong>Role:</strong> {user.role.toUpperCase()} | <strong>Faculty:</strong> {user.faculty_id}</p>
        <p>{getWelcomeMessage()}</p>
      </div>

      {/* Real Stats from Database */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Reports</h3>
          <div className="stats">{stats.totalReports || 0}</div>
          <p>All time reports</p>
        </div>
        
        <div className="dashboard-card">
          <h3>Pending Reports</h3>
          <div className="stats">{stats.pendingReports || 0}</div>
          <p>Awaiting action</p>
        </div>
        
        <div className="dashboard-card">
          <h3>Signed Reports</h3>
          <div className="stats">{stats.signedReports || 0}</div>
          <p>Completed reports</p>
        </div>

        {(user.role === 'lecturer' || user.role === 'prl' || user.role === 'pl') && (
          <div className="dashboard-card">
            <h3>My Reports</h3>
            <div className="stats">{stats.myReports || 0}</div>
            <p>Reports I created</p>
          </div>
        )}
      </div>

      {/* User's Classes/Assignments */}
      {userClasses.length > 0 && (
        <div className="card">
          <h3>Your {user.role === 'student' ? 'Class' : 'Assigned Classes'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {userClasses.map(cls => (
              <div key={cls.id} style={{ 
                padding: '1rem', 
                backgroundColor: '#2a2a2a', 
                borderRadius: '4px',
                border: '1px solid #444'
              }}>
                <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>
                  {cls.name || cls.class_name || `Class ${cls.id}`}
                </h4>
                <p style={{ color: '#ccc', fontSize: '0.9rem', margin: 0 }}>
                  {cls.course_name} {cls.course_code && `(${cls.course_code})`}
                </p>
                {cls.total_students && (
                  <p style={{ color: '#999', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>
                    👥 {cls.total_students} students
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Recent Reports with Real Data */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Recent Reports</h3>
            <Link to="/reports" className="btn btn-primary btn-sm">View All</Link>
          </div>
          {recentReports.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Topic</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map(report => (
                  <tr key={report.id}>
                    <td>{report.class_name || 'Unnamed Class'}</td>
                    <td title={report.topic_taught}>
                      {report.topic_taught && report.topic_taught.length > 30 
                        ? report.topic_taught.substring(0, 30) + '...' 
                        : report.topic_taught || 'No topic'}
                    </td>
                    <td>
                      <span className={`status ${report.status}`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#ccc', padding: '1rem' }}>
              No reports found
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(user.role === 'lecturer' || user.role === 'prl' || user.role === 'pl' || user.role === 'fmg') && (
              <Link to="/reports" className="btn btn-primary" style={{ textAlign: 'center' }}>
                Create New Report
              </Link>
            )}
            <Link to="/complaints" className="btn btn-primary" style={{ textAlign: 'center' }}>
              File Complaint
            </Link>
            <Link to="/monitoring" className="btn btn-primary" style={{ textAlign: 'center' }}>
              View Monitoring
            </Link>
            <Link to="/download" className="btn btn-primary" style={{ textAlign: 'center' }}>
              Download Data
            </Link>
            {user.role === 'pl' && (
              <Link to="/assignments" className="btn btn-primary" style={{ textAlign: 'center' }}>
                Manage Assignments
              </Link>
            )}
            {user.role === 'student' && user.is_class_rep && (
              <Link to="/class-rep" className="btn btn-primary" style={{ textAlign: 'center' }}>
                Class Rep Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;