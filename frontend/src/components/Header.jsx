import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Get user name from localStorage
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="menu-btn" 
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div 
          className="logo" 
          onClick={() => navigate('/dashboard')} 
          style={{ cursor: 'pointer' }}
        >
          <h1>DocIntel</h1>
          <span className="logo-subtitle">Knowledge Search Hub</span>
        </div>
      </div>
      
      <div className="header-right">
        <button 
          className="user-btn"
          onClick={handleProfileClick}
          aria-label="Profile"
        >
          {/* Show name if exists, else icon */}
          {userName ? userName : '👤'}
        </button>
      </div>
    </header>
  );
}

export default Header;
