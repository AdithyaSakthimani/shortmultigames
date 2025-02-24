import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Play, 
  Gamepad2, 
  Sword,
  Zap, // For Real-time Battles
  Home, // For Custom Rooms
  Trophy, // For Global Rankings
  MessageCircle, // For Chat System
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
      description: "Compete for the top spot"
    },
    {
      icon: <MessageCircle className="feature-icon" />,
      title: "Chat System",
      description: "Communicate with other players"
    }
  ];

  return (
    <div className="homepage">
      <div className="container">
        {/* Hero Section */}
        <div className="hero">
          <div className="logo">
            <Gamepad2 className="game-icon" />
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
    </div>
  );
};

export default HomeArea;