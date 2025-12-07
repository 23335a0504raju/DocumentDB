import {
  CloudUpload,
  Dashboard as DashboardIcon,
  Description,
  History,
  Search,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../api';
import DocumentList from '../components/DocumentList';
import QueryHistory from '../components/QueryHistory';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    processedDocuments: 0,
    totalQueries: 0,
    recentUploads: [],
    docsLast7Days: 0,
    queriesToday: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper: normalize status to "Processed" / "Processing" / "Failed" / other
  const normalizeStatus = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'ready' || s === 'processed') return 'Processed';
    if (s === 'processing' || s === 'uploaded') return 'Processing';
    if (s === 'failed' || s === 'error') return 'Failed';
    return status;
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const isWithinLastDays = (iso, days) => {
    if (!iso) return false;
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= days && diffDays >= 0;
  };

  const isSameDay = (iso, ref = new Date()) => {
    if (!iso) return false;
    const d = new Date(iso);
    return (
      d.getFullYear() === ref.getFullYear() &&
      d.getMonth() === ref.getMonth() &&
      d.getDate() === ref.getDate()
    );
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError('');

        // 🔹 Fetch documents + queries in parallel
        const [docsRes, queriesRes] = await Promise.all([
          api.get('/documents/my'), // { documents: [...] }
          api.get('/queries'),      // { queries: [...] }
        ]);

        const documents = docsRes.data.documents || [];
        const queries = queriesRes.data.queries || [];

        const totalDocuments = documents.length;
        const processedDocuments = documents.filter(
          (d) => normalizeStatus(d.status) === 'Processed'
        ).length;
        const totalQueries = queries.length;

        // 📈 Docs uploaded in the last 7 days
        const docsLast7Days = documents.filter((d) =>
          isWithinLastDays(d.createdAt, 7)
        ).length;

        // 📈 Queries asked today
        const queriesToday = queries.filter((q) =>
          isSameDay(q.createdAt)
        ).length;

        // Sort docs by createdAt desc and take latest 3
        const recentUploads = [...documents]
          .sort((a, b) => {
            const da = new Date(a.createdAt || 0).getTime();
            const db = new Date(b.createdAt || 0).getTime();
            return db - da;
          })
          .slice(0, 3)
          .map((d) => ({
            name: d.originalName || d.storedFilename || 'Untitled',
            status: normalizeStatus(d.status),
            date: formatDate(d.createdAt),
          }));

        setStats({
          totalDocuments,
          processedDocuments,
          totalQueries,
          recentUploads,
          docsLast7Days,
          queriesToday,
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            'Failed to load dashboard data.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const completionPercent =
    stats.totalDocuments > 0
      ? ((stats.processedDocuments / stats.totalDocuments) * 100).toFixed(0)
      : 0;

  // Latest upload date for "Recent Activity" card
  const latestUploadDate =
    stats.recentUploads.length > 0 ? stats.recentUploads[0].date : null;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <DashboardIcon className="title-icon" />
          <h1>Dashboard</h1>
        </div>
        <p className="dashboard-subtitle">
          Manage your documents and AI-powered search queries
        </p>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {isLoading ? (
        <div className="loading">Loading dashboard data...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            {/* Total Documents */}
            <div className="stat-card">
              <div className="stat-icon">
                <Description />
              </div>
              <div className="stat-content">
                <h3>Total Documents</h3>
                <p className="stat-number">{stats.totalDocuments}</p>
                <span className="stat-change">
                  {stats.docsLast7Days > 0
                    ? `${stats.docsLast7Days} new this week`
                    : 'No new docs this week'}
                </span>
              </div>
            </div>

            {/* Processed */}
            <div className="stat-card">
              <div className="stat-icon">
                <CloudUpload />
              </div>
              <div className="stat-content">
                <h3>Processed</h3>
                <p className="stat-number">{stats.processedDocuments}</p>
                <span className="stat-change">
                  {completionPercent}% complete
                </span>
              </div>
            </div>

            {/* Total Queries */}
            <div className="stat-card">
              <div className="stat-icon">
                <Search />
              </div>
              <div className="stat-content">
                <h3>Total Queries</h3>
                <p className="stat-number">{stats.totalQueries}</p>
                <span className="stat-change">
                  {stats.queriesToday > 0
                    ? `${stats.queriesToday} asked today`
                    : 'No queries today'}
                </span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="stat-card">
              <div className="stat-icon">
                <History />
              </div>
              <div className="stat-content">
                <h3>Recent Activity</h3>
                <p className="stat-number">{stats.recentUploads.length}</p>
                <span className="stat-change">
                  {latestUploadDate
                    ? `Last upload: ${latestUploadDate}`
                    : 'No uploads yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Uploads list */}
          {stats.recentUploads.length > 0 && (
            <div className="recent-uploads">
              <h3>Recent Uploads</h3>
              <ul>
                {stats.recentUploads.map((u, idx) => (
                  <li key={idx}>
                    <span className="recent-name">{u.name}</span>
                    <span className="recent-meta">
                      • {u.status} • {u.date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="dashboard-content">
            <div className="content-grid">
              <div className="grid-item-full">
                <DocumentList />
              </div>
            </div>

            <div className="content-grid">
              <div className="grid-item-full">
                <QueryHistory />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
