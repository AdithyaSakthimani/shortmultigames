import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoverEffect, setHoverEffect] = useState(false);
  const navigate = useNavigate();

  

  
  return (
    <nav className={`navbar`}>
      <div className="navbar-container">
        {/* Logo */}
        <div 
          className="nav-logo-container"
          onMouseEnter={() => setHoverEffect(true)}
          onMouseLeave={() => setHoverEffect(false)}
          onClick={()=>navigate('/')}
        >
          <div className={`logo-circle ${hoverEffect ? 'pulse' : ''}`}>
            <div className="logo-inner-circle"></div>
          </div>
          <span className="logo-text">DuoNet</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;