import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {

  const [hoverEffect, setHoverEffect] = useState(false);
  const navigate = useNavigate();

  

  
  return (
    <nav className='navbar'>
      <div className="navbar-container">
        <div 
          className="nav-logo-container"
          onMouseEnter={() => setHoverEffect(true)}
          onMouseLeave={() => setHoverEffect(false)}
          onClick={()=>{navigate('/')
            window.scrollTo({ top: 0});}
          }
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