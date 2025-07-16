import { useState, useEffect } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('dark'); // Default is dark
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Get theme from localStorage when component mounts
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const buttonStyle = {
    background: theme === 'dark' 
      ? isHovered ? 'rgba(157, 113, 219, 0.2)' : 'rgba(99, 102, 241, 0.1)'
      : isHovered ? 'rgba(157, 113, 219, 0.1)' : 'rgba(99, 102, 241, 0.05)',
    color: theme === 'dark' ? '#9d71db' : '#6366F1',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: theme === 'dark' && isHovered ? '0 0 15px rgba(157, 113, 219, 0.3)' : 'none',
    transform: isHovered ? 'translateY(-2px)' : 'none',
  };

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={buttonStyle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? 
        <FaSun size={18} style={{ filter: 'drop-shadow(0 0 2px rgba(255, 196, 0, 0.5))' }} /> : 
        <FaMoon size={18} />
      }
    </button>
  );
};

export default ThemeToggle;