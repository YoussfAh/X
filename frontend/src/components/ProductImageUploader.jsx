import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Spinner, Button, Modal } from 'react-bootstrap';
import {
  FaCloudUploadAlt,
  FaImage,
  FaExclamationTriangle,
  FaCrop,
  FaCheck,
  FaTimes,
  FaCamera,
} from 'react-icons/fa';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import './ReactCrop.css';
import './MobileCropModal.css';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ProductImageUploader = ({
  onImageUploaded,
  initialImage,
  label,
  enableCameraCapture = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(initialImage || '');
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const imgRef = useRef(null);

  // Image cropping states
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(1);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const previewCanvasRef = useRef(null);

  // Get Cloudinary configuration from environment variables with fallbacks
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dgqwtzgwo';
  const uploadPreset =
    process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'grindx-upload';

  // Detect theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Update preview URL if initialImage changes
  useEffect(() => {
    if (initialImage) {
      setPreviewUrl(initialImage);
    }
  }, [initialImage]);

  // Validate Cloudinary configuration
  useEffect(() => {
    if (!cloudName || !uploadPreset) {
      setError(
        'Missing Cloudinary configuration. Please check your environment variables.'
      );
      console.error(
        'Missing Cloudinary configuration. Please check your environment variables.'
      );
    }
  }, [cloudName, uploadPreset]);

  // Log component initialization for debugging
  useEffect(() => {
    console.log('ProductImageUploader component initialized');
    console.log('Using cloud name:', cloudName);
    console.log('Using upload preset:', uploadPreset);
  }, [cloudName, uploadPreset]);

  // When the user selects a file, open the cropping modal
  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '');
      setShowCropModal(true);
    });
    reader.readAsDataURL(file);
  };

  // Handle camera capture (only for enableCameraCapture prop)
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Handle camera file selection
  const onCameraFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '');
      setShowCropModal(true);
    });
    reader.readAsDataURL(file);
  };

  // When the image in the cropper loads
  const onImageLoad = useCallback(
    (img) => {
      imgRef.current = img;
      const { width, height } = img;

      // Set initial crop as centered square (1:1 aspect ratio)
      setCrop(centerAspectCrop(width, height, aspect));
    },
    [aspect]
  );

  // Generate a cropped canvas from the image
  const generateCroppedCanvas = useCallback(() => {
    if (!imgRef.current || !completedCrop || !previewCanvasRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    // Canvas size needs to be set to the exact pixel size of the cropped area
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas dimensions to match the cropped area
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    // Clear the canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cropped image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    return canvas;
  }, [completedCrop]);

  // Handle crop confirmation
  const handleCropConfirm = () => {
    const canvas = generateCroppedCanvas();
    if (!canvas) {
      setError('Failed to crop image. Please try again.');
      setShowCropModal(false);
      return;
    }

    // Convert canvas to blob and upload
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Failed to process cropped image. Please try again.');
          setShowCropModal(false);
          return;
        }

        // Create a file from the blob for upload
        const croppedFile = new File([blob], selectedFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        // Close modal and upload the cropped image
        setShowCropModal(false);
        uploadImage(croppedFile);
      },
      'image/jpeg',
      0.95
    );
  };

  // Upload the image (either cropped or original) to Cloudinary
  const uploadImage = (file) => {
    if (!file) return;

    setIsLoading(true);
    setError('');
    setProgress(0);

    console.log('Starting upload with cloud name:', cloudName);
    console.log('Upload preset:', uploadPreset);

    // Create FormData for the file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'grindx');

    // Track upload progress
    const xhr = new XMLHttpRequest();
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log('Uploading to:', uploadUrl);

    xhr.open('POST', uploadUrl);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progressValue = Math.round((event.loaded / event.total) * 100);
        setProgress(progressValue);
      }
    });

    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        if (response.secure_url) {
          setPreviewUrl(response.secure_url);
          onImageUploaded(response.secure_url);
          console.log('Upload success:', response);
          setProgress(0);
        } else {
          setError('Upload failed: No secure URL received');
          console.error('Upload failed:', response);
        }
      } else {
        let errorMessage = `Upload failed: Server returned ${xhr.status}`;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.error && errorResponse.error.message) {
            errorMessage += ` - ${errorResponse.error.message}`;
            console.error('Cloudinary error details:', errorResponse.error);
          }
        } catch (e) {
          console.error('Error parsing response:', xhr.responseText);
        }
        setError(errorMessage);
      }
      setIsLoading(false);
    };

    xhr.onerror = function () {
      setError(
        'Network error during upload. Please check your internet connection.'
      );
      console.error('Network error during upload');
      setIsLoading(false);
    };

    xhr.send(formData);
  };

  // Close the crop modal and reset states
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImgSrc('');
    setSelectedFile(null);
    setCrop(null);
    setCompletedCrop(null);
  };

  // AMOLED dark mode colors
  const cardBackground = isDarkMode ? '#000000' : '#ffffff';
  const borderColor = isDarkMode ? '#222222' : '#dddddd';
  const accentColor = '#9966FF';
  const textColor = isDarkMode ? '#E0E0E0' : '#333333';
  const secondaryTextColor = isDarkMode ? '#AAAAAA' : '#666666';
  const errorColor = isDarkMode ? '#ff6666' : '#dc3545';
  const modalBackground = isDarkMode ? '#121212' : '#ffffff';

  // Update image preview style to make it more visually appealing and mobile-friendly
  const imagePreviewStyle = {
    maxWidth: '100%',
    maxHeight: window.innerWidth < 768 ? '150px' : '200px', // Smaller on mobile
    borderRadius: '8px',
    display: 'block',
    margin: '0 auto',
    border: `1px solid ${borderColor}`,
    objectFit: 'contain',
    backgroundColor: isDarkMode ? '#111111' : '#f8f9fa',
    // Prevent image from being cut off on mobile
    width: 'auto',
    height: 'auto',
  };

  return (
    <>
      <div
        className='text-center rounded mt-3'
        style={{
          border: `2px dashed ${borderColor}`,
          backgroundColor: cardBackground,
          padding: '20px',
          borderRadius: '12px',
        }}
      >
        {previewUrl ? (
          <div className='mb-3'>
            <div
              className='image-preview'
              style={{
                position: 'relative',
                maxWidth: '100%',
                margin: '0 auto',
              }}
            >
              <img
                src={previewUrl}
                alt={label || 'Uploaded image'}
                style={imagePreviewStyle}
              />
              <button
                className='btn btn-sm position-absolute'
                style={{
                  top: '8px',
                  right: '8px',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
                  backgroundColor: isDarkMode ? '#333333' : '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                }}
                onClick={() => {
                  setPreviewUrl('');
                  onImageUploaded('');
                }}
                aria-label='Remove image'
              >
                &times;
              </button>
            </div>
            <button
              type='button'
              className='btn mt-3'
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: accentColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                boxShadow: '0 4px 8px rgba(153, 102, 255, 0.3)',
                cursor: 'pointer',
              }}
            >
              <FaCloudUploadAlt className='me-2' />
              Change Image
            </button>
          </div>
        ) : (
          <>
            <div
              className='mb-3'
              style={{
                width: '100%',
                maxWidth: '300px',
                height: '200px',
                margin: '0 auto',
                backgroundColor: isDarkMode ? '#111111' : '#f8f9fa',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                border: `1px solid ${borderColor}`,
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <FaImage
                size={48}
                color={isDarkMode ? '#444444' : '#cbd5e1'}
                style={{ marginBottom: '12px' }}
              />
              <p
                style={{
                  color: secondaryTextColor,
                  fontSize: '0.9rem',
                  margin: 0,
                }}
              >
                {enableCameraCapture
                  ? 'Click to upload or take a photo'
                  : 'Click to upload an image'}
              </p>
              <p
                style={{
                  color: secondaryTextColor,
                  fontSize: '0.8rem',
                  margin: '8px 0 0 0',
                }}
              >
                <FaCrop className='me-1' /> You'll be able to crop the image
                {enableCameraCapture && (
                  <>
                    <br />
                    <FaCamera className='me-1' /> Camera available for instant
                    capture
                  </>
                )}
              </p>
            </div>
            <div className='d-flex flex-column flex-sm-row gap-2 justify-content-center align-items-center'>
              <Button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  backgroundColor: accentColor,
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  color: '#ffffff',
                  boxShadow: '0 4px 8px rgba(153, 102, 255, 0.3)',
                  minWidth: enableCameraCapture ? '140px' : 'auto',
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      as='span'
                      animation='border'
                      size='sm'
                      role='status'
                      className='me-2'
                    />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt className='me-2' />
                    Upload Image
                  </>
                )}
              </Button>

              {/* Camera Capture Button - Only show if enableCameraCapture is true */}
              {enableCameraCapture && (
                <Button
                  onClick={handleCameraCapture}
                  style={{
                    backgroundColor: '#28a745',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    color: '#ffffff',
                    boxShadow: '0 4px 8px rgba(40, 167, 69, 0.3)',
                    minWidth: '140px',
                  }}
                  disabled={isLoading}
                >
                  <FaCamera className='me-2' />
                  Take Photo
                </Button>
              )}
            </div>
          </>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          style={{ display: 'none' }}
          onChange={onSelectFile}
        />

        {/* Camera input - Only if camera capture is enabled */}
        {enableCameraCapture && (
          <input
            ref={cameraInputRef}
            type='file'
            accept='image/*'
            capture='environment'
            style={{ display: 'none' }}
            onChange={onCameraFileSelect}
          />
        )}

        {/* Progress bar */}
        {progress > 0 && progress < 100 && (
          <div
            className='progress my-3'
            style={{
              height: '8px',
              borderRadius: '4px',
              backgroundColor: isDarkMode ? '#222222' : '#e9ecef',
            }}
          >
            <div
              className='progress-bar'
              role='progressbar'
              style={{
                width: `${progress}%`,
                backgroundColor: accentColor,
                borderRadius: '4px',
              }}
              aria-valuenow={progress}
              aria-valuemin='0'
              aria-valuemax='100'
            ></div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className='mt-3 p-3 text-center'
            style={{
              color: errorColor,
              fontSize: '0.9rem',
              backgroundColor: isDarkMode
                ? 'rgba(255, 0, 0, 0.1)'
                : 'rgba(255, 0, 0, 0.05)',
              borderRadius: '8px',
              border: `1px solid ${errorColor}`,
            }}
          >
            <FaExclamationTriangle className='me-2' /> {error}
            <div className='mt-2'>
              <Button
                variant='outline-danger'
                size='sm'
                onClick={() => fileInputRef.current?.click()}
                style={{
                  borderColor: errorColor,
                  color: errorColor,
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        <Form.Text
          style={{
            color: secondaryTextColor,
            display: 'block',
            fontSize: '0.85rem',
            marginTop: '15px',
          }}
        >
          For best results, use a square image • Max size: 10MB
          <br />
          Supported formats: JPG, PNG, WebP
          {enableCameraCapture && (
            <>
              <br />
              📱 <strong>Camera ready:</strong> Take photos directly for instant
              meal logging
            </>
          )}
        </Form.Text>
      </div>

      {/* Image Crop Modal - Mobile Optimized */}
      <Modal
        show={showCropModal}
        onHide={handleCropCancel}
        centered
        backdrop='static'
        size='lg'
        style={{ zIndex: 1050 }}
        className='mobile-crop-modal'
      >
        <Modal.Header
          style={{
            backgroundColor: isDarkMode ? '#222222' : '#f8f9fa',
            borderBottom: `1px solid ${borderColor}`,
            color: textColor,
            padding: '12px 16px',
          }}
        >
          <Modal.Title style={{ fontSize: '1.1rem', fontWeight: '600' }}>
            <FaCrop className='me-2' /> Crop Image
          </Modal.Title>
          <Button
            variant='link'
            onClick={handleCropCancel}
            style={{
              color: textColor,
              textDecoration: 'none',
              padding: '4px',
              marginRight: '-6px',
            }}
          >
            <FaTimes size={16} />
          </Button>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: modalBackground,
            color: textColor,
            padding: '16px',
          }}
        >
          {imgSrc && (
            <div className='text-center'>
              {/* Mobile-friendly crop area */}
              <div
                style={{
                  maxHeight:
                    window.innerHeight < 700
                      ? '45vh'
                      : window.innerWidth < 768
                      ? '50vh'
                      : '60vh',
                  overflow: 'hidden', // Changed from 'auto' to 'hidden'
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? '#000000' : '#f8f9fa',
                }}
              >
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  className='mx-auto'
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                >
                  <img
                    ref={imgRef}
                    alt='Crop me'
                    src={imgSrc}
                    style={{
                      maxWidth: '100%',
                      maxHeight:
                        window.innerHeight < 700
                          ? '45vh'
                          : window.innerWidth < 768
                          ? '50vh'
                          : '60vh',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                    onLoad={(e) => onImageLoad(e.currentTarget)}
                  />
                </ReactCrop>
              </div>

              {/* Compact aspect ratio selector */}
              <div className='d-flex align-items-center justify-content-center flex-wrap gap-2 mb-3'>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: secondaryTextColor,
                    minWidth: 'fit-content',
                  }}
                >
                  Aspect:
                </span>
                <Form.Select
                  size='sm'
                  value={aspect}
                  onChange={(e) => {
                    const newAspect = parseFloat(e.target.value);
                    setAspect(newAspect);

                    // Reset crop when aspect ratio changes
                    if (imgRef.current) {
                      const { width, height } = imgRef.current;
                      setCrop(centerAspectCrop(width, height, newAspect));
                    }
                  }}
                  style={{
                    width: 'auto',
                    maxWidth: '150px',
                    fontSize: '0.85rem',
                    backgroundColor: isDarkMode ? '#333333' : '#ffffff',
                    color: textColor,
                    borderColor: borderColor,
                  }}
                >
                  <option value={1}>Square</option>
                  <option value={16 / 9}>16:9</option>
                  <option value={4 / 3}>4:3</option>
                  <option value={3 / 4}>3:4</option>
                  <option value={0}>Free</option>
                </Form.Select>
              </div>

              {/* Action buttons - Mobile optimized */}
              <div className='d-flex gap-2 justify-content-center'>
                <Button
                  variant='secondary'
                  onClick={handleCropCancel}
                  style={{
                    backgroundColor: isDarkMode ? '#333333' : '#6c757d',
                    borderColor: isDarkMode ? '#444444' : '#6c757d',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                  }}
                >
                  <FaTimes className='me-1' />
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onClick={handleCropConfirm}
                  style={{
                    backgroundColor: accentColor,
                    borderColor: '#8855EE',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                  }}
                  disabled={!completedCrop?.width || !completedCrop?.height}
                >
                  <FaCheck className='me-1' />
                  Apply
                </Button>
              </div>

              <div style={{ position: 'absolute', left: '-9999px' }}>
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    width: completedCrop?.width ?? 0,
                    height: completedCrop?.height ?? 0,
                  }}
                />
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProductImageUploader;
