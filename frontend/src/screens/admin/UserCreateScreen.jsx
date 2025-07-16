import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form,
  Button,
  Card,
} from 'react-bootstrap';
import FormContainer from '../../components/FormContainer';
import { FaUserShield, FaArrowLeft } from 'react-icons/fa';
import { useRegisterMutation } from '../../slices/usersApiSlice';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';

const UserCreateScreen = () => {
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(true); // Default to true for admin creation

  // Theme detection
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Colors for styling
  const colors = {
    background: isDarkMode ? '#1a2234' : '#f8fafc',
    cardBg: isDarkMode ? '#242e42' : '#ffffff',
    text: isDarkMode ? '#e2e8f0' : '#1e293b',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    shadow: isDarkMode
      ? '0 4px 15px rgba(0, 0, 0, 0.6)'
      : '0 2px 10px rgba(0, 0, 0, 0.1)',
    accent: '#6e44b2',
  };

  // Use the register mutation with admin privileges
  const [register, { isLoading, error }] = useRegisterMutation();

  const submitHandler = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showErrorToast('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showErrorToast('Password must be at least 6 characters');
      return;
    }

    try {
      await register({
        name,
        email,
        password,
        isAdmin, // Send the admin status
      }).unwrap();
      
      showSuccessToast('Admin user created successfully');
      navigate('/admin/userlist');
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  return (
    <>
      <Link to='/admin/userlist' className='btn btn-light my-3'>
        <FaArrowLeft className="me-2" /> Back to User List
      </Link>
      
      <FormContainer>
        <h1 style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <FaUserShield style={{ color: '#6e44b2' }} />
          Create Admin User
        </h1>
        
        {error && <Message variant='danger'>{error?.data?.message || error.error}</Message>}
        
        <Card
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: colors.shadow,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Card.Body>
            <Form onSubmit={submitHandler}>
              <Form.Group className='my-2' controlId='name'>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type='text'
                  placeholder='Enter name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              </Form.Group>

              <Form.Group className='my-2' controlId='email'>
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type='email'
                  placeholder='Enter email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              </Form.Group>

              <Form.Group className='my-2' controlId='password'>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Enter password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                  style={{
                    backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                />
                <Form.Text className="text-muted">
                  Password must be at least 6 characters long
                </Form.Text>
              </Form.Group>

              <Form.Group className='my-2' controlId='confirmPassword'>
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Confirm password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              </Form.Group>

              <Form.Group className='my-2' controlId='isAdmin'>
                <Form.Check
                  type='checkbox'
                  label='Is Administrator'
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                <Form.Text className="text-muted">
                  Administrators have full access to manage products, collections, users, and orders.
                </Form.Text>
              </Form.Group>

              <Button
                type='submit'
                variant='primary'
                className='mt-3'
                disabled={isLoading}
                style={{
                  backgroundColor: colors.accent,
                  borderColor: colors.accent,
                  padding: '10px 15px',
                }}
              >
                {isLoading ? <Loader small /> : 'Create User'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </FormContainer>
    </>
  );
};

export default UserCreateScreen;