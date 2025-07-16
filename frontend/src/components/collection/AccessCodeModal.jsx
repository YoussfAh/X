import React, { useState, useCallback, useMemo } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { FaKey, FaSpinner } from 'react-icons/fa';
import { useValidateOneTimeCodeMutation } from '../../slices/oneTimeCodesApiSlice';
import { errorToast, successToast } from '../../utils/toastConfig';

const AccessCodeModal = ({ show, onHide, collectionId, onAccessGranted, isDarkMode, themeColors }) => {
  const [accessCode, setAccessCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validateOneTimeCode, { isLoading }] = useValidateOneTimeCodeMutation();

  const handleCodeSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const result = await validateOneTimeCode({
        code: accessCode,
        collectionId,
      }).unwrap();

      if (result.success) {
        successToast('Access granted successfully!');
        onAccessGranted();
      }
    } catch (err) {
      setErrorMessage(err?.data?.message || 'Invalid access code. Please try again.');
      errorToast(err?.data?.message || 'Invalid access code');
    }
  }, [accessCode, collectionId, onAccessGranted, validateOneTimeCode]);

  const modalStyle = useMemo(() => ({
    position: 'fixed',
    top: '0',
    marginTop: '0'
  }), []);

  const modalHeaderStyle = useMemo(() => ({
    background: isDarkMode ? themeColors.dark.modalBackground : themeColors.light.modalBackground,
    borderBottom: isDarkMode ? `1px solid ${themeColors.dark.border}` : `1px solid ${themeColors.light.border}`,
    padding: '1rem 1.5rem',
  }), [isDarkMode, themeColors]);

  const modalTitleIconStyle = useMemo(() => ({
    background: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(139, 92, 246, 0.25)' : 'none'
  }), [isDarkMode]);

  const modalBodyStyle = useMemo(() => ({
    background: isDarkMode ? themeColors.dark.modalBody : themeColors.light.modalBody,
    padding: '2rem 1.5rem',
  }), [isDarkMode, themeColors]);
  
  const formControlStyle = useMemo(() => ({
    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#ced4da',
    color: isDarkMode ? '#fff' : '#000',
  }), [isDarkMode]);

  const buttonStyle = useMemo(() => ({
    background: themeColors.accentColor,
    border: 'none',
    fontWeight: '600',
    padding: '12px 0',
    boxShadow: `0 4px 15px rgba(139, 92, 246, 0.3)`,
  }), [themeColors.accentColor]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop='static'
      keyboard={false}
      contentClassName={isDarkMode ? 'bg-dark text-light' : ''}
      size="md"
      dialogClassName="modal-dialog-top"
      style={modalStyle}
    >
      <Modal.Header style={modalHeaderStyle}>
        <Modal.Title className='d-flex align-items-center' style={{ fontSize: '1.2rem' }}>
          <div style={modalTitleIconStyle}>
            <FaKey style={{ color: themeColors.accentColor }} />
          </div>
          Access Required
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={modalBodyStyle}>
        <p style={{ color: isDarkMode ? themeColors.dark.textSecondary : themeColors.light.textSecondary, marginBottom: '1.5rem' }}>
          This collection requires an access code to view its contents.
        </p>
        <Form onSubmit={handleCodeSubmit}>
          <Form.Group controlId='accessCode' className='mb-3'>
            <Form.Label style={{ fontWeight: '600' }}>Access Code</Form.Label>
            <Form.Control
              type='text'
              placeholder='Enter your code'
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
              autoFocus
              className={isDarkMode ? 'form-control-dark' : ''}
              style={formControlStyle}
            />
          </Form.Group>
          {errorMessage && <p className='text-danger mt-2'>{errorMessage}</p>}
          <Button
            type='submit'
            className='w-100 mt-3'
            disabled={isLoading}
            style={buttonStyle}
          >
            {isLoading ? <FaSpinner className='spinner' /> : 'Unlock Collection'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default React.memo(AccessCodeModal); 