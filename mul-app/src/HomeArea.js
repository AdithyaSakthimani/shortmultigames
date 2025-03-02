import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Play,
  Gamepad2,
  Sword,
  Zap,
  Home as HomeIcon,
  Trophy,
  MessageCircle,
  Ban,
  Hash,
  Layers,
  Ship,
  Scissors,
  Clock,
  Globe,
  Sparkles,
  CircleDollarSign
} from 'lucide-react';
import { Analytics } from "@vercel/analytics/react"
import {
  SquareStack, // Othello
  Circle, // Connect 4
  Grid, // Tic-Tac-Toe
  Hand, // Rock Paper Scissors
} from 'lucide-react';
import './HomeArea.css';

const HomeArea = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Create a new IntersectionObserver for content section animations
    const contentObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -100px 0px" }
    );

    // Separate observer for title animations to ensure they don't affect positioning
    const titleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    // Get all sections and titles that need animation
    const sections = document.querySelectorAll('.section-animated');
    const titles = document.querySelectorAll('.title-animated');

    // Observe all elements with the appropriate observer
    sections.forEach(section => contentObserver.observe(section));
    titles.forEach(title => titleObserver.observe(title));

    // Cleanup function
    return () => {
      contentObserver.disconnect();
      titleObserver.disconnect();
    };
  }, []);

  const steps = [
    {
      icon: <Users className="step-icon" />,
      title: "Create a Room",
      description: "Start your own game room and invite friends to join with a unique room code. Choose between public or private room options."
    },
    {
      icon: <Play className="step-icon" />,
      title: "Join a Room",
      description: "Enter a room code to join your friends' game session or browse available public rooms to find new opponents."
    },
    {
      icon: <Sword className="step-icon" />,
      title: "Choose Your Game",
      description: "Select from multiple classic two-player games including Othello, Connect 4, Tic-Tac-Toe, Rock Paper Scissors, and Battleship."
    }
  ];

  const features = [
    {
      icon: <Zap className="feature-icon" />,
      title: "Real-time Battles",
      description: "Experience smooth, lag-free gameplay with instant move synchronization"
    },
    {
      icon: <HomeIcon className="feature-icon" />,
      title: "Custom Rooms",
      description: "Create private rooms with password protection or public rooms for anyone to join"
    },
    {
      icon: <Ban className='feature-icon' />,
      title: "No Sign Up Required",
      description: "Jump straight into the action without creating accounts or profiles"
    },
    {
      icon: <Gamepad2 className="feature-icon" />,
      title: "Cross-Device Play",
      description: "Play seamlessly from any device with a browser - desktop, tablet, or mobile"
    },
    {
      icon: <Globe className="feature-icon" />,
      title: "Global Matchmaking",
      description: "Find opponents from around the world and test your skills against diverse players"
    },
    {
      icon: <Clock className="feature-icon" />,
      title: "24/7 Availability",
      description: "Our servers are always online, so you can play whenever inspiration strikes"
    },
    {
      icon: <CircleDollarSign className="feature-icon"/>,
      title: "Completely Free to Play",
      description: "Enjoy all games and features without spending a single penny"
    },
    {
      icon: <Sparkles className="feature-icon" />,
      title: "Regular Updates",
      description: "New games and features added regularly to keep the experience fresh"
    }
  ];

  const availableGames = [
    {
      icon: <SquareStack className="game-type-icon" />,
      name: "Othello",
      description: "Strategic board game of outflanking your opponent"
    },
    {
      icon: <Circle className="game-type-icon" />,
      name: "Connect 4",
      description: "Vertical strategy game to connect four of your discs"
    },
    {
      icon: <Grid className="game-type-icon" />,
      name: "Tic-Tac-Toe",
      description: "Classic game of X's and O's in a 3x3 grid"
    },
    {
      icon: <Hand className="game-type-icon" />,
      name: "Rock Paper Scissors",
      description: "Quick game of chance and psychology"
    },
    {
      icon: <Ship className="game-type-icon" />,
      name: "Battleship",
      description: "Naval strategy game to sink your opponent's fleet"
    }
  ];

  return (
    <main className="homepage">
      <section className="hero">
        <div className="hero-content">
          <div className="crossed-swords">
            <Sword className="sword sword-left" />
            <Sword className="sword sword-right" />
          </div>
          <h1 className="title">Multiplayer Battle Arena</h1>
          <p className="subtitle">
          Play classic strategy games with friends or rivals in real-time. No sign-ups, no downloads—just pure competitive fun!
          </p>
          <button
            onClick={() => navigate('/rooms')}
            className="cta-button"
          >
            Start Playing
          </button>
        </div>
        <div className="scroll-down">
          <span>↓</span>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
      <div className="title-animated">
        <h2 className="section-title">How It Works</h2>
      </div>
        <div className="steps-grid section-animated">
          {steps.map((step, index) => (
            <div key={index} className="step-card animate-item">
              <div className="step-number">{index + 1}</div>
              <div className="icon-container">
                {step.icon}
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Available Games Section */}
      <section className="available-games-section">
        <div className="title-animated">
          <h2 className="section-title">Games You Can Play</h2>
        </div>
        <div className="games-grid section-animated">
          {availableGames.map((game, index) => (
            <div key={index} className="game-card animate-item">
              <div className="game-icon-container">
                {game.icon}
              </div>
              <h3 className="game-title">{game.name}</h3>
              <p className="game-description">{game.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
      <div className="title-animated">
        <h2 className="features-title">Platform Features</h2>
        </div>
        <div className="features-grid section-animated">
          {features.map((feature, index) => (
            <div key={index} className="feature animate-item">
              <div className="feature-icon-container">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bottom-cta">
        <h2 className="title-animated">Ready to Challenge Your Friends?</h2>
        <p>No accounts, no downloads, just instant multiplayer fun</p>
        <button 
          onClick={() => navigate('/rooms')}
          className="cta-button"
        >
          Create a Room Now
        </button>
      </section>
      <Analytics/>
    </main>
  );
};

export default HomeArea;