import { Close, CloudUpload, Description } from '@mui/icons-material';
import { useState } from 'react';
import './DocumentUpload.css';

function DocumentUpload() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState('');

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
    const validFiles = fileList.filter(file => {
      const isValidType = file.type === 'application/pdf' || file.type === 'text/plain';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    const newFiles = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleUpload = async () => {
    setUploadStatus('uploading');
    
    for (const fileObj of files.filter(f => f.status === 'pending')) {
      await simulateUpload(fileObj.id);
    }
    
    setUploadStatus('completed');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  const simulateUpload = (fileId) => {
    return new Promise(resolve => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
        
        if (progress >= 100) {
          clearInterval(interval);
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'uploaded', progress: 100 } : f
          ));
          resolve();
        }
      }, 200);
    });
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="document-upload">
      <h2>Upload Documents</h2>
      
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudUpload className="upload-icon" />
        <p>Drag & drop PDF or TXT files here</p>
        <p className="upload-hint">Maximum file size: 10MB</p>
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
        <div className="file-list">
          {files.map(file => (
            <div key={file.id} className="file-item">
              <div className="file-info">
                <Description className="file-icon" />
                <div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{file.size}</div>
                </div>
              </div>
              
              <div className="file-actions">
                {file.status === 'pending' && uploadProgress[file.id] > 0 && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${uploadProgress[file.id]}%` }}
                    />
                  </div>
                )}
                
                {file.status === 'uploaded' && (
                  <span className="status-badge success">Uploaded</span>
                )}
                
                <button 
                  className="remove-btn"
                  onClick={() => removeFile(file.id)}
                >
                  <Close />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="upload-actions">
          <button 
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploadStatus === 'uploading'}
          >
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload All'}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setFiles([])}
          >
            Clear All
          </button>
        </div>
      )}

      {uploadStatus === 'completed' && (
        <div className="success-message">
          All files uploaded successfully!
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;