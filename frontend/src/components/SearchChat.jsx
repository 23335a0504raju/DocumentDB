import {
  ContentCopy,
  ExpandMore,
  Person,
  Send,
  SmartToy,
  ThumbDown,
  ThumbUp,
} from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import api from '../api';
import './SearchChat.css';

const initialMessages = [
  {
    id: 1,
    text: "Hello! I'm your AI assistant. Select a document (or all) and ask me anything about it.",
    sender: 'ai',
    timestamp: new Date().toISOString(),
  },
];

function SearchChat() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [references, setReferences] = useState([]);

  // 🔹 New: document selection state
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('all');
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState('');

  const chatEndRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    setMessages(initialMessages);
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🔹 Load user documents for dropdown
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setDocsLoading(true);
        setDocsError('');
        const res = await api.get('/documents/my'); // { documents: [...] }
        setDocuments(res.data.documents || []);
      } catch (err) {
        console.error('Failed to load documents for search:', err);
        setDocsError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            'Failed to load your documents.'
        );
      } finally {
        setDocsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userText = query;
    const userMessage = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);
    setReferences([]);

    try {
      // 🔗 Call backend RAG + OpenRouter
      //    Pass the selected documentId (or null for all docs)
      const res = await api.post('/rag/answer', {
        question: userText,
        documentId: selectedDocId === 'all' ? null : selectedDocId,
      });

      const aiText = res.data.answer || 'No answer generated.';
      const backendSources = res.data.sources || [];

      const aiMessage = {
        id: Date.now() + 1,
        text: aiText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // For the references panel
      const refs = backendSources.map((s) => ({
        document: s.documentName || 'Unknown document',
        excerpt:
          (s.text?.slice(0, 240) || '') +
          (s.text && s.text.length > 240 ? '...' : ''),
        page: null, // we still don’t have page info
      }));

      setReferences(refs);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Something went wrong while asking the AI.';

      const errorMessage = {
        id: Date.now() + 2,
        text: `⚠️ ${msg}`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleFeedback = (messageId, feedback) => {
    console.log(`Feedback ${feedback} for message ${messageId}`);
    // TODO: send feedback to backend if needed
  };

  const quickQuestions = [
    'What does this document say about experience?',
    'Summarize this document',
    'What skills are highlighted?',
    'What are the main strengths?',
  ];

  // Get label for currently selected doc
  const currentDocLabel =
    selectedDocId === 'all'
      ? 'All documents'
      : documents.find((d) => d._id === selectedDocId)?.originalName ||
        'Selected document';

  return (
    <div className="search-chat">
      <div className="chat-container">
        <div className="chat-header">
          <div>
            <h2>AI Document Search</h2>
            <p>Choose a document and ask questions about its content</p>
          </div>
        </div>

        {/* 🔹 Document selector */}
        <div className="doc-selector">
          <label htmlFor="docSelect">Search in:</label>
          {docsLoading ? (
            <span className="doc-loading">Loading documents...</span>
          ) : docsError ? (
            <span className="doc-error">⚠️ {docsError}</span>
          ) : (
            <select
              id="docSelect"
              className="doc-select"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
            >
              <option value="all">All my documents</option>
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.originalName || doc.storedFilename || 'Untitled'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="current-doc-label">
          🔍 Searching in: <strong>{currentDocLabel}</strong>
        </div>

        <div className="quick-questions">
          <p>Try asking:</p>
          <div className="question-chips">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                className="question-chip"
                onClick={() => setQuery(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.sender === 'user' ? 'user-message' : 'ai-message'
              }`}
            >
              <div className="message-avatar">
                {message.sender === 'user' ? <Person /> : <SmartToy />}
              </div>

              <div className="message-content">
                <div className="message-text">
                  {message.text.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                <div className="message-footer">
                  <span className="timestamp">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {message.sender === 'ai' && (
                    <div className="message-actions">
                      <button
                        className="action-btn"
                        onClick={() => handleCopy(message.text)}
                        title="Copy"
                      >
                        <ContentCopy />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleFeedback(message.id, 'like')}
                        title="Helpful"
                      >
                        <ThumbUp />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleFeedback(message.id, 'dislike')}
                        title="Not helpful"
                      >
                        <ThumbDown />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message ai-message">
              <div className="message-avatar">
                <SmartToy />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question here..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!query.trim() || isLoading}
          >
            <Send />
          </button>
        </form>
      </div>

      {references.length > 0 && (
        <div className="references-panel">
          <div className="references-header">
            <h3>Supporting References</h3>
            <button className="expand-btn">
              <ExpandMore />
            </button>
          </div>

          <div className="references-list">
            {references.map((ref, index) => (
              <div key={index} className="reference-item">
                <div className="reference-doc">
                  <strong>{ref.document}</strong>
                  {ref.page && (
                    <span className="page-number">Page {ref.page}</span>
                  )}
                </div>
                <p className="reference-excerpt">"{ref.excerpt}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchChat;
