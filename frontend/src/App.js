import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import GuestDashboard from './components/GuestDashboard';
import ReportForm from './components/ReportForm';
import ComplaintForm from './components/ComplaintForm';
import Monitoring from './components/Monitoring';
import Rating from './components/Rating';
import Classes from './components/Classes';
import Assignment from './components/Assignment';
import ClassRepresentative from './components/ClassRepresentative';
import DownloadData from './components/DownloadData';
import UserProfile from './components/UserProfile'; // Add this import
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/'; // Redirect to guest dashboard
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <div className="logo-container">
            {/* Logo Image - Replace with your actual logo path */}
            <img 
              src="/images/logo.png" 
              alt="LUCT Logo" 
              style={{
                height: '90px',
                width: 'auto',
                maxWidth: '150px'
              }}
              onError={(e) => {
                // Fallback to text if image fails to load
                e.target.style.display = 'none';
                // Show text fallback
                const fallback = document.createElement('div');
                fallback.style.cssText = `
                  width: 50px;
                  height: 50px;
                  background-color: #fff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 4px;
                  font-weight: bold;
                  color: #000;
                  font-size: 14px;
                `;
                fallback.textContent = 'LUCT';
                e.target.parentNode.appendChild(fallback);
              }}
            />
            <h1>LUCT Faculty Reporter</h1>
          </div>
          <div className="user-info">
            {user ? (
              <>
                <span>Welcome, {user.name} ({user.role.toUpperCase()})</span>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Link to="/profile" className="btn btn-outline" style={{ 
                    padding: '0.5rem 1rem', 
                    border: '1px solid #007bff',
                    color: '#007bff',
                    textDecoration: 'none',
                    borderRadius: '4px'
                  }}>
                    My Profile
                  </Link>
                  <button onClick={logout} className="logout-btn">Logout</button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </header>

        {user && (
          <nav style={{
            backgroundColor: '#000000',
            padding: '1rem 2rem',
            borderBottom: '1px solid #333'
          }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
              
              {(user.role === 'lecturer' || user.role === 'prl' || user.role === 'pl' || user.role === 'fmg') && (
                <Link to="/reports" style={{ color: '#fff', textDecoration: 'none' }}>Create Report</Link>
              )}
              
              <Link to="/complaints" style={{ color: '#fff', textDecoration: 'none' }}>Complaints</Link>
              <Link to="/monitoring" style={{ color: '#fff', textDecoration: 'none' }}>Monitoring</Link>
              <Link to="/ratings" style={{ color: '#fff', textDecoration: 'none' }}>Ratings</Link>
              <Link to="/download" style={{ color: '#fff', textDecoration: 'none' }}>Download Data</Link>
              
              {user.role === 'pl' && (
                <>
                  <Link to="/classes" style={{ color: '#fff', textDecoration: 'none' }}>Classes</Link>
                  <Link to="/assignments" style={{ color: '#fff', textDecoration: 'none' }}>Assignments</Link>
                </>
              )}
              
              {user.role === 'student' && user.is_class_rep && (
                <Link to="/class-rep" style={{ color: '#fff', textDecoration: 'none' }}>Class Rep</Link>
              )}
            </div>
          </nav>
        )}

        <main style={{ minHeight: 'calc(100vh - 200px)' }}>
          <Routes>
            {/* Public Routes - No login required */}
            <Route path="/" element={<GuestDashboard />} />
            <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            
            {/* Protected Routes - Require Login */}
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login?redirect=dashboard" />} />
            <Route path="/reports" element={user ? <ReportForm user={user} /> : <Navigate to="/login?redirect=reports" />} />
            <Route path="/complaints" element={user ? <ComplaintForm user={user} /> : <Navigate to="/login?redirect=complaints" />} />
            <Route path="/monitoring" element={user ? <Monitoring user={user} /> : <Navigate to="/login?redirect=monitoring" />} />
            <Route path="/ratings" element={user ? <Rating user={user} /> : <Navigate to="/login?redirect=ratings" />} />
            <Route path="/classes" element={user ? <Classes user={user} /> : <Navigate to="/login?redirect=classes" />} />
            <Route path="/assignments" element={user ? <Assignment user={user} /> : <Navigate to="/login?redirect=assignments" />} />
            <Route path="/class-rep" element={user ? <ClassRepresentative user={user} /> : <Navigate to="/login?redirect=class-rep" />} />
            <Route path="/download" element={user ? <DownloadData user={user} /> : <Navigate to="/login?redirect=download" />} />
            <Route path="/profile" element={user ? <UserProfile user={user} /> : <Navigate to="/login?redirect=profile" />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer style={{
          backgroundColor: '#1a1a1a',
          color: '#ccc',
          padding: '2rem',
          borderTop: '1px solid #333',
          marginTop: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Logo and Description */}
            <div>
              <img 
                src="/images/logo.png" 
                alt="LUCT Logo" 
                style={{
                  height: '40px',
                  width: 'auto',
                  marginBottom: '1rem'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.style.cssText = `
                    width: 40px;
                    height: 40px;
                    background-color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    font-weight: bold;
                    color: #000;
                    font-size: 12px;
                    margin-bottom: 1rem;
                  `;
                  fallback.textContent = 'LUCT';
                  e.target.parentNode.appendChild(fallback);
                }}
              />
              <p style={{ lineHeight: '1.6', fontSize: '0.9rem' }}>
                Limkokwing University of Creative Technology, Lesotho
                <br />
                Streamlining academic reporting and monitoring for enhanced educational excellence.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ color: '#007bff', marginBottom: '1rem' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
                <li><Link to="/" style={{ color: '#ccc', textDecoration: 'none' }}>Home</Link></li>
                {user && <li><Link to="/dashboard" style={{ color: '#ccc', textDecoration: 'none' }}>Dashboard</Link></li>}
                <li><Link to="/login" style={{ color: '#ccc', textDecoration: 'none' }}>Login</Link></li>
                <li><Link to="/register" style={{ color: '#ccc', textDecoration: 'none' }}>Register</Link></li>
              </ul>
            </div>

            {/* System Features */}
            <div>
              <h4 style={{ color: '#007bff', marginBottom: '1rem' }}>System Features</h4>
              <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2', fontSize: '0.9rem' }}>
                <li>  Lecture Reporting</li>
                <li>  Rating System</li>
                <li>  Complaints Management</li>
                <li>  Class Monitoring</li>
                <li>  Performance Analytics</li>
              </ul>
            </div>

            {/* Contact Information */}
            <div>
              <h4 style={{ color: '#007bff', marginBottom: '1rem' }}>Contact Info</h4>
              <div style={{ lineHeight: '2', fontSize: '0.9rem' }}>
                <div>  Maseru, Lesotho</div>
                <div>   +266 559508861</div>
                <div>   info@luct.ac.ls</div>
                <div>   www.limkokwing.co.ls</div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div style={{
            borderTop: '1px solid #333',
            marginTop: '2rem',
            paddingTop: '1rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#888'
          }}>
            <p>
              &copy; {new Date().getFullYear()} Limkokwing University of Creative Technology, Lesotho. 
              All rights reserved. | Faculty Reporter System v1.0
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;