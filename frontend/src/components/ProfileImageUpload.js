import React, { useState } from 'react';
import API from '../services/api';

const ProfileImageUpload = ({ user, onImageUpdate, showButton = true }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Selected file:', file.name, file.size, file.type);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('profile_image', file);

    try {
      console.log('Uploading image for user:', user.id);
      const response = await API.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response.data);
      setMessage('Profile image updated successfully! Refreshing page...');
      
      // Update localStorage
      const updatedUser = { 
        ...user, 
        profile_image: response.data.imagePath + '?refresh=' + Date.now()
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Trigger custom event to notify GuestDashboard
      const profileUpdateEvent = new CustomEvent('profileImageUpdated', {
        detail: { 
          userId: user.id,
          imagePath: response.data.imagePath 
        }
      });
      window.dispatchEvent(profileUpdateEvent);

      // Force page reload to see changes everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response);
      setMessage(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleImageError = (e) => {
    console.log('Image failed to load:', e.target.src);
    e.target.src = '/images/profiles/default-avatar.png';
    e.target.onerror = null;
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: showButton ? '1rem' : '0',
      margin: showButton ? '1rem 0' : '0'
    }}>
      {/* Profile Image Display */}
      <div style={{
        width: showButton ? '120px' : '50px',
        height: showButton ? '120px' : '50px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        margin: showButton ? '0 auto 1rem' : '0',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: showButton ? '24px' : '14px',
        border: '3px solid #444',
        cursor: showButton ? 'pointer' : 'default'
      }}
      onClick={() => showButton && document.getElementById('profile-image-input').click()}
      title={showButton ? 'Click to change photo' : ''}
      >
        <img 
          src={user.profile_image || '/images/profiles/default-avatar.png'} 
          alt={user.name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
          onError={handleImageError}
        />
      </div>
      
      {/* Upload Button (only show if showButton is true) */}
      {showButton && (
        <>
          <label 
            className="btn btn-primary" 
            style={{ 
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1
            }}
          >
            {uploading ? 'Uploading...' : 'Change Photo'}
            <input
              id="profile-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          
          <div style={{ fontSize: '0.8rem', color: '#ccc', marginTop: '0.5rem' }}>
            Max 5MB • JPEG, PNG, GIF
          </div>
        </>
      )}
      
      {/* Message Display */}
      {message && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem',
          borderRadius: '4px',
          backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
          color: message.includes('success') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;