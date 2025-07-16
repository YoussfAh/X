  import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Button, Row, Col, Modal, Image, Collapse, ProgressBar, Form, Badge } from 'react-bootstrap';
import { FaUpload, FaImage, FaTrash, FaCalendarAlt, FaTimes, FaChevronDown, FaChevronUp, FaCloudUploadAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig';
import Loader from './Loader';
import Message from './Message';
import { 
  useSaveProgressImagesMutation, 
  useGetProgressImagesQuery, 
  useDeleteProgressImageGroupMutation 
} from '../slices/progressImagesApiSlice';
import ImageCarouselModal from './ImageCarouselModal'; // Import the new modal
import '../assets/styles/ProgressImageSection.css';

const ProgressImageSection = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  
  // Add these states back
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);


  const fileInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get Cloudinary config from environment with fallbacks
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dgqwtzgwo';
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'grindx-upload';

  // Validate Cloudinary configuration
  useEffect(() => {
    if (!cloudName || !uploadPreset) {
      console.error('Missing Cloudinary configuration. Please check your environment variables.');
    }
  }, [cloudName, uploadPreset]);

  // Log component initialization for debugging
  useEffect(() => {
    console.log('ProgressImageSection component initialized');
    console.log('Using cloud name:', cloudName);
    console.log('Using upload preset:', uploadPreset);
  }, [cloudName, uploadPreset]);

  const [saveImages] = useSaveProgressImagesMutation();
  const { data: progressData, isLoading, error, refetch } = useGetProgressImagesQuery({ 
    page,
    limit: 9,
  });
  const [deleteGroup] = useDeleteProgressImageGroupMutation();

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );

    if (files.length === 0) {
      showErrorToast('Please drop only image files');
      return;
    }

    const remainingSlots = 10 - selectedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      showErrorToast(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} can be added`);
    }

    handleFileSelection(filesToAdd);
  }, [selectedFiles.length]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files).filter(
      file => file.type.startsWith('image/')
    );

    const remainingSlots = 10 - selectedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      showErrorToast(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} can be added`);
    }

    handleFileSelection(filesToAdd);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFiles.length]);

  const handleFileSelection = (files) => {
    // Validate file sizes
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showErrorToast(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [
      ...prev,
      ...validFiles.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) // Size in MB
      }))
    ]);

    // Initialize upload progress for new files
    const newProgress = {};
    validFiles.forEach(file => {
      newProgress[file.name] = 0;
    });
    setUploadProgress(prev => ({ ...prev, ...newProgress }));
  };

  const removeFile = (index) => {
    const fileName = selectedFiles[index]?.name;
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showErrorToast('Please select images to upload.');
      return;
    }
    if (!cloudName || !uploadPreset) {
      showErrorToast('Cloudinary configuration is missing. Upload failed.');
      console.error('Cloudinary config missing');
      return;
    }

    setIsUploading(true);
    console.log('Starting upload with cloud name:', cloudName);
    console.log('Upload preset:', uploadPreset);
    
    const uploadPromises = selectedFiles.map(file => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'progress-images'); // Add folder specification

        const xhr = new XMLHttpRequest();
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        console.log('Uploading to:', uploadUrl);
        
        xhr.open('POST', uploadUrl, true);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentCompleted = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(prev => ({ ...prev, [file.name]: percentCompleted }));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log('Upload success for file:', file.name, response);
            resolve({
              url: response.secure_url,
              thumbnail: response.eager?.[0]?.secure_url || response.secure_url,
              originalName: file.name,
              metadata: {
                width: response.width,
                height: response.height,
                size: response.bytes,
                format: response.format,
              }
            });
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
            reject(new Error(errorMessage));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload. Please check your internet connection.'));
        };

        xhr.send(formData);
      });
    });

    try {
      const uploadedImages = await Promise.all(uploadPromises);
      await saveImages({ images: uploadedImages }).unwrap();
      
      showSuccessToast('Images uploaded and saved successfully!');
      
      // Reset state and close modal
      setTimeout(() => {
        setSelectedFiles([]);
        setPreviewUrls([]);
        setUploadProgress({});
        setShowUploadModal(false);
        setIsUploading(false);
        refetch();
      }, 500);

    } catch (err) {
      console.error('Upload process failed:', err);
      showErrorToast(err.message || 'An error occurred during upload.');
      setIsUploading(false);
    }
  };

  const handleDelete = async (groupId) => {
    if (!groupId) {
      showErrorToast('Invalid image group. Cannot delete.');
      return;
    }
    
    try {
      const result = await deleteGroup(groupId).unwrap();
      showSuccessToast(result.message || 'Images deleted successfully');
      refetch(); // Refresh the list
    } catch (err) {
      console.error('Delete error:', err);
      showErrorToast(
        err?.data?.message || 
        err?.message || 
        'Failed to delete images. Please try again.'
      );
    }
  };

  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    setShowViewModal(true);
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setShowCarouselModal(true);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Clean up preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [previewUrls]);

  return (
    <>
      <Card className="mt-4 shadow-sm w-100">
        <Card.Header 
            className="d-flex justify-content-between align-items-center py-3"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ cursor: 'pointer' }}
        >
          <h5 className="mb-0">
            <FaImage className="me-2" /> Progress Images
          </h5>
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </Card.Header>
        <Collapse in={isExpanded}>
          <div>
            <Card.Body className="px-0 px-md-3">
              <Row className="mx-0 align-items-center">
                <Col>
                  <p className="mb-0" style={{ 
                    fontSize: '1.1rem',
                    // color: 'var(--bs-secondary)',
                    opacity: 0.95,
                    '@media (max-width: 576px)': {
                      fontSize: '1rem'
                    }
                  }}>
                    Track your transformation. Upload new progress photos here.
                  </p>
                </Col>
                <Col xs="auto">
                  <Button 
                    variant="primary" 
                    onClick={() => setShowUploadModal(true)}
                    size="sm"
                    className="d-flex align-items-center"
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.4rem 0.8rem',
                      '@media (max-width: 576px)': {
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.7rem'
                      }
                    }}
                  >
                    <FaUpload className="me-1" style={{ fontSize: '0.8em' }} /> 
                    <span>Upload Images</span>
                  </Button>
                </Col>
              </Row>
              <hr className="my-2" />
              {isLoading ? (
                <Loader />
              ) : error ? (
                <Message variant="danger">{error?.data?.message || error.error}</Message>
              ) : progressData && progressData.progressImages.length > 0 ? (
                <>
                  <Row xs={1} md={2} lg={3} xl={4} className="g-4 mx-0">
                    {progressData.progressImages.map(group => (
                      <Col key={group._id}>
                        <div className="position-relative progress-image-group-card shadow-sm">
                          <img 
                            src={group.images[0]?.thumbnail || group.images[0]?.url} 
                            alt={`Progress from ${format(new Date(group.uploadDate), 'PPP')}`}
                            className="img-fluid"
                            style={{ 
                              aspectRatio: '1 / 1', 
                              objectFit: 'cover',
                              borderRadius: '8px',
                              width: '100%',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleViewGroup(group)}
                          />
                          {/* Overlay icons */}
                          <div className="position-absolute top-0 end-0 m-2">
                            <Button
                              variant="danger"
                              size="sm"
                              className="rounded-circle p-1 d-flex align-items-center justify-content-center shadow"
                              style={{ 
                                width: '32px', 
                                height: '32px',
                                opacity: 0.9,
                                backgroundColor: '#dc3545',
                                border: 'none'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (window.confirm('Delete this image group?')) {
                                  handleDelete(group._id);
                                }
                              }}
                              title="Delete images"
                              aria-label="Delete image group"
                            >
                              <FaTrash size={14} color="#fff" />
                            </Button>
                          </div>
                          <div className="position-absolute bottom-0 start-0 m-2 bg-dark bg-opacity-75 text-white px-2 py-1 rounded-pill">
                            <FaCalendarAlt className="me-1" />
                            {format(new Date(group.uploadDate), 'MMM d, yyyy')}
                          </div>
                          {group.images.length > 1 && (
                            <div className="position-absolute bottom-0 end-0 m-2 bg-primary bg-opacity-75 text-white px-2 py-1 rounded-pill">
                              <FaImage className="me-1" />
                              {group.images.length}
                            </div>
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                </>
              ) : (
                <Message variant="info">No progress images found. Upload your first set!</Message>
              )}
            </Card.Body>
          </div>
        </Collapse>
      </Card>
      
      {/* Upload Modal */}
      <Modal 
        show={showUploadModal} 
        onHide={() => !isUploading && setShowUploadModal(false)} 
        centered 
        size="lg"
        className="progress-upload-modal"
      >
        <Modal.Header closeButton={!isUploading} className="border-bottom-0 pb-0">
          <Modal.Title className="text-primary">
            <FaUpload className="me-2" />
            Upload Progress Images
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            style={{
              border: '2px dashed #6c757d',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragging ? 'rgba(0,123,255,0.05)' : 'transparent',
              transition: 'all 0.3s ease'
            }}
          >
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }} 
            />
            <FaCloudUploadAlt size={50} className="mb-3 text-primary" />
            <p className="mb-1 fw-bold">Drag & drop images here, or click to select files</p>
            <p className="text-muted small"><em>(Max 10 images, 10MB each)</em></p>
          </div>

          {previewUrls.length > 0 && (
            <div className="mt-4">
              <h5 className="mb-3 border-bottom pb-2">Selected Images ({previewUrls.length}/10)</h5>
              <Row xs={2} sm={3} md={4} lg={5} className="g-3">
                {previewUrls.map((preview, index) => (
                  <Col key={index}>
                    <Card className="h-100 shadow-sm position-relative">
                      <div className="position-relative" style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                        <Image 
                          src={preview.url} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderTopLeftRadius: 'calc(0.375rem - 1px)',
                            borderTopRightRadius: 'calc(0.375rem - 1px)'
                          }} 
                        />
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="position-absolute top-0 end-0 m-1 p-0 d-flex justify-content-center align-items-center" 
                          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                          onClick={() => removeFile(index)}
                        >
                          <FaTimes size={12} />
                        </Button>
                      </div>
                      <Card.Body className="p-2">
                        <p className="mb-0 text-truncate small">{preview.name}</p>
                        <small className="text-muted">{preview.size} MB</small>
                        {isUploading && uploadProgress[selectedFiles[index]?.name] !== undefined && (
                          <ProgressBar 
                            now={uploadProgress[selectedFiles[index]?.name]}
                            label={`${Math.round(uploadProgress[selectedFiles[index]?.name])}%`}
                            striped
                            animated
                            variant="success"
                            className="mt-2"
                            style={{ height: '8px', fontSize: '10px' }}
                          />
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowUploadModal(false)} 
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpload} 
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? (
              <>
                <Loader size="sm" /> Uploading...
              </>
            ) : (
              <>
                <FaUpload className="me-2" /> Upload {selectedFiles.length} Image{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Modal */}
      <Modal 
        show={showViewModal} 
        onHide={() => setShowViewModal(false)} 
        centered 
        size="lg"
        className="progress-view-modal"
      >
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="d-flex align-items-center">
            <FaCalendarAlt className="me-2 text-primary" />
            {selectedGroup && format(new Date(selectedGroup.uploadDate), 'PPP')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGroup && (
            <Row xs={2} sm={3} md={4} className="g-3">
              {selectedGroup.images.map((image, index) => (
                <Col key={image._id || index}>
                  <div 
                    className="position-relative shadow-sm"
                    onClick={() => handleImageClick(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={image.thumbnail || image.url} 
                      alt={image.originalName || 'Progress image'}
                      className="img-fluid"
                      style={{ 
                        aspectRatio: '1/1',
                        objectFit: 'cover',
                        width: '100%',
                        borderRadius: '8px',
                      }}
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 p-2 text-center bg-dark bg-opacity-50 text-white" style={{ borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                      <small>Click to enlarge</small>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* Carousel Modal */}
      {selectedGroup && (
        <ImageCarouselModal
          show={showCarouselModal}
          onHide={() => setShowCarouselModal(false)}
          images={selectedGroup.images}
          selectedIndex={selectedImageIndex}
          onSelect={setSelectedImageIndex}
        />
      )}
    </>
  );
};

export default ProgressImageSection; 