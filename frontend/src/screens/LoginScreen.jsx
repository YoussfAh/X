import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Alert, Card, InputGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/Loader';
import ThemeToggle from '../components/ThemeToggle';
import { FaLock, FaExclamationTriangle, FaEye, FaEyeSlash, FaShieldAlt, FaUserLock, FaEnvelope } from 'react-icons/fa';
import '../assets/styles/auth.css';

import { useLoginMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { toast } from 'react-toastify';
import { showErrorToast, showInfoToast } from '../utils/toastConfig';
import GoogleLoginButton from '../components/GoogleLoginButton';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [remainingAttempts, setRemainingAttempts] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [lockTimeRemaining, setLockTimeRemaining] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [emailValid, setEmailValid] = useState(true);
    const [hasLoginError, setHasLoginError] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [login, { isLoading, reset }] = useLoginMutation();

    const { userInfo } = useSelector((state) => state.auth);

    const { search, state } = useLocation();
    const sp = new URLSearchParams(search);
    const redirect = sp.get('redirect') || state?.from || '/home';

    // Check if we have saved email in local storage
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }

        if (userInfo) {
            navigate(redirect);
        }
    }, [navigate, redirect, userInfo]);

    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        
        // Clear errors when user starts typing again (unless it's a device lock)
        if (hasLoginError && !isLocked) {
            clearErrorState();
        }
        
        if (value) {
            setEmailValid(validateEmail(value));
        } else {
            setEmailValid(true); // Don't show error when empty
        }
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        
        // Clear errors when user starts typing again (unless it's a device lock)
        if (hasLoginError && !isLocked) {
            clearErrorState();
        }
    };

    const clearErrorState = () => {
        setErrorMessage('');
        setRemainingAttempts(null);
        setIsLocked(false);
        setLockTimeRemaining('');
        setHasLoginError(false);
        setEmailValid(true);
        // Reset the RTK Query mutation state to clear loading state
        reset();
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        // Validate email format
        if (!validateEmail(email)) {
            setEmailValid(false);
            showErrorToast('Please enter a valid email address');
            return;
        }

        if (!password) {
            showErrorToast('Please enter your password');
            return;
        }

        try {
            // Clear previous errors
            clearErrorState();

            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Get device ID from localStorage or generate a new one
            const deviceId = localStorage.getItem('deviceId') ||
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);

            // Store device ID if it's new
            if (!localStorage.getItem('deviceId')) {
                localStorage.setItem('deviceId', deviceId);
            }

            // Pass deviceId in the headers for the login request
            const res = await login({
                email,
                password
            }, {
                headers: {
                    'x-device-id': deviceId
                }
            }).unwrap();

            dispatch(setCredentials({ ...res }));
            navigate(redirect);
        } catch (err) {
            const message = err?.data?.message || err.error;

            // Only lock the form if the device is ACTUALLY locked (not just warning about future lock)
            // Look for specific phrases that indicate the device is currently locked
            if (message?.includes('device is temporarily locked') || 
                message?.includes('device has been locked') ||
                message?.includes('device is locked')) {
                setIsLocked(true);
                // Extract minutes from error message (if available)
                const minutesMatch = message.match(/(\d+) minute/);
                if (minutesMatch) {
                    setLockTimeRemaining(minutesMatch[1]);
                }
            } else {
                // For all other errors (including warnings about future locks), just set the error flag
                setHasLoginError(true);
                setIsLocked(false); // Explicitly ensure form is not locked
            }

            // Check for remaining attempts message
            const attemptsMatch = message?.match(/(\d+) attempt/);
            if (attemptsMatch) {
                setRemainingAttempts(attemptsMatch[1]);
            }

            setErrorMessage(message);
            showErrorToast(message);
        }
    };

    const handleForgotPassword = () => {
        if (!email || !validateEmail(email)) {
            showInfoToast('Please enter a valid email address first');
            return;
        }
        // This would normally navigate to a password reset page
        showInfoToast(`Password reset instructions would be sent to ${email}`);
    };

    return (
        <div className="auth-container fade-in">
            <Card className="auth-card">
                <ThemeToggle />
                <div className="auth-header">
                    <div className="auth-header-icon">
                        <FaUserLock size={30} />
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to continue your fitness journey</p>
                </div>

                <Card.Body className="auth-body">
                    {errorMessage && (
                        <Alert variant={isLocked ? 'danger' : 'warning'} className="d-flex align-items-center">
                            <FaExclamationTriangle className="me-2" />
                            <div className="flex-grow-1">{errorMessage}</div>
                            {hasLoginError && !isLocked && (
                                <Button 
                                    variant="outline-warning" 
                                    size="sm" 
                                    onClick={clearErrorState}
                                    className="ms-2"
                                >
                                    Try Again
                                </Button>
                            )}
                        </Alert>
                    )}

                    <Form onSubmit={submitHandler} className="auth-form" noValidate>
                        <Form.Group className='mb-4' controlId='email'>
                            <Form.Label>
                                <FaEnvelope className="me-2" /> Email Address
                            </Form.Label>
                            <Form.Control
                                type='email'
                                placeholder='Enter your email'
                                value={email}
                                onChange={handleEmailChange}
                                isInvalid={!emailValid}
                                disabled={false}
                                required
                                className="py-2"
                                autoComplete="email"
                            />
                            {!emailValid && (
                                <Form.Control.Feedback type="invalid">
                                    Please enter a valid email address
                                </Form.Control.Feedback>
                            )}
                        </Form.Group>

                        <Form.Group className='mb-4' controlId='password'>
                            <div className="d-flex justify-content-between align-items-center">
                                <Form.Label className="mb-0">
                                    <FaLock className="me-2" /> Password
                                </Form.Label>
                                <span
                                    className="auth-link"
                                    style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                                    onClick={handleForgotPassword}
                                >
                                    Forgot Password?
                                </span>
                            </div>
                            <InputGroup className="mt-2">
                                <Form.Control
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder='Enter your password'
                                    value={password}
                                    onChange={handlePasswordChange}
                                    disabled={false}
                                    required
                                    className="py-2"
                                    autoComplete="current-password"
                                />
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    disabled={false}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </Button>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Check
                                type="checkbox"
                                id="rememberMe"
                                label="Remember my email"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={false}
                            />
                        </Form.Group>

                        {remainingAttempts && !isLocked && (
                            <Alert variant="warning" className="py-2 mb-4">
                                <div className="d-flex align-items-center">
                                    <FaShieldAlt className="me-2" />
                                    <small>
                                        <strong>Security notice:</strong> After 25 failed login attempts, this device will be temporarily locked for 5 minutes.
                                        <br />
                                        <strong>Remaining attempts:</strong> {remainingAttempts}
                                    </small>
                                </div>
                            </Alert>
                        )}

                        {isLocked && lockTimeRemaining && (
                            <Alert variant="danger" className="py-2 mb-4">
                                <div className="d-flex align-items-center">
                                    <FaShieldAlt className="me-2" />
                                    <small>
                                        <strong>Device locked:</strong> Please wait {lockTimeRemaining} minutes before trying again, or refresh the page.
                                    </small>
                                </div>
                            </Alert>
                        )}

                        <Button
                            disabled={isLoading}
                            type='submit'
                            className='w-100 py-2'
                            size="lg"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>

                        {hasLoginError && !isLocked && (
                            <Button
                                variant="outline-primary"
                                onClick={clearErrorState}
                                className="w-100 py-2 mt-2"
                                size="lg"
                            >
                                Clear Form & Try Again
                            </Button>
                        )}
                    </Form>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <div className="mb-4">
                        <GoogleLoginButton 
                            redirect={redirect}
                            disabled={isLocked}
                        />
                    </div>

                    <div className="text-center">
                        <p className="mb-0">Don't have an account?</p>
                        <Link to={redirect ? `/register?redirect=${redirect}` : '/register'} className="auth-link">
                            Create a new account
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default LoginScreen;
