import React from 'react';
import { Modal, Button, Image } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import './ImageCarouselModal.css';

const ImageCarouselModal = ({
  show,
  onHide,
  images,
  selectedIndex,
  onSelect,
}) => {
  if (!images || images.length === 0) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    onSelect((selectedIndex - 1 + images.length) % images.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    onSelect((selectedIndex + 1) % images.length);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      dialogClassName="image-carousel-modal-dialog"
      contentClassName="image-carousel-modal-content"
      centered
      animation={false}
    >
      <Modal.Body className="image-carousel-modal-body">
        <div className="image-container">
          <Image
            src={images[selectedIndex]?.url}
            alt={`Progress ${selectedIndex + 1}`}
            className="main-image"
          />
        </div>

        <Button
          variant="link"
          className="close-button"
          onClick={onHide}
        >
          <FaTimes size={24} />
        </Button>

        {images.length > 1 && (
          <>
            <Button
              variant="link"
              className="nav-button prev-button"
              onClick={handlePrev}
            >
              <FaChevronLeft size={32} />
            </Button>
            <Button
              variant="link"
              className="nav-button next-button"
              onClick={handleNext}
            >
              <FaChevronRight size={32} />
            </Button>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ImageCarouselModal; 