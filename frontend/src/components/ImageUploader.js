import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';

const ImageUploader = ({ onImageUploaded, initialImage }) => {
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialImage || '');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleSecureUpload(file);
        }
    }, []);

    // Compress image before upload
    const compressImage = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxWidth = 1920;
                    const maxHeight = 1080;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        }));
                    }, 'image/jpeg', 0.8);
                };
            };
        });
    };

    const handleSecureUpload = async (file) => {
        try {
            setUploading(true);
            setError('');
            setProgress(0);

            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                throw new Error('Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.');
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size too large. Maximum size is 10MB.');
            }

            // Compress image if needed
            const compressedFile = await compressImage(file);

            // Get signature from backend
            const signatureResponse = await axios.get('/api/upload/signature');
            const { signature, timestamp, cloudName, apiKey } = signatureResponse.data;

            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('signature', signature);
            formData.append('timestamp', timestamp);
            formData.append('api_key', apiKey);
            formData.append('folder', 'app-uploads');

            // Upload to Cloudinary with progress tracking
            const uploadResponse = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    },
                }
            );

            const url = uploadResponse.data.secure_url;
            setImageUrl(url);

            // Notify backend
            await axios.post('/api/upload/complete', {
                imageUrl: url,
                publicId: uploadResponse.data.public_id
            });

            if (onImageUploaded) {
                onImageUploaded(url);
            }

            setProgress(100);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            handleSecureUpload(file);
        }
    };

    return (
        <div
            className={`image-uploader ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <div className="upload-container">
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    disabled={uploading}
                    className="file-input"
                    id="file-input"
                />

                {imageUrl ? (
                    <div className="preview-container">
                        <img src={imageUrl} alt="Preview" className="preview-image" />
                        <button
                            onClick={() => document.getElementById('file-input').click()}
                            disabled={uploading}
                            className="change-image-button"
                        >
                            Change Image
                        </button>
                    </div>
                ) : (
                    <div className="upload-area">
                        <i className="fas fa-cloud-upload-alt upload-icon"></i>
                        <p className="upload-text">
                            Drag & drop an image here or
                            <button
                                onClick={() => document.getElementById('file-input').click()}
                                disabled={uploading}
                                className="browse-button"
                            >
                                Browse
                            </button>
                        </p>
                        <p className="upload-hint">
                            Supported formats: JPG, PNG, GIF, WEBP • Max size: 10MB
                        </p>
                    </div>
                )}
            </div>

            {uploading && (
                <div className="upload-progress">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Uploading... {progress}%</span>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                </div>
            )}

            <style jsx>{`
                .image-uploader {
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    transition: all 0.3s ease;
                    background: #fff;
                }

                .drag-active {
                    border-color: #0078FF;
                    background: rgba(0, 120, 255, 0.05);
                }

                .upload-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                }

                .file-input {
                    display: none;
                }

                .upload-area {
                    padding: 40px 20px;
                    width: 100%;
                }

                .upload-icon {
                    font-size: 48px;
                    color: #0078FF;
                    margin-bottom: 15px;
                }

                .upload-text {
                    margin: 10px 0;
                    color: #666;
                }

                .upload-hint {
                    font-size: 0.875rem;
                    color: #888;
                    margin: 5px 0 0;
                }

                .browse-button {
                    background: none;
                    border: none;
                    color: #0078FF;
                    cursor: pointer;
                    padding: 0 5px;
                    text-decoration: underline;
                }

                .browse-button:disabled {
                    color: #ccc;
                    cursor: not-allowed;
                }

                .preview-container {
                    position: relative;
                    max-width: 300px;
                    width: 100%;
                }

                .preview-image {
                    width: 100%;
                    height: auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .change-image-button {
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.7);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    opacity: 0;
                }

                .preview-container:hover .change-image-button {
                    opacity: 1;
                }

                .upload-progress {
                    margin-top: 15px;
                    text-align: center;
                }

                .progress-bar {
                    height: 4px;
                    background: #eee;
                    border-radius: 2px;
                    margin-top: 10px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: #0078FF;
                    transition: width 0.3s ease;
                }

                .error-message {
                    margin-top: 15px;
                    padding: 10px;
                    background: #fff2f2;
                    color: #d63031;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                }
            `}</style>
        </div>
    );
};

export default ImageUploader; 