import React, { useState } from 'react';
import { Star } from 'lucide-react';
import '../styles/ReviewForm.css';

export function ReviewForm({ establishmentId }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleStarHover = (value) => {
    setHoverRating(value);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Veuillez donner une note pour cet établissement.');
      return;
    }
    
    if (!reviewText.trim()) {
      setError('Veuillez écrire un commentaire.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real application, you'd make an API call here
      // const response = await axios.post(`/api/etablissement/${establishmentId}/reviews`, {
      //   rating,
      //   text: reviewText
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      setRating(0);
      setReviewText('');
    } catch (err) {
      setError('Une erreur est survenue lors de l\'envoi de votre avis. Veuillez réessayer.');
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (submitted) {
    return (
      <div className="review-form-success">
        <h3>Merci pour votre avis !</h3>
        <p>Votre commentaire a été envoyé avec succès.</p>
        <button 
          className="btn-primary"
          onClick={() => setSubmitted(false)}
        >
          Écrire un autre avis
        </button>
      </div>
    );
  }

  return (
    <div className="review-form-container">
      <h3>Laissez votre avis</h3>
      
      <form className="review-form" onSubmit={handleSubmit}>
        <div className="star-rating-input">
          <label>Votre note :</label>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                className={`star ${(hoverRating || rating) >= star ? 'filled' : ''}`}
                size={24}
              />
            ))}
          </div>
        </div>
        
        <div className="review-text-input">
          <label htmlFor="review-text">Votre commentaire :</label>
          <textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Partagez votre expérience avec cet établissement..."
            rows={5}
          ></textarea>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className={`btn-primary ${isSubmitting ? 'submitting' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer mon avis'}
        </button>
      </form>
    </div>
  );
}