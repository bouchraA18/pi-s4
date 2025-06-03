import React from 'react';
import { Star, User } from 'lucide-react';
import '../styles/ReviewList.css';

export function ReviewList({ reviews }) {
  if (reviews.length === 0) {
    return (
      <div className="no-reviews">
        <p>Soyez le premier à laisser un avis !</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="review-list">
      {reviews.map((review, index) => (
        <div key={index} className="review-card">
          <div className="review-header">
            <div className="reviewer-info">
              <div className="reviewer-avatar">
                <User size={20} />
              </div>
              <div className="reviewer-name-date">
                <span className="reviewer-name">{review.user}</span>
                <span className="review-date">{formatDate(review.date)}</span>
              </div>
            </div>
            <div className="review-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`star ${review.rating >= star ? 'filled' : ''}`}
                  size={16}
                />
              ))}
            </div>
          </div>
          <div className="review-content">
            <p>{review.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}