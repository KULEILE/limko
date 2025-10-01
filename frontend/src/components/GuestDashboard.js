import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const GuestDashboard = () => {
  const [stats, setStats] = useState({});
  const [faculties, setFaculties] = useState([]);
  const [staffHierarchy, setStaffHierarchy] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      setError('');
      setLoading(true);
      
      console.log('Fetching public data...');
      
      // Fetch all data in parallel
      const [statsRes, facultiesRes, staffRes, reportsRes] = await Promise.all([
        API.get('/public/stats').catch(err => {
          console.warn('Failed to fetch stats:', err);
          return { data: {} };
        }),
        API.get('/public/faculties').catch(err => {
          console.warn('Failed to fetch faculties:', err);
          return { data: [] };
        }),
        API.get('/public/staff-hierarchy').catch(err => {
          console.warn('Failed to fetch staff hierarchy:', err);
          return { data: {} };
        }),
        API.get('/public/reports').catch(err => {
          console.warn('Failed to fetch reports:', err);
          return { data: [] };
        })
      ]);
      
      setStats(statsRes.data);
      setFaculties(facultiesRes.data);
      setStaffHierarchy(staffRes.data);
      setRecentActivities(reportsRes.data);

      console.log('Staff hierarchy data loaded');

    } catch (err) {
      console.error('Error fetching public data:', err);
      setError('Unable to load some data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading">Loading public data...</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Error Message */}
      {error && (
        <div className="card" style={{ borderLeft: '4px solid #ffc107', marginBottom: '1rem' }}>
          <div style={{ color: '#ffc107', padding: '1rem' }}>
            <strong>Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              fontWeight: 'bold',
              color: '#000',
              fontSize: '14px'
            }}>
            
            </div>
          </div>
          <h1>Welcome to LUCT Faculty Reporter</h1>
          <p style={{ fontSize: '1.2rem', color: '#ccc', marginTop: '1rem' }}>
            Streamlining academic reporting and monitoring for Limkokwing University of Creative Technology, Lesotho
          </p>
        </div>
      </div>

      {/* Real Stats Overview from Database */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="stats">{stats.totalFaculties || 0}</div>
          <h3>Faculties</h3>
          <p>Active academic faculties</p>
        </div>
        
        <div className="dashboard-card">
          <div className="stats">{stats.totalCourses || 0}</div>
          <h3>Courses</h3>
          <p>Available courses</p>
        </div>
        
        <div className="dashboard-card">
          <div className="stats">{stats.totalClasses || 0}</div>
          <h3>Classes</h3>
          <p>Active classes</p>
        </div>

        <div className="dashboard-card">
          <div className="stats">{stats.totalStaff || 0}</div>
          <h3>Staff</h3>
          <p>Academic staff members</p>
        </div>

        <div className="dashboard-card">
          <div className="stats">{stats.totalStudents || 0}</div>
          <h3>Students</h3>
          <p>Registered students</p>
        </div>

        <div className="dashboard-card">
          <div className="stats">{stats.totalReports || 0}</div>
          <h3>Reports</h3>
          <p>Completed lecture reports</p>
        </div>

        {/* Additional Stats */}
        <div className="dashboard-card">
          <div className="stats">{stats.totalComplaints || 0}</div>
          <h3>Complaints</h3>
          <p>Issues reported & resolved</p>
        </div>

        <div className="dashboard-card">
          <div className="stats">{stats.avgRating ? stats.avgRating.toFixed(1) : '0.0'}/5</div>
          <h3>Avg Rating</h3>
          <p>Overall system satisfaction</p>
        </div>
      </div>

      {/* Faculties Overview with Real Data */}
      <div className="card">
        <h2>Our Faculties Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {faculties.map(faculty => (
            <div key={faculty.id} style={{ 
              padding: '1.5rem', 
              backgroundColor: '#2a2a2a', 
              borderRadius: '8px',
              borderLeft: '4px solid #007bff'
            }}>
              <h3 style={{ color: '#007bff', marginBottom: '0.5rem' }}>{faculty.name}</h3>
              <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>  {faculty.course_count || 0} Courses</span>
                  <span>  {faculty.class_count || 0} Classes</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>  {faculty.staff_count || 0} Staff</span>
                  <span>  {faculty.student_count || 0} Students</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>  {faculty.report_count || 0} Reports</span>
                  <span>  {faculty.avg_rating || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Hierarchy without Images */}
      <div className="card">
        <h2>Academic Staff Hierarchy</h2>
        {Object.keys(staffHierarchy).length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
            {Object.entries(staffHierarchy).map(([facultyId, facultyData]) => (
              <div key={facultyId} style={{ 
                padding: '1.5rem', 
                backgroundColor: '#2a2a2a', 
                borderRadius: '8px',
                border: '1px solid #444'
              }}>
                <h3 style={{ color: '#28a745', marginBottom: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>
                  {facultyData.faculty_name}
                  <span style={{ fontSize: '0.8rem', color: '#ccc', marginLeft: '1rem' }}>
                    ({facultyData.total_staff || 0} staff members)
                  </span>
                </h3>
                
                {/* Faculty Management */}
                {facultyData.fmg && facultyData.fmg.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#dc3545', fontSize: '1rem', marginBottom: '0.5rem' }}>Faculty Management</h4>
                    {facultyData.fmg.map(staff => (
                      <div key={staff.id} style={{ 
                        padding: '0.75rem', 
                        backgroundColor: '#333', 
                        marginBottom: '0.5rem', 
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{staff.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{staff.position}</div>
                        <div style={{ fontSize: '0.7rem', color: '#888' }}>{staff.email}</div>
                        {staff.phone && <div style={{ fontSize: '0.7rem', color: '#888' }}> {staff.phone}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Program Leaders */}
                {facultyData.pl && facultyData.pl.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#ffc107', fontSize: '1rem', marginBottom: '0.5rem' }}>Program Leaders</h4>
                    {facultyData.pl.map(staff => (
                      <div key={staff.id} style={{ 
                        padding: '0.75rem', 
                        backgroundColor: '#333', 
                        marginBottom: '0.5rem', 
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{staff.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{staff.position}</div>
                        <div style={{ fontSize: '0.7rem', color: '#888' }}>{staff.email}</div>
                        {staff.phone && <div style={{ fontSize: '0.7rem', color: '#888' }}> {staff.phone}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Program Representative Lecturers */}
                {facultyData.prl && facultyData.prl.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#17a2b8', fontSize: '1rem', marginBottom: '0.5rem' }}>Program Representative Lecturers</h4>
                    {facultyData.prl.map(staff => (
                      <div key={staff.id} style={{ 
                        padding: '0.75rem', 
                        backgroundColor: '#333', 
                        marginBottom: '0.5rem', 
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{staff.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{staff.position}</div>
                        <div style={{ fontSize: '0.7rem', color: '#888' }}>{staff.email}</div>
                        {staff.phone && <div style={{ fontSize: '0.7rem', color: '#888' }}> {staff.phone}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Lecturers */}
                {facultyData.lecturer && facultyData.lecturer.length > 0 && (
                  <div>
                    <h4 style={{ color: '#007bff', fontSize: '1rem', marginBottom: '0.5rem' }}>
                      Lecturers ({facultyData.lecturer.length})
                    </h4>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                      {facultyData.lecturer.map(staff => (
                        <div key={staff.id} style={{ 
                          padding: '0.5rem', 
                          marginBottom: '0.5rem', 
                          borderRadius: '6px',
                          backgroundColor: '#333'
                        }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{staff.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#ccc' }}>{staff.position}</div>
                          <div style={{ fontSize: '0.7rem', color: '#888' }}>{staff.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>
            No staff hierarchy data available
          </p>
        )}
      </div>

      {/* Recent Public Activities */}
      <div className="card">
        <h2>Recent Academic Activities</h2>
        {recentActivities.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Course</th>
                  <th>Lecturer</th>
                  <th>Week</th>
                  <th>Topic</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map(activity => (
                  <tr key={activity.id}>
                    <td>{activity.class_name}</td>
                    <td>{activity.course_name}</td>
                    <td>{activity.lecturer_name}</td>
                    <td>Week {activity.week_number}</td>
                    <td title={activity.topic_taught}>
                      {activity.topic_taught?.length > 50 
                        ? activity.topic_taught.substring(0, 50) + '...' 
                        : activity.topic_taught}
                    </td>
                    <td>{new Date(activity.date_of_lecture).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        backgroundColor: activity.status === 'completed' ? '#28a745' : 
                                        activity.status === 'pending' ? '#ffc107' : '#dc3545',
                        color: 'white'
                      }}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>
            No recent activities to display
          </p>
        )}
      </div>

      {/* System Features Section */}
      <div className="card">
        <h2>Comprehensive System Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ color: '#007bff' }}> Lecture Reporting</h3>
            <p>Comprehensive lecture reporting with topics covered, attendance tracking, materials used, and learning outcomes assessment.</p>
          </div>
          
          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ color: '#28a745' }}>  Rating & Feedback System</h3>
            <p>Multi-level rating system for lectures, courses, and lecturers with detailed feedback mechanisms.</p>
          </div>
          
          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ color: '#ffc107' }}>  Complaints Management</h3>
            <p>Structured complaint system with hierarchical escalation, tracking, and resolution feedback.</p>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ color: '#dc3545' }}> Analytics & Reporting</h3>
            <p>Advanced analytics dashboard with performance metrics, attendance trends, and academic insights.</p>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ color: '#17a2b8' }}>  Staff Hierarchy</h3>
            <p>Clear organizational structure with defined roles from faculty management to lecturers.</p>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ color: '#6f42c1' }}> Notification System</h3>
            <p>Real-time notifications for report submissions, complaints, ratings, and system updates.</p>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ color: '#fd7e14' }}> Course Management</h3>
            <p>Complete course lifecycle management from creation to monitoring and evaluation.</p>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ color: '#20c997' }}> Attendance Tracking</h3>
            <p>Automated attendance recording with pattern analysis and reporting capabilities.</p>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ color: '#e83e8c' }}> Progress Monitoring</h3>
            <p>Track academic progress, course completion rates, and performance indicators.</p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="card">
        <h2>Benefits for Academic Community</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
            <h4>For Lecturers</h4>
            <ul style={{ color: '#ccc', marginTop: '1rem', paddingLeft: '1rem' }}>
              <li>Streamlined report submission</li>
              <li>Performance feedback</li>
              <li>Attendance management</li>
              <li>Course analytics</li>
            </ul>
          </div>
          
          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px', borderLeft: '4px solid #007bff' }}>
            <h4>For Students</h4>
            <ul style={{ color: '#ccc', marginTop: '1rem', paddingLeft: '1rem' }}>
              <li>Voice concerns through complaints</li>
              <li>Rate teaching quality</li>
              <li>Track academic progress</li>
              <li>Access course information</li>
            </ul>
          </div>
          
          <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
            <h4>For Management</h4>
            <ul style={{ color: '#ccc', marginTop: '1rem', paddingLeft: '1rem' }}>
              <li>Real-time academic monitoring</li>
              <li>Performance analytics</li>
              <li>Quality assurance</li>
              <li>Decision support data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="card" style={{ textAlign: 'center', backgroundColor: '#1a1a1a' }}>
        <h2>Ready to Get Started?</h2>
        <p style={{ fontSize: '1.1rem', color: '#ccc', marginBottom: '2rem' }}>
          Join our academic community and experience streamlined academic reporting and monitoring.
        </p>
        <div>
          <Link to="/login" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            Login to System
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Create Account
          </Link>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#888' }}>
          Need help? Contact system administrator at admin@luct.ac.ls
        </p>
      </div>
    </div>
  );
};

export default GuestDashboard;