import { useEffect, useState } from 'react';
import api from '../api';
import './DocumentList.css'; // or ./Documents.css if that's what you're using

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔹 Load documents for the logged-in user
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        setError('');

        // 👉 This matches your backend route: GET /documents/my
        const res = await api.get('/documents/my');
        // Expecting: { documents: [...] }
        setDocuments(res.data.documents || []);
      } catch (err) {
        console.error('Failed to load documents:', err);
        setError('⚠️ Failed to load documents.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getFileType = (mimeType) => {
    if (!mimeType) return 'FILE';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType === 'text/plain') return 'TXT';
    return 'FILE';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF':
        return '📄';
      case 'TXT':
        return '📝';
      default:
        return '📎';
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const handlePreview = (doc) => {
    // Backend must serve /uploads as static (e.g. app.use('/uploads', express.static('uploads'))
    const url = `https://documentdb.onrender.com/uploads/${doc.storedFilename}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (doc) => {
    const url = `https://documentdb.onrender.com/uploads/${doc.storedFilename}`;
    // Simple way: open in new tab, user can Save As
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 🔎 Filter + search
  const filteredDocuments = documents.filter((doc) => {
    const type = getFileType(doc.mimeType);
    const matchesSearch = doc.originalName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === 'all' || type.toLowerCase() === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="documents-page">
      <div className="documents-header">
        <h1>My Documents</h1>
        <p>View, preview, and download your uploaded files</p>
      </div>

      <div className="documents-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="txt">Text</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading documents...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No documents found</h3>
          <p>
            {searchTerm
              ? 'Try clearing your search.'
              : 'Upload a document to see it here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="documents-list">
            {filteredDocuments.map((doc) => {
              const type = getFileType(doc.mimeType);
              return (
                <div key={doc._id} className="document-card">
                  <div className="document-main">
                    <div className="document-icon">
                      {getFileIcon(type)}
                    </div>
                    <div className="document-info">
                      <h3 className="document-name">
                        {doc.originalName}
                      </h3>
                      <div className="document-meta">
                        <span>{type}</span>
                        <span>• {formatSize(doc.size)}</span>
                        <span>• Uploaded {formatDate(doc.createdAt)}</span>
                        <span>• Status: {doc.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="document-actions">
                    <button
                      className="action-btn preview"
                      onClick={() => handlePreview(doc)}
                    >
                      👁 Preview
                    </button>
                    <button
                      className="action-btn download"
                      onClick={() => handleDownload(doc)}
                    >
                      ⬇ Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="documents-footer">
            <p>Showing {filteredDocuments.length} document(s)</p>
          </div>
        </>
      )}
    </div>
  );
}

export default DocumentList;
