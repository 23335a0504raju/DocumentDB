import { useEffect, useState } from 'react';
import api from '../api';
import './Profile.css';

function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    joinedDate: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/me');

        const user = res.data.user;

        const joinedDate = user.createdAt
          ? new Date(user.createdAt).toISOString().slice(0, 10)
          : '';

        setProfile({
          name: user.name || '',
          email: user.email || '',
          joinedDate,
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-page">
        <h2>Loading your profile...</h2>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>User Profile</h1>
        <p>Your account information</p>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-details">

          <div className="detail-item">
            <label>Full Name:</label>
            <p>{profile.name || 'Not available'}</p>
          </div>

          <div className="detail-item">
            <label>Email Address:</label>
            <p>{profile.email}</p>
          </div>

          {profile.joinedDate && (
            <div className="detail-item">
              <label>Joined Date:</label>
              <p>{profile.joinedDate}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Profile;
