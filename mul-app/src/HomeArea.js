import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Play, 
  Gamepad2, 
  Sword,
  Zap,
  Home,
  Trophy,
  MessageCircle,
  Ban
} from 'lucide-react';
import './HomeArea.css';

const HomeArea = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: <Users className="step-icon" />,
      title: "Create a Room",
      description: "Start your own game room and invite friends to join. Set custom game rules and preferences."
    },
    {
      icon: <Play className="step-icon" />,
      title: "Join a Room",
      description: "Enter a room code to join your friends' game session instantly."
    },
    {
      icon: <Sword className="step-icon" />,
      title: "Battle Friends",
      description: "Compete in real-time battles with your friends. Show off your skills and climb the leaderboard!"
    }
  ];

  const features = [
    {
      icon: <Zap className="feature-icon" />,
      title: "Real-time Battles",
      description: "Experience smooth, lag-free gameplay"
    },
    {
      icon: <Home className="feature-icon" />,
      title: "Custom Rooms",
      description: "Create private rooms for friends"
    },
    {
      icon: <Ban className='feature-icon' />,
      title: "No Sign Up",
      description: "play games with each other without needing to ever sign up "
    },
    {
      icon: <Gamepad2 className="feature-icon" />,
      title: "Cross-Device Play",
      description: "Play from any device with a browser - desktop, tablet, or mobile"
    }
  ];

  return (
    <div className="homepage">
      <div className="hero">
        <div className="hero-content">
          {/* Crossed Swords Icon */}
          <div className="crossed-swords">
            <Sword className="sword sword-left" />
            <Sword className="sword sword-right" />
          </div>
          <h1 className="title">Multiplayer Battle Arena</h1>
          <p className="subtitle">
            Challenge your friends in epic battles and become the ultimate champion!
          </p>
          <button 
            onClick={() => navigate('/rooms')}
            className="cta-button"
          >
            Start Playing
          </button>
        </div>
        {/* Scroll Down Indicator */}
        <div className="scroll-down">
          <span>↓</span>
        </div>
      </div>

      {/* Steps Section */}
      <div className="steps-grid">
        {steps.map((step, index) => (
          <div key={index} className="step-card">
            <div className="icon-container">
              {step.icon}
            </div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-description">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div className="features">
        <h2 className="features-title">Game Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature">
              <div className="feature-icon-container">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeArea;