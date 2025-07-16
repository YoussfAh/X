import React, { useState, useEffect } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const SearchBox = () => {
    const navigate = useNavigate();
    const { keyword: urlKeyword } = useParams();
    const { userInfo } = useSelector((state) => state.auth);

    // FIX: uncontrolled input - urlKeyword may be undefined
    const [keyword, setKeyword] = useState(urlKeyword || '');
    const [focused, setFocused] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    // Update theme state when document attribute changes
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const submitHandler = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            navigate(`/search/${keyword.trim()}`);
        } else {
            navigate('/');
        }
    };

    const clearSearch = () => {
        setKeyword('');
    };

    // AMOLED theme colors
    const primaryPurple = isDarkMode ? '#b388ff' : '#9d71db';
    const backgroundColor = isDarkMode ? '#121212' : '#f8f9fa';
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#ffffff' : '#333333';
    const placeholderColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

    const searchBoxStyle = {
        borderRadius: '30px',
        overflow: 'hidden',
        boxShadow: isDarkMode
            ? '0 2px 10px rgba(0, 0, 0, 0.3)'
            : '0 2px 5px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${borderColor}`,
        backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff',
    };

    const inputStyle = {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        color: textColor,
        border: 'none',
        padding: '0.6rem 1rem',
        fontSize: '0.95rem',
        borderRadius: '30px 0 0 30px',
    };

    const buttonStyle = {
        backgroundColor: primaryPurple,
        border: 'none',
        padding: '0.6rem 1rem',
        borderRadius: '0 30px 30px 0',
        transition: 'all 0.2s ease',
    };

    return (
        <Form onSubmit={submitHandler} className="d-flex align-items-center">
            <InputGroup style={searchBoxStyle}>
                <Form.Control
                    type='text'
                    name='q'
                    onChange={(e) => setKeyword(e.target.value)}
                    value={keyword}
                    placeholder={userInfo ? `Welcome, ${userInfo.name.split(' ')[0]}! Search for exercises...` : 'Search for exercises...'}
                    style={inputStyle}
                    className='search-input'
                />
                <button
                    type='submit'
                    variant='primary'
                    style={buttonStyle}
                    className='search-btn'
                >
                    <FaSearch />
                </button>
                {keyword && (
                    <div
                        style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: '5',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease',
                            boxShadow: isDarkMode ? '0 0 5px rgba(0, 0, 0, 0.2)' : 'none',
                        }}
                        onClick={clearSearch}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        }}
                    >
                        <FaTimes size={10} color={isDarkMode ? '#fff' : '#333'} />
                    </div>
                )}
            </InputGroup>
            <style jsx='true'>{`
                .search-input::placeholder {
                    color: ${placeholderColor};
                    opacity: 1;
                }
                .search-input:focus {
                    box-shadow: none;
                    background-color: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
                }
                .search-btn:hover {
                    background-color: ${isDarkMode ? '#9e74ff' : '#8a5cc7'};
                    transform: translateX(2px);
                }
            `}</style>
        </Form>
    );
};

export default SearchBox;
