import {
  ContentCopy,
  Delete,
  History,
  Refresh,
  Search,
  ThumbDown,
  ThumbUp
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../api'; // ✅ make sure this exists and adds JWT
import './QueryHistory.css';

function QueryHistory({ compact = false }) {
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/queries');

        // 🔁 Normalize backend shape -> UI shape
        const backendQueries = res.data.queries || [];
        const normalized = backendQueries.map((q) => ({
          id: q._id,
          question: q.question,
          answer: q.answer,
          timestamp: new Date(q.createdAt).toLocaleString(),
          documents: Array.from(
            new Set(
              (q.sources || []).map(
                (s) => s.documentName || 'Unknown document'
              )
            )
          ),
          feedback: q.feedback ?? null, // optional, can keep null
        }));

        setQueries(normalized);
        if (normalized.length > 0) {
          setSelectedQuery(normalized[0]);
        }
      } catch (err) {
        console.error('Failed to fetch queries:', err);
        setQueries([]);
        setSelectedQuery(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueries();
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm('This only removes the query from the UI, not from the database. Continue?')) {
      return;
    }
    setQueries(prev => prev.filter(query => query.id !== id));
    if (selectedQuery?.id === id) {
      setSelectedQuery(null);
    }
  };

  const handleRefresh = async () => {
    if (isLoading) return;
    // just re-run the same logic as above
    try {
      setIsLoading(true);
      const res = await api.get('/queries');
      const backendQueries = res.data.queries || [];
      const normalized = backendQueries.map((q) => ({
        id: q._id,
        question: q.question,
        answer: q.answer,
        timestamp: new Date(q.createdAt).toLocaleString(),
        documents: Array.from(
          new Set(
            (q.sources || []).map(
              (s) => s.documentName || 'Unknown document'
            )
          )
        ),
        feedback: q.feedback ?? null,
      }));

      setQueries(normalized);
      if (normalized.length > 0) {
        setSelectedQuery(normalized[0]);
      } else {
        setSelectedQuery(null);
      }
    } catch (err) {
      console.error('Failed to refresh queries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleFeedback = (id, feedback) => {
    setQueries(prev => prev.map(query =>
      query.id === id ? { ...query, feedback } : query
    ));
    if (selectedQuery?.id === id) {
      setSelectedQuery(prev => ({ ...prev, feedback }));
    }
  };

  const getFeedbackIcon = (feedback) => {
    switch (feedback) {
      case 'like':
        return <ThumbUp className="feedback-icon liked" />;
      case 'dislike':
        return <ThumbDown className="feedback-icon disliked" />;
      default:
        return null;
    }
  };

  // simple stat: how many today
  const todayCount = (() => {
    const today = new Date().toISOString().split('T')[0];
    return queries.filter((q) => {
      const datePart = new Date(q.timestamp).toISOString().split('T')[0];
      return datePart === today;
    }).length;
  })();

  return (
    <div className={`query-history ${compact ? 'compact' : ''}`}>
      <div className="history-header">
        <div className="header-title">
          <History className="header-icon" />
          <h2>Query History</h2>
        </div>
        <button
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <Refresh />
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading history...</div>
      ) : (
        <>
          <div className="history-content">
            <div className="query-list">
              {queries.length === 0 && (
                <div className="empty-list">
                  <p>No queries found yet. Ask something in the AI Search page!</p>
                </div>
              )}

              {queries.map(query => (
                <div
                  key={query.id}
                  className={`query-item ${selectedQuery?.id === query.id ? 'selected' : ''}`}
                  onClick={() => setSelectedQuery(query)}
                >
                  <div className="query-preview">
                    <Search className="query-icon" />
                    <div className="query-text">
                      <p className="question">{query.question}</p>
                      <div className="query-meta">
                        <span className="timestamp">{query.timestamp}</span>
                        {query.feedback && getFeedbackIcon(query.feedback)}
                      </div>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(query.id);
                    }}
                    title="Delete"
                  >
                    <Delete />
                  </button>
                </div>
              ))}
            </div>

            {selectedQuery && (
              <div className="query-detail">
                <div className="detail-header">
                  <h3>Question & Answer</h3>
                  <button
                    className="close-btn"
                    onClick={() => setSelectedQuery(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="question-section">
                  <strong>Question:</strong>
                  <p>{selectedQuery.question}</p>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(selectedQuery.question)}
                    title="Copy question"
                  >
                    <ContentCopy />
                  </button>
                </div>

                <div className="answer-section">
                  <strong>Answer:</strong>
                  <p>{selectedQuery.answer}</p>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(selectedQuery.answer)}
                    title="Copy answer"
                  >
                    <ContentCopy />
                  </button>
                </div>

                <div className="documents-section">
                  <strong>Referenced Documents:</strong>
                  <div className="document-tags">
                    {selectedQuery.documents.length === 0 && (
                      <span className="document-tag">No documents recorded</span>
                    )}
                    {selectedQuery.documents.map((doc, index) => (
                      <span key={index} className="document-tag">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="feedback-section">
                  <strong>Feedback:</strong>
                  <div className="feedback-buttons">
                    <button
                      className={`feedback-btn ${selectedQuery.feedback === 'like' ? 'active' : ''}`}
                      onClick={() => handleFeedback(selectedQuery.id, 'like')}
                      title="Helpful"
                    >
                      <ThumbUp />
                    </button>
                    <button
                      className={`feedback-btn ${selectedQuery.feedback === 'dislike' ? 'active' : ''}`}
                      onClick={() => handleFeedback(selectedQuery.id, 'dislike')}
                      title="Not helpful"
                    >
                      <ThumbDown />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!compact && !selectedQuery && (
            <div className="history-stats">
              <div className="stat-item">
                <span className="stat-label">Total Queries</span>
                <span className="stat-value">{queries.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Helpful</span>
                <span className="stat-value">
                  {queries.filter(q => q.feedback === 'like').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Today</span>
                <span className="stat-value">{todayCount}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default QueryHistory;
