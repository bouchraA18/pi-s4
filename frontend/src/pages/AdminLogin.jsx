import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        username: email, // Django uses 'username' not 'email' by default
        password: password,
      });

      const token = response.data.access;
      localStorage.setItem('admin_token', token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid credentials or server error.');
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Background Shapes */}
      <div style={{ ...styles.shape, ...styles.shape1 }} />
      <div style={{ ...styles.shape, ...styles.shape2 }} />

      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Log In
          </button>
        </form>
      </div>

      {/* Keyframe definitions for floating animation */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(10deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 53, 128, 0.4); }
            70% { box-shadow: 0 0 0 20px rgba(0, 53, 128, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 53, 128, 0); }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  pageContainer: {
    position: 'relative',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  shape: {
    position: 'absolute',
    opacity: 0.3,
    borderRadius: '50%',
    animation: 'float 8s ease-in-out infinite',
  },
  shape1: {
    width: '300px',
    height: '300px',
    top: '-100px',
    left: '-80px',
    background: 'rgba(0, 53, 128, 0.2)',
  },
  shape2: {
    width: '250px',
    height: '250px',
    bottom: '-80px',
    right: '-60px',
    background: 'rgba(0, 53, 128, 0.15)',
    animationDelay: '4s',
  },
  card: {
    position: 'relative',
    background: '#ffffff',
    padding: '3rem 3.5rem',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
    maxWidth: '500px',
    width: '100%',
    border: '1px solid #f0f0f0',
    zIndex: 1,
  },
  title: {
    textAlign: 'center',
    color: '#003580',
    marginBottom: '2rem',
    fontSize: '1.9rem',
    letterSpacing: '0.8px',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontWeight: 500,
    fontSize: '0.95rem',
    textAlign: 'center',
    animation: 'pulse 1.5s ease-out',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  input: {
    padding: '1rem 1.2rem',
    fontSize: '1.05rem',
    border: '1px solid #c4c4c4',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  button: {
    backgroundColor: '#003580',
    color: 'white',
    padding: '1rem',
    fontSize: '1.1rem',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background 0.3s, transform 0.2s',
  },
};

// Add focus and hover styles via a stylesheet injection
const focusHoverStyles = document.createElement('style');
focusHoverStyles.innerHTML = `
  /* input focus ring – lighter royal-blue */
  input:focus {
    border-color: #2F74D5;                 /* lighter than #003580   */
    box-shadow: 0 0 0 3px rgba(47,116,213,.25); /* subtler glow */
  }

  /* button states – gentle sky-blue */
  button:hover {
    background-color: #2A67C4;            /* lighter hover shade    */
    transform: translateY(-2px);
  }
  button:active {
    background-color: #2158AD;            /* slightly darker press  */
    transform: translateY(0);
  }
`;
document.head.appendChild(focusHoverStyles);

export default AdminLogin;
