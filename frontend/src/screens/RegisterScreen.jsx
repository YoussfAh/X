import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Card, Alert, InputGroup, ProgressBar } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Loader from '../components/Loader';
import ThemeToggle from '../components/ThemeToggle';
import { useRegisterMutation } from '../slices/usersApiSlice';

import { setCredentials } from '../slices/authSlice';
import { showErrorToast } from '../utils/toastConfig';
import { 
    FaUserPlus, 
    FaShieldAlt, 
    FaExclamationTriangle, 
    FaEye, 
    FaEyeSlash, 
    FaCheck, 
    FaTimes,
    FaEnvelope,
    FaUser,
    FaPhone,
    FaLock,
    FaDumbbell,
    FaBullseye,
    FaArrowRight,
    FaArrowLeft
} from 'react-icons/fa';
import '../assets/styles/auth.css';

const RegisterScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [emailValid, setEmailValid] = useState(true);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState({
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false
    });

    // Fitness profile fields
    const [age, setAge] = useState('');
    const [fitnessGoal, setFitnessGoal] = useState('');
    const [injuries, setInjuries] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [whatsAppPhoneNumber, setWhatsAppPhoneNumber] = useState('');
    const [phoneValid, setPhoneValid] = useState(true);
    
    // For visual step tracking
    const [activeStep, setActiveStep] = useState(1);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [register, { isLoading }] = useRegisterMutation();
    
    const { userInfo } = useSelector((state) => state.auth);

    const { search } = useLocation();
    const sp = new URLSearchParams(search);
    const redirect = sp.get('redirect') || '/home';

    useEffect(() => {
        // This effect handles the redirection logic after a user logs in or registers.
        if (userInfo) {
            navigate(redirect);
        }
    }, [navigate, redirect, userInfo]);

    // Password validation
    useEffect(() => {
        // Check different password criteria - Removed special character requirement
        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        // Removed special character check

        // Update feedback object
        const feedback = {
            hasMinLength,
            hasUppercase,
            hasLowercase,
            hasNumber,
            // Removed special character property
        };
        setPasswordFeedback(feedback);

        // Calculate strength (0-100) - now out of 4 criteria instead of 5
        const metCriteria = Object.values(feedback).filter(Boolean).length;
        setPasswordStrength(metCriteria * 25); // Adjusted to 25 points per criteria (4 criteria total)
    }, [password]);

    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePhone = (phone) => {
        // Allow empty phone as it's optional
        if (!phone) return true;
        
        // Simple phone validation - allow any phone with at least 7 digits
        // No country code required
        const phoneRegex = /^\d{7,15}$/;
        return phoneRegex.test(phone.replace(/\D/g, '')); // Remove any non-digit characters before validation
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        if (value) {
            setEmailValid(validateEmail(value));
        } else {
            setEmailValid(true); // Don't show error when empty
        }
    };

    const handlePhoneChange = (value) => {
        setWhatsAppPhoneNumber(value);
        if (value) {
            setPhoneValid(validatePhone(value));
        } else {
            setPhoneValid(true); // Don't show error when empty
        }
    };

    const getPasswordStrengthVariant = () => {
        if (passwordStrength <= 25) return 'danger';
        if (passwordStrength <= 50) return 'warning';
        if (passwordStrength <= 75) return 'info';
        return 'success';
    };
    
    const goToNextStep = () => {
        if (activeStep === 1) {
            // Validate first step
            if (!name) {
                showErrorToast('Please enter your name');
                return;
            }
            if (!validateEmail(email)) {
                setEmailValid(false);
                showErrorToast('Please enter a valid email address');
                return;
            }
            if (passwordStrength < 50) {
                showErrorToast('Please create a stronger password');
                return;
            }
            if (password !== confirmPassword) {
                showErrorToast('Passwords do not match');
                return;
            }
        }
        
        setActiveStep(2);
    };
    
    const goToPrevStep = () => {
        setActiveStep(1);
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        // Reset error states
        setErrorMessage('');
        setIsRateLimited(false);

        // Validate email
        if (!validateEmail(email)) {
            setEmailValid(false);
            showErrorToast('Please enter a valid email address');
            return;
        }

        // Validate password strength
        if (passwordStrength < 50) {
            setErrorMessage('Please create a stronger password');
            showErrorToast('Your password is too weak. Please follow the password requirements.');
            return;
        }

        if (password !== confirmPassword) {
            showErrorToast('Passwords do not match');
            setErrorMessage('Passwords do not match');
            return;
        }

        // Validate phone number if provided
        if (whatsAppPhoneNumber && !validatePhone(whatsAppPhoneNumber)) {
            setPhoneValid(false);
            showErrorToast('Please enter a valid phone number (numbers only)');
            return;
        }

        try {
            const res = await register({
                name,
                email,
                password,
                age: age ? Number(age) : null,
                fitnessGoal,
                injuries,
                additionalInfo,
                whatsAppPhoneNumber
            }).unwrap();
            dispatch(setCredentials({ ...res }));
            // The useEffect above will now handle the redirection.
        } catch (err) {
            const message = err?.data?.message || err.error;
            
            // Check if the error is rate limiting related
            if (message?.includes('Too many accounts') || 
                err.status === 429 || 
                message?.includes('try again later')) {
                setIsRateLimited(true);
            }
            
            setErrorMessage(message);
            showErrorToast(message);
        }
    };

    return (
        <div className="auth-container fade-in">
            <Card className="auth-card">
                <ThemeToggle />
                <div className="auth-header">
                    <div className="auth-header-icon">
                        <FaUserPlus size={30} />
                    </div>
                    <h1>Join Us Today</h1>
                    <p>Create an account to start your fitness journey</p>
                </div>
                
                <Card.Body className="auth-body">
                    {errorMessage && (
                        <Alert variant={isRateLimited ? 'danger' : 'warning'} className="d-flex align-items-center mb-4">
                            <FaExclamationTriangle className="me-2" />
                            <div>{errorMessage}</div>
                        </Alert>
                    )}

                    <Form onSubmit={submitHandler} className="auth-form" noValidate>
                        {activeStep === 1 && (
                            <div className="account-info-step fade-in">
                                <h5 className="mb-4 d-flex align-items-center text-primary">
                                    <FaUser className="me-2" /> Account Information
                                </h5>
                                
                                <Form.Group className='mb-3' controlId='name'>
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type='text'
                                        placeholder='Enter your name'
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isRateLimited}
                                        required
                                        
                                    />
                                </Form.Group>

                                <Form.Group className='mb-3' controlId='email'>
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control
                                        type='email'
                                        placeholder='Enter your email'
                                        value={email}
                                        onChange={handleEmailChange}
                                        isInvalid={!emailValid}
                                        disabled={isRateLimited}
                                        required
                                        autoComplete="email"
                                    />
                                    {!emailValid && (
                                        <Form.Control.Feedback type="invalid">
                                            Please enter a valid email address
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>

                                <Form.Group className='mb-3' controlId='password'>
                                    <Form.Label>Create Password</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder='Create a password'
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isRateLimited}
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                        />
                                        <Button 
                                            variant="outline-secondary"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    </InputGroup>
                                    
                                    <div className="password-strength-meter">
                                        <small className="d-flex justify-content-between">
                                            <span>Password Strength:</span>
                                            <span className={`text-${getPasswordStrengthVariant()}`}>
                                                {passwordStrength <= 25 && 'Weak'}
                                                {passwordStrength > 25 && passwordStrength <= 50 && 'Fair'}
                                                {passwordStrength > 50 && passwordStrength <= 75 && 'Good'}
                                                {passwordStrength > 75 && 'Strong'}
                                            </span>
                                        </small>
                                        <ProgressBar 
                                            now={passwordStrength} 
                                            variant={getPasswordStrengthVariant()} 
                                            className="mt-1 mb-2"
                                            style={{ height: '6px' }}
                                        />
                                    </div>
                                    
                                    <div className="mt-2 password-requirements">
                                        <small className={`d-block ${passwordFeedback.hasMinLength ? 'text-success' : 'text-muted'}`}>
                                            {passwordFeedback.hasMinLength ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                                            At least 8 characters long
                                        </small>
                                        <small className={`d-block ${passwordFeedback.hasUppercase ? 'text-success' : 'text-muted'}`}>
                                            {passwordFeedback.hasUppercase ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                                            Contains uppercase letter
                                        </small>
                                        <small className={`d-block ${passwordFeedback.hasLowercase ? 'text-success' : 'text-muted'}`}>
                                            {passwordFeedback.hasLowercase ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                                            Contains lowercase letter
                                        </small>
                                        <small className={`d-block ${passwordFeedback.hasNumber ? 'text-success' : 'text-muted'}`}>
                                            {passwordFeedback.hasNumber ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                                            Contains number
                                        </small>
                                    </div>
                                </Form.Group>

                                <Form.Group className='mb-4' controlId='confirmPassword'>
                                    <Form.Label>Confirm Password</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder='Confirm your password'
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={isRateLimited}
                                            required
                                            autoComplete="new-password"
                                            isValid={password && confirmPassword && password === confirmPassword}
                                            isInvalid={password && confirmPassword && password !== confirmPassword}
                                        />
                                        <Button 
                                            variant="outline-secondary"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    </InputGroup>
                                    {password && confirmPassword && (
                                        <Form.Control.Feedback type={password === confirmPassword ? "valid" : "invalid"}>
                                            {password === confirmPassword ? 
                                                'Passwords match' : 
                                                'Passwords don\'t match'}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                                
                                <Button 
                                    onClick={goToNextStep}
                                    className='w-100 py-3 mb-2'
                                    disabled={isRateLimited}
                                >
                                    Continue <FaArrowRight className="ms-1" />
                                </Button>
                                
                                <div className="text-center mt-3">
                                    <p className="mb-1 text-muted">Optional: Fill out your fitness profile in the next step</p>
                                </div>
                            </div>
                        )}

                        {activeStep === 2 && (
                            <div className="fitness-profile-step fade-in">
                                <h5 className="mb-4 d-flex align-items-center text-primary">
                                    <FaDumbbell className="me-2" /> Fitness Profile <span className="text-muted ms-2" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>(Optional)</span>
                                </h5>
                                
                                <Row className="mb-3">
                                    <Col xs={6}>
                                        <Form.Group controlId='age'>
                                            <Form.Label>Age</Form.Label>
                                            <Form.Control
                                                type='number'
                                                placeholder='Your age'
                                                value={age}
                                                onChange={(e) => setAge(e.target.value)}
                                                disabled={isRateLimited}
                                                min="13"
                                                max="120"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Group controlId='whatsAppPhoneNumber'>
                                            <Form.Label className="d-flex align-items-center">
                                                <FaPhone className="me-1" /> Phone Number
                                            </Form.Label>
                                            <PhoneInput
                                                placeholder="Enter phone number"
                                                value={whatsAppPhoneNumber}
                                                onChange={handlePhoneChange}
                                                disabled={isRateLimited}
                                                international
                                                defaultCountry="EG"
                                                className={`form-control ${!phoneValid ? 'is-invalid' : ''}`}
                                            />
                                            <Form.Text className="text-muted">
                                                For WhatsApp. For Egyptian numbers, select +20 and enter without the leading 0.
                                            </Form.Text>
                                            {!phoneValid && (
                                                <Form.Control.Feedback type="invalid">
                                                    Please enter a valid phone number
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className='mb-3' controlId='fitnessGoal'>
                                    <Form.Label className="d-flex align-items-center">
                                        <FaBullseye className="me-1" /> Fitness Goal
                                    </Form.Label>
                                    <Form.Select
                                        value={fitnessGoal}
                                        onChange={(e) => setFitnessGoal(e.target.value)}
                                        disabled={isRateLimited}
                                    >
                                        <option value=''>Select your goal</option>
                                        <option value='gain weight'>Gain Weight</option>
                                        <option value='lose weight'>Lose Weight</option>
                                        <option value='build muscle'>Build Muscle</option>
                                        <option value='get lean'>Get Lean</option>
                                        <option value='maintain'>Maintain</option>
                                        <option value='other'>Other</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className='mb-3' controlId='injuries'>
                                    <Form.Label>Injuries/Limitations</Form.Label>
                                    <Form.Control
                                        as='textarea'
                                        rows={2}
                                        placeholder='Any injuries or limitations we should know about?'
                                        value={injuries}
                                        onChange={(e) => setInjuries(e.target.value)}
                                        disabled={isRateLimited}
                                        maxLength={300}
                                    />
                                </Form.Group>

                                <Form.Group className='mb-4' controlId='additionalInfo'>
                                    <Form.Label>Additional Information</Form.Label>
                                    <Form.Control
                                        as='textarea'
                                        rows={2}
                                        placeholder='Any other information you want to share'
                                        value={additionalInfo}
                                        onChange={(e) => setAdditionalInfo(e.target.value)}
                                        disabled={isRateLimited}
                                        maxLength={300}
                                    />
                                </Form.Group>
                                
                                <div className="d-flex">
                                    <Button 
                                        variant="outline-secondary"
                                        onClick={goToPrevStep}
                                        className="me-2 px-4"
                                        disabled={isRateLimited || isLoading}
                                    >
                                        <FaArrowLeft className="me-1" /> Back
                                    </Button>
                                    <Button 
                                        type="submit"
                                        className="flex-grow-1 py-3"
                                        disabled={isRateLimited || isLoading}
                                    >
                                        {isLoading ? 'Creating Account...' : 'Create Account'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                    
                    <div className="auth-divider mt-4">
                        <span>OR</span>
                    </div>
                    
                    <div className="text-center">
                        <p className="mb-0">Already have an account?</p>
                        <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="auth-link">
                            Sign in
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default RegisterScreen;
