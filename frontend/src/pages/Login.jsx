import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; // ✅ NEW: import backend helper
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // ✅ REAL API CALL: POST /auth/login
      const res = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // Response contains: { message, token, user }
      const { token, user } = res.data;

      // Save token & user info
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', user.email);

      // Optionally remember email
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">📊</div>
          <h1>Welcome Back</h1>
          <p>Sign in to your DocIntel account</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

    

        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>

        {/* You can remove demo credentials now if you want,
            because login is real backend-based */}
        {/* <div className="demo-credentials">
          <p>Demo Credentials:</p>
          <p>Email: demo@example.com</p>
          <p>Password: password</p>
        </div> */}
      </div>

      <div className="login-sidebar">
        <div className="sidebar-content">
          <h2>DocIntel Features</h2>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">📄</span>
              <div>
                <h3>Document Intelligence</h3>
                <p>Upload and extract content from various document formats</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <div>
                <h3>AI-Powered Search</h3>
                <p>Ask questions and get intelligent answers from your documents</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <h3>Smart Analytics</h3>
                <p>Gain insights from your document library</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
