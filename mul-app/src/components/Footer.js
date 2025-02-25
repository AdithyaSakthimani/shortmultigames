import React, { useState } from 'react';
import './Footer.css';
const Footer = () => {
    return (
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <div className="footer-logo-container">
              <div className="logo-circle small">
                <div className="logo-inner-circle small"></div>
              </div>
              <span className="logo-text">Duo Net</span>
            </div>
            <p className="footer-description">
              Connecting people in a fun and meaningful way.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                <div className="social-icon twitter"></div>
              </a>
              <a href="#" className="social-link">
                <div className="social-icon instagram"></div>
              </a>
              <a href="#" className="social-link">
                <div className="social-icon facebook"></div>
              </a>
            </div>
          </div>
    
        <div className="footer-bottom">
          <p>© 2025 Duo Net. All rights reserved.</p>
        </div>
        </div>
      </footer>
    );
  };
  export default Footer