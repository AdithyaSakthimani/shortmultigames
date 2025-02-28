import React, { useState } from 'react';
import './Footer.css';

const Footer = () => {
  const [hoverEffect, setHoverEffect] = useState(false);
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-branding">
            <div className="logo-container" 
                 onMouseEnter={() => setHoverEffect(true)}
                 onMouseLeave={() => setHoverEffect(false)}>
              <div className={`logo-circle ${hoverEffect ? 'pulse' : ''}`}>
                <div className="logo-inner-circle"></div>
              </div>
              <span className="logo-text">DuoNet</span>
            </div>
            <p className="tagline">Connecting people in a fun and meaningful way.</p>
          </div>
          
          <div className="social-container">
            <div className="social-links">
              <a href="https://x.com/legendarypheon2" target='_blank' className="social-link twitter">
                <span className="social-hover-text">Tweet</span>
              </a>
              <a href="https://www.instagram.com/adithya_sakthimani/profilecard/?igsh=b3Vhc3pna25oY3hk"  target='_blank' className="social-link instagram">
                <span className="social-hover-text">Share</span>
              </a>
              <a href="#" className="social-link facebook">
                <span className="social-hover-text">Connect</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path d="M0,0 C240,95 480,100 720,70 C960,40 1200,100 1440,85 L1440,100 L0,100 Z" fill="#f3f4f8"></path>
          </svg>
        </div>
        
        <div className="copyright">
          <p>© 2025 Duo Net. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;