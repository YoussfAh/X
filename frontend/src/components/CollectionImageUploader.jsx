import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { FaCloudUploadAlt, FaImage } from 'react-icons/fa';

const CollectionImageUploader = ({ onImageUploaded, initialImage }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(initialImage || '');
    const [dragActive, setDragActive] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    // Add state for manual URL input
    const [manualUrl, setManualUrl] = useState('');
    const [localFile, setLocalFile] = useState(null);

    // Use useRef to store the widget reference
    const widgetRef = useRef(null);

    // Get Cloudinary configuration from environment variables
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    // Validate Cloudinary configuration
    useEffect(() => {
        if (!cloudName || !uploadPreset) {
            console.warn('Cloudinary not configured. Using fallback URL input method.');
        }
    }, [cloudName, uploadPreset]);

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

    const initializeCloudinaryWidget = useCallback(() => {
        if (typeof window.cloudinary !== 'undefined' && cloudName && uploadPreset) {
            const myWidget = window.cloudinary.createUploadWidget(
                {
                    cloudName: cloudName,
                    uploadPreset: uploadPreset,
                    maxFiles: 1,
                    sources: ['local', 'url', 'camera'],
                    maxImageFileSize: 10000000, // 10MB for uploads
                    folder: 'grindx-collections',
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                    cropping: true,
                    croppingAspectRatio: 16 / 9,
                    showSkipCropButton: true, // Allow users to skip cropping if desired
                    autoMinimize: true, // Auto minimize for speed
                    multiple: false,
                    singleUploadAutoClose: true, // Auto close after upload
                    queueViewPosition: 'bottom',
                    showAdvancedOptions: false,
                    showPoweredBy: false,
                    showCompletedButton: false, // Don't require extra click
                    styles: {
                        palette: {
                            window: isDarkMode ? '#1a1a1a' : '#FFFFFF',
                            windowBorder: isDarkMode ? '#333333' : '#90A0B3',
                            tabIcon: '#6e44b2',
                            menuIcons: isDarkMode ? '#CCCCCC' : '#5A616A',
                            textDark: isDarkMode ? '#FFFFFF' : '#000000',
                            textLight: '#FFFFFF',
                            link: '#6e44b2',
                            action: '#6e44b2',
                            inactiveTabIcon: isDarkMode ? '#AAAAAA' : '#0E2F5A',
                            error: '#F44235',
                            inProgress: '#6e44b2',
                            complete: '#20B832',
                            sourceBg: isDarkMode ? '#2a2a2a' : '#E4EBF1'
                        },
                        frame: {
                            background: 'rgba(0,0,0,0.8)'
                        },
                        fonts: {
                            default: null,
                            "'Source Sans Pro', Helvetica, sans-serif": {
                                url: 'https://fonts.googleapis.com/css?family=Source+Sans+Pro',
                                active: true
                            }
                        }
                    }
                },
                (error, result) => {
                    if (result && result.event === 'queues-start') {
                        setIsLoading(true);
                    }

                    if (result && result.event === 'upload-progress') {
                        setProgress(Math.round((result.data.loaded / result.data.total) * 100));
                    }

                    if (!error && result && result.event === 'success') {
                        console.log('Upload success:', result.info);
                        setPreviewUrl(result.info.secure_url);
                        onImageUploaded(result.info.secure_url);
                        setProgress(100);

                        // Force close the widget immediately after success
                        if (widgetRef.current) {
                            widgetRef.current.close({ quiet: true });

                            // Reset loading state
                            setTimeout(() => {
                                setIsLoading(false);
                                setProgress(0);
                            }, 500);
                        }
                    }

                    if (result && result.event === 'close') {
                        setIsLoading(false);
                    }

                    if (error) {
                        console.error('Upload error:', error);
                        showError(error.message || 'Upload failed. Please try again.');
                        setIsLoading(false);
                    }
                }
            );

            // Store widget reference in the ref
            widgetRef.current = myWidget;

            // Handle drag and drop
            const uploadArea = document.getElementById('collection-upload-area');

            if (uploadArea) {
                uploadArea.addEventListener('dragenter', handleDrag);
                uploadArea.addEventListener('dragleave', handleDrag);
                uploadArea.addEventListener('dragover', handleDrag);
                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                        if (widgetRef.current) {
                            widgetRef.current.open();
                        }
                    }
                });
            }

            const uploadButton = document.getElementById('collection_upload_widget');
            if (uploadButton) {
                uploadButton.addEventListener(
                    'click',
                    () => {
                        if (widgetRef.current) {
                            widgetRef.current.open();
                        }
                    },
                    false
                );
            }
        }
    }, [onImageUploaded, isDarkMode]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const showError = (message) => {
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mt-2 fade show';
        errorAlert.innerHTML = `
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        const uploadArea = document.getElementById('collection-upload-area');
        if (uploadArea) {
            uploadArea.appendChild(errorAlert);
            setTimeout(() => {
                errorAlert.classList.add('fade');
                setTimeout(() => errorAlert.remove(), 300);
            }, 5000);
        }
    };

    useEffect(() => {
        if (!document.getElementById('cloudinary-widget-script')) {
            const script = document.createElement('script');
            script.id = 'cloudinary-widget-script';
            script.src = 'https://upload-widget.cloudinary.com/global/all.js';
            script.async = true;
            script.onload = initializeCloudinaryWidget;
            document.body.appendChild(script);
        } else {
            initializeCloudinaryWidget();
        }

        // Cleanup event listeners on unmount
        return () => {
            const uploadArea = document.getElementById('collection-upload-area');
            if (uploadArea) {
                uploadArea.removeEventListener('dragenter', handleDrag);
                uploadArea.removeEventListener('dragleave', handleDrag);
                uploadArea.removeEventListener('dragover', handleDrag);
            }

            const uploadButton = document.getElementById('collection_upload_widget');
            if (uploadButton) {
                uploadButton.removeEventListener('click', () => { });
            }
        };
    }, [initializeCloudinaryWidget, handleDrag]);

    // Update preview URL if initialImage changes
    useEffect(() => {
        if (initialImage) {
            setPreviewUrl(initialImage);
        }
    }, [initialImage]);

    // Add file input ref
    const fileInputRef = useRef();

    // Handle manual URL input
    const handleManualUrlChange = (e) => {
        setManualUrl(e.target.value);
        setPreviewUrl(e.target.value);
        onImageUploaded(e.target.value);
    };

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLocalFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
                onImageUploaded(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const cardBackground = isDarkMode ? '#1a1a1a' : '#ffffff';
    const borderColor = isDarkMode ? '#333333' : '#dddddd';
    const accentColor = '#6e44b2';

    return (
        <div
            id="collection-upload-area"
            className={`text-center rounded ${dragActive ? 'drag-active' : ''}`}
            style={{
                border: `2px dashed ${dragActive ? accentColor : borderColor}`,
                backgroundColor: dragActive ? (isDarkMode ? '#2a2a2a' : '#f8f9fa') : cardBackground,
                transition: 'all 0.3s ease',
                marginTop: '10px',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: dragActive ? `0 0 10px rgba(110, 68, 178, 0.3)` : 'none'
            }}
        >
            {previewUrl ? (
                <div className="mb-4">
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '100%',
                            margin: '0 auto',
                            overflow: 'hidden',
                            borderRadius: '8px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                            aspectRatio: '16/9',
                            background: '#0d0d0d'
                        }}
                    >
                        <img
                            src={previewUrl}
                            alt="Collection Preview"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                transition: 'transform 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    </div>
                </div>
            ) : (
                <div className="mb-4"
                    style={{
                        aspectRatio: '16/9',
                        backgroundColor: isDarkMode ? '#0d0d0d' : '#f1f5f9',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        border: `1px solid ${borderColor}`
                    }}
                >
                    <FaImage size={48} color={isDarkMode ? '#333333' : '#cbd5e1'} style={{ marginBottom: '12px' }} />
                    <p style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.9rem', margin: 0 }}>
                        No image selected
                    </p>
                </div>
            )}

            {/* Upload button and file/url input */}
            {cloudName && uploadPreset ? (
                <button
                    id="collection_upload_widget"
                    className="btn mb-3"
                    type="button"
                    disabled={isLoading}
                    style={{
                        backgroundColor: accentColor,
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        color: 'white',
                        fontWeight: '500',
                        boxShadow: '0 4px 8px rgba(110, 68, 178, 0.3)'
                    }}
                    onClick={() => {
                        if (widgetRef.current) widgetRef.current.open();
                    }}
                >
                    {isLoading ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <FaCloudUploadAlt size={18} className="me-2" />
                            {previewUrl ? 'Change Image' : 'Upload Image'}
                        </>
                    )}
                </button>
            ) : (
                <>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <button
                        className="btn mb-3"
                        type="button"
                        style={{
                            backgroundColor: accentColor,
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            color: 'white',
                            fontWeight: '500',
                            boxShadow: '0 4px 8px rgba(110, 68, 178, 0.3)'
                        }}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                        <FaCloudUploadAlt size={18} className="me-2" />
                        {previewUrl ? 'Change Image' : 'Upload Image'}
                    </button>
                    <Form.Control
                        type="text"
                        placeholder="Or paste image URL here"
                        value={manualUrl}
                        onChange={handleManualUrlChange}
                        style={{ marginBottom: '10px', borderRadius: '6px' }}
                    />
                </>
            )}

            {progress > 0 && progress < 100 && (
                <div className="progress mb-3" style={{ height: '8px', borderRadius: '4px', backgroundColor: isDarkMode ? '#333333' : '#e9ecef' }}>
                    <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: accentColor,
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                        }}
                        aria-valuenow={progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                    ></div>
                </div>
            )}

            <Form.Text style={{ color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block', fontSize: '0.85rem' }}>
                Drag & drop an image here or click to upload<br />
                For best results, use a 16:9 ratio image • Max size: 10MB
            </Form.Text>
        </div>
    );
};

export default CollectionImageUploader; 