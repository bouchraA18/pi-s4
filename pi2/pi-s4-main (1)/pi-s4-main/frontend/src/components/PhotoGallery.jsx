import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import '../styles/PhotoGallery.css';

export function PhotoGallery({ photos, name }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  const sliderRef = useRef(null);
  
  // Handle swipe gestures
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && activeIndex < photos.length - 1) {
      goToNext();
    } else if (isRightSwipe && activeIndex > 0) {
      goToPrev();
    }
  };
  
  const goToPrev = () => {
    if (isLightboxOpen) {
      setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    } else {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };
  
  const goToNext = () => {
    if (isLightboxOpen) {
      setLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    } else {
      setActiveIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev));
    }
  };
  
  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };
  
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);
  
  return (
    <div className="photo-gallery">
      <div 
        className="main-photo-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        ref={sliderRef}
      >
        <button 
          className="gallery-nav prev" 
          onClick={goToPrev}
          disabled={activeIndex === 0}
          aria-label="Photo précédente"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="main-photo">
          <img 
            src={photos[activeIndex]} 
            alt={`${name} - Photo ${activeIndex + 1}`} 
            onClick={() => openLightbox(activeIndex)}
          />
        </div>
        
        <button 
          className="gallery-nav next" 
          onClick={goToNext}
          disabled={activeIndex === photos.length - 1}
          aria-label="Photo suivante"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="thumbnails">
        {photos.map((photo, index) => (
          <div 
            key={index}
            className={`thumbnail ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
          >
            <img src={photo} alt={`${name} - Miniature ${index + 1}`} />
          </div>
        ))}
      </div>
      
      {isLightboxOpen && (
        <div className="lightbox">
          <button className="close-lightbox" onClick={closeLightbox} aria-label="Fermer">
            <X size={24} />
          </button>
          
          <button 
            className="lightbox-nav prev" 
            onClick={goToPrev}
            aria-label="Photo précédente"
          >
            <ChevronLeft size={32} />
          </button>
          
          <div className="lightbox-content">
            <img 
              src={photos[lightboxIndex]} 
              alt={`${name} - Photo en plein écran ${lightboxIndex + 1}`}
            />
            <div className="lightbox-counter">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </div>
          
          <button 
            className="lightbox-nav next" 
            onClick={goToNext}
            aria-label="Photo suivante"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </div>
  );
}