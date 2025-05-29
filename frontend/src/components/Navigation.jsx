import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Compass } from 'lucide-react';
import '../styles/Navigation.css';

export function Navigation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="nav-container">
      <div className="container nav-content">
        <Link to="/" className="logo">
          <Compass size={28} />
          <span>TourGuide</span>
        </Link>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Rechercher un établissement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" aria-label="Rechercher">
            <Search size={20} />
          </button>
        </form>

        <div className="nav-links">
          <Link to="/favorites">Favoris</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login" className="btn-login">Connexion</Link>
        </div>

        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isMenuOpen && (
          <div className="mobile-menu">
            <Link to="/favorites" onClick={toggleMenu}>Favoris</Link>
            <Link to="/contact" onClick={toggleMenu}>Contact</Link>
            <Link to="/login" onClick={toggleMenu}>Connexion</Link>
          </div>
        )}
      </div>
    </nav>
  );
}