import { useEffect, useState } from 'react'; // Import useState here
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ // Use useState directly
    documents: 0,
    queries: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(false); // Use useState directly

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/search', icon: '🔍', label: 'AI Search' },
    { path: '/upload', icon: '📤', label: 'Upload' },
    { path: '/documents', icon: '📄', label: 'Documents' },
    { path: '/history', icon: '🕒', label: 'Query History' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    // remove auth info from storage
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberedEmail');

    navigate('/login');
    onClose();
  };

  const handleOverlayClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  // 🔹 Fetch small stats for sidebar: document count + query count
  useEffect(() => {
    const fetchSidebarStats = async () => {
      try {
        setIsStatsLoading(true);

        const [docsRes, queriesRes] = await Promise.all([
          api.get('/documents/my'), // { documents: [...] }
          api.get('/queries'),      // { queries: [...] }
        ]);

        const documents = docsRes.data.documents || [];
        const queries = queriesRes.data.queries || [];

        setStats({
          documents: documents.length,
          queries: queries.length,
        });
      } catch (err) {
        console.error('Failed to load sidebar stats:', err);
        // we won't show an error UI in sidebar; just leave defaults
      } finally {
        setIsStatsLoading(false);
      }
    };

    // Only fetch when sidebar mounts (or when you want)
    fetchSidebarStats();
  }, []);

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={handleOverlayClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
        aria-label="Close sidebar"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>DocIntel</h2>
          <button
            className="close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className="nav-link"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigation(item.path);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="stat-label">Documents</span>
              <span className="stat-value">
                {isStatsLoading ? '...' : stats.documents}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Queries</span>
              <span className="stat-value">
                {isStatsLoading ? '...' : stats.queries}
              </span>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
          >
            <span className="logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
