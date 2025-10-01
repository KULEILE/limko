import React from 'react';
import ProfileImageUpload from './ProfileImageUpload';

const UserProfile = ({ user }) => {
  return (
    <div className="main-content">
      <div className="card">
        <h2>My Profile</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'auto 1fr', 
          gap: '2rem', 
          alignItems: 'start',
          padding: '2rem'
        }}>
          {/* Profile Image Section */}
          <div>
            <ProfileImageUpload 
              user={user} 
              onImageUpdate={(newImagePath) => {
                console.log('Image updated to:', newImagePath);
              }}
              showButton={true}
            />
          </div>
          
          {/* User Information Section */}
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#007bff', marginBottom: '0.5rem' }}>{user.name}</h3>
              <p style={{ color: '#ccc', margin: 0 }}>{user.email}</p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              backgroundColor: '#2a2a2a',
              padding: '1.5rem',
              borderRadius: '8px'
            }}>
              <div>
                <strong style={{ color: '#007bff' }}>Role:</strong>
                <div style={{ color: '#ccc', textTransform: 'capitalize' }}>{user.role}</div>
              </div>
              
              <div>
                <strong style={{ color: '#007bff' }}>Faculty:</strong>
                <div style={{ color: '#ccc' }}>{user.faculty_name || 'Not assigned'}</div>
              </div>
              
              {user.class_name && (
                <div>
                  <strong style={{ color: '#007bff' }}>Class:</strong>
                  <div style={{ color: '#ccc' }}>{user.class_name}</div>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ color: '#ffc107', marginBottom: '1rem' }}>Profile Instructions</h4>
              <ul style={{ color: '#ccc', lineHeight: '1.6' }}>
                <li>Click on your profile picture or "Change Photo" to upload a new image</li>
                <li>Supported formats: JPEG, PNG, GIF</li>
                <li>Maximum file size: 5MB</li>
                <li>For best results, use a square image</li>
                <li>Your profile picture will be visible to other users in the system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;