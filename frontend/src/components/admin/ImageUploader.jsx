import React, { useState, useRef } from 'react';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaUpload, FaImage, FaTimes, FaCheck } from 'react-icons/fa';

const ImageUploader = ({ 
    name,
    value,
    onChange,
    isDarkMode,
    placeholder = "Upload an image or enter URL",
    accept = "image/*",
    maxSizeInMB = 5,
    label,
    helpText,
    showPreview = true,
    previewSize = { width: '100px', height: '100px' }
}) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Validate file size
        if (file.size > maxSizeInMB * 1024 * 1024) {
            setError(`File size must be less than ${maxSizeInMB}MB`);
            return;
        }

        setError('');
        setUploading(true);

        try {
            // Convert to base64 data URL for local storage
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                onChange({ target: { name, value: dataUrl } });
                setUploading(false);
            };
            reader.onerror = () => {
                setError('Failed to read file');
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('Failed to upload image');
            setUploading(false);
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleUrlChange = (e) => {
        onChange(e);
        setError('');
    };

    const clearImage = () => {
        onChange({ target: { name, value: '' } });
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isDataUrl = value && value.startsWith('data:');
    const isUrl = value && (value.startsWith('http') || value.startsWith('https'));

    const inputStyle = {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderColor: isDarkMode ? '#333333' : '#ced4da',
        color: isDarkMode ? '#ffffff' : '#212529',
    };

    const uploadAreaStyle = {
        border: `2px dashed ${dragOver ? '#007bff' : (isDarkMode ? '#555' : '#ccc')}`,
        borderRadius: '8px',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: dragOver 
            ? (isDarkMode ? 'rgba(0, 123, 255, 0.1)' : 'rgba(0, 123, 255, 0.05)')
            : (isDarkMode ? '#1a1a1a' : '#f8f9fa'),
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    };

    return (
        <div>
            {label && (
                <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                    {label}
                </Form.Label>
            )}
            
            {/* URL Input Field */}
            <div className="d-flex gap-2 align-items-end mb-3">
                <div className="flex-grow-1">
                    <Form.Control
                        type="url"
                        name={name}
                        value={isDataUrl ? '' : (value || '')}
                        onChange={handleUrlChange}
                        placeholder={placeholder}
                        style={inputStyle}
                        disabled={uploading}
                    />
                </div>
                {value && (
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={clearImage}
                        style={{ minWidth: '70px' }}
                        disabled={uploading}
                    >
                        <FaTimes className="me-1" /> Clear
                    </Button>
                )}
            </div>

            {/* Upload Area */}
            <div
                style={uploadAreaStyle}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                    disabled={uploading}
                />
                
                {uploading ? (
                    <div>
                        <Spinner animation="border" size="sm" className="mb-2" />
                        <p className="mb-0 text-muted">Processing image...</p>
                    </div>
                ) : (
                    <div>
                        <FaUpload size={24} className="mb-2 text-muted" />
                        <p className="mb-1 text-muted">
                            <strong>Click to upload</strong> or drag and drop
                        </p>
                        <p className="mb-0 small text-muted">
                            Supports JPG, PNG, SVG, WebP (max {maxSizeInMB}MB)
                        </p>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <Alert variant="danger" className="mt-2 py-2">
                    <small>{error}</small>
                </Alert>
            )}

            {/* Success Message for Data URLs */}
            {isDataUrl && (
                <Alert variant="success" className="mt-2 py-2">
                    <small>
                        <FaCheck className="me-1" />
                        Image uploaded and stored locally (no external URL needed)
                    </small>
                </Alert>
            )}

            {/* Preview */}
            {showPreview && value && (
                <div className="mt-3">
                    <div className="small text-muted mb-2">Preview:</div>
                    <div 
                        style={{
                            width: previewSize.width,
                            height: previewSize.height,
                            border: isDarkMode ? '2px solid #444' : '2px solid #ddd',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isDarkMode ? '#2d3748' : '#f8f9fa',
                            overflow: 'hidden'
                        }}
                    >
                        <img
                            src={value}
                            alt="Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                    {isDataUrl && (
                        <div className="small text-success mt-1">
                            ✅ Stored locally (no internet required)
                        </div>
                    )}
                    {isUrl && (
                        <div className="small text-info mt-1">
                            🌐 External URL (requires internet)
                        </div>
                    )}
                </div>
            )}

            {/* Help Text */}
            {helpText && (
                <Form.Text className="text-muted">
                    {helpText}
                </Form.Text>
            )}
        </div>
    );
};

export default ImageUploader; 