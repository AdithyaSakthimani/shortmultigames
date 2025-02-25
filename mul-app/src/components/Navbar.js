import React, { useState } from 'react';
import './Navbar.css';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate() ; 
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="logo-container" onClick={()=>navigate('/')}>
          <div className="logo-circle">
            <div className="logo-inner-circle"></div>
          </div>
          <span className="logo-text">Duo Net</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="nav-links">
          <a href="#" className="nav-link">Home</a>
          <a href="#" className="nav-link">Features</a>
          <a href="#" className="nav-link">Community</a>
        </div>
        
        {/* CTA Button */}
 
        
        {/* Mobile Menu Button */}
        <div className="menu-button" onClick={toggleMenu}>
          <div className={`menu-icon ${menuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a href="#" className="mobile-link">Home</a>
        <a href="#" className="mobile-link">Features</a>
        <a href="#" className="mobile-link">Pricing</a>
        <a href="#" className="mobile-link">Community</a>
        <button className="mobile-cta-button">Get Started</button>
      </div>
    </nav>
  );
};
export default Navbar ; 