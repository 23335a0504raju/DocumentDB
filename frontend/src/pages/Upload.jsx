import { useState } from 'react';
import api from '../api'; // ✅ talk to backend
import './Upload.css';

function Upload() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState('');
  const [folderName, setFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('default');

  // ✅ make folders stateful so new folders work
  const [folders, setFolders] = useState([
    { id: 'default', name: 'Default' },
    { id: 'reports', name: 'Reports' },
    { id: 'meetings', name: 'Meeting Notes' },
    { id: 'research', name: 'Research Papers' },
    { id: 'personal', name: 'Personal' }
  ]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (fileList) => {
    // ✅ only allow types your backend accepts: PDF & TXT
    const validFiles = fileList.filter(file => {
      const validTypes = [
        'application/pdf',
        'text/plain',
      ];
      const isValidType = validTypes.includes(file.type);
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      return isValidType && isValidSize;
    });

    const newFiles = validFiles.map(file => {
      const type =
        file.type === 'application/pdf'
          ? 'PDF'
          : file.type === 'text/plain'
          ? 'TXT'
          : 'FILE';

      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type,
        status: 'pending',
        progress: 0,
        folder: selectedFolder || 'default',
      };
    });

    if (newFiles.length === 0 && fileList.length > 0) {
      alert('Only PDF and TXT files up to 50MB are allowed.');
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  // ✅ REAL upload to backend instead of simulateUpload
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploadStatus('uploading');

    // upload only pending files
    for (const fileObj of files.filter(f => f.status === 'pending')) {
      await uploadSingleFile(fileObj);
    }
    
    setUploadStatus('completed');
    setTimeout(() => {
      setUploadStatus('');
      // Clear only uploaded files
      setFiles(prev => prev.filter(f => f.status !== 'uploaded'));
      setUploadProgress({});
    }, 3000);
  };

  const uploadSingleFile = async (fileObj) => {
    const formData = new FormData();
    // field name MUST be "file" → matches upload.single("file") in backend
    formData.append('file', fileObj.file);
    // if you later add folder support to backend, you can send it too:
    formData.append('folder', fileObj.folder);

    try {
      // update status to uploading
      setFiles(prev =>
        prev.map(f =>
          f.id === fileObj.id ? { ...f, status: 'uploading' } : f
        )
      );

      const res = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(prev => ({
            ...prev,
            [fileObj.id]: percent,
          }));
        },
      });

      console.log('Upload success:', res.data);

      setFiles(prev =>
        prev.map(f =>
          f.id === fileObj.id
            ? { ...f, status: 'uploaded', progress: 100 }
            : f
        )
      );
    } catch (err) {
      console.error('Upload error:', err);
      setFiles(prev =>
        prev.map(f =>
          f.id === fileObj.id
            ? { ...f, status: 'error' }
            : f
        )
      );
      // optionally show some global error
      setUploadStatus('error');
    }
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const createNewFolder = () => {
    if (folderName.trim()) {
      const id = folderName.toLowerCase().replace(/\s+/g, '-');
      const newFolder = { id, name: folderName };
      setFolders(prev => [...prev, newFolder]);
      setSelectedFolder(id);
      setFolderName('');
    }
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

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1>Upload Documents</h1>
        <p>Upload PDF or TXT files (max 50MB each)</p>
      </div>

      <div className="upload-content">
        <div className="upload-card">


          <div 
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">📤</div>
            <h3>Drag & Drop Files Here</h3>
            <p>or click to browse files</p>
            <p className="upload-hint">Supported formats: PDF, TXT (max 50MB)</p>
            <input
              type="file"
              id="file-input"
              multiple
              accept=".pdf,.txt"
              onChange={handleFileInput}
              className="file-input"
            />
            <label htmlFor="file-input" className="browse-btn">
              Browse Files
            </label>
          </div>

          {files.length > 0 && (
            <>
              <div className="file-list">
                <h3>Selected Files ({files.length})</h3>
                <div className="file-list-content">
                  {files.map(file => (
                    <div key={file.id} className="file-item">
                      <div className="file-info">
                        <span className="file-icon">
                          {getFileIcon(file.type)}
                        </span>
                        <div>
                          <div className="file-name">{file.name}</div>
                          <div className="file-details">
                            <span className="file-size">{file.size}</span>
                            <span className="file-type">{file.type}</span>
                            <span className="file-folder">
                              📁 {folders.find(f => f.id === file.folder)?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="file-actions">
                        {file.status === 'uploading' && (
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${uploadProgress[file.id] || 0}%` }}
                            />
                          </div>
                        )}
                        
                        {file.status === 'uploaded' && (
                          <span className="status-badge success">✅ Uploaded</span>
                        )}
                        
                        {file.status === 'pending' && !uploadProgress[file.id] && (
                          <span className="status-badge pending">⏳ Pending</span>
                        )}

                        {file.status === 'error' && (
                          <span className="status-badge error">❌ Error</span>
                        )}
                        
                        <button 
                          className="remove-btn"
                          onClick={() => removeFile(file.id)}
                          title="Remove file"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="upload-actions">
                <button 
                  className="btn btn-primary upload-btn"
                  onClick={handleUpload}
                  disabled={uploadStatus === 'uploading' || files.length === 0}
                >
                  {uploadStatus === 'uploading' ? '📤 Uploading...' : '🚀 Start Upload'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setFiles([]);
                    setUploadProgress({});
                    setUploadStatus('');
                  }}
                >
                  Clear All
                </button>
              </div>
            </>
          )}

          {uploadStatus === 'completed' && (
            <div className="success-message">
              ✅ All files uploaded successfully!
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="error-message">
              ❌ One or more uploads failed. Check console for details.
            </div>
          )}
        </div>

        <div className="upload-tips">
          <h3>📌 Upload Tips</h3>
          <ul>
            <li>Organize files into folders for better management</li>
            <li>Use descriptive filenames for easier searching</li>
            <li>PDF files provide the best text extraction results</li>
            <li>Text files (.txt) are processed fastest</li>
            <li>You can upload multiple files at once</li>
            <li>Processing time depends on file size and type</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Upload;
