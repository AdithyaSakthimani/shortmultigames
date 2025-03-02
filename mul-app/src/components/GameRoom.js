import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NoteContext from "./NoteContext";
import "./GameRoom.css";
import tictactoeImg from './images/tictactoe.png';
import Connect4Img from "./images/connect4.jpg";
import RockPaperScissorsImg from "./images/rockpaperscissors.jpg";
import othelloImg from "./images/othello.png";
import battleshipImg from './images/batteship.jpg'

const GameRoom = () => {
  const { 
    code, 
    setCode, 
    playerName, 
    socket, 
    scores, 
    setPlayerName, 
    setPlayerStatus 
  } = useContext(NoteContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [playersPresent, setPlayersPresent] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  // Game info for display
  const gameInfo = {
    tictactoe: {
      title: "Tic Tac Toe",
      description: "Classic 3x3 grid game. Be the first to get three in a row!",
      placeholderImage: tictactoeImg
    },
    connect4: {
      title: "Connect 4",
      description: "Drop discs to connect four of your pieces in a row while preventing your opponent from doing the same.",
      placeholderImage: Connect4Img
    },
    rockpaperscissors: {
      title: "Rock Paper Scissors",
      description: "Test your luck and strategy in this classic hand game.",
      placeholderImage: RockPaperScissorsImg
    },
    othello: {
      title: "Othello",
      description: "Strategic board game where you flip pieces to capture territory.",
      placeholderImage: othelloImg
    },
    battleship: {
      title: "Battleship",
      description: "Classic naval combat game. Locate and sink your opponent's fleet!",
      placeholderImage: battleshipImg
    }
  };

  useEffect(() => {
    const savedSession = localStorage.getItem('gameSession');
    if (savedSession) {
      const { savedCode, savedName } = JSON.parse(savedSession);
      if (!code && !playerName) {
        setCode(savedCode);
        setPlayerName(savedName);
      }
    }
  }, []);

  useEffect(() => {
    if (code && playerName) {
      localStorage.setItem('gameSession', JSON.stringify({
        savedCode: code,
        savedName: playerName
      }));
    }
  }, [code, playerName]);

  useEffect(() => {
    if (!code || !playerName || !socket) {
      return;
    }

    const joinRoom = () => {
      console.log(`Joining room ${code} as ${playerName}`);
      socket.emit("joinRoom", playerName, code);
    };

    joinRoom();

    const handlePlayerStatus = (status) => {
      if (!status) {
        setConnectionError(true);
        return;
      }
      setConnectionError(false);
      setPlayerStatus(status);
      setPlayersPresent(!!(status.player1 && status.player2));
    };

    const handleDisconnect = () => {
      setConnectionError(true);
      console.log("Disconnected from server");
    };

    const handleConnect = () => {
      console.log("Connected to server, rejoining room...");
      joinRoom();
      setConnectionError(false);
    };

    const handleRoomJoined = (response) => {
      if (!response.success) {
        console.error("Failed to join room:", response.error);
        localStorage.removeItem('gameSession');
        setCode(null);
        setPlayerName("");
        navigate("/");
      } else {
        console.log("Successfully joined room");
      }
    };

    socket.on("playerStatus", handlePlayerStatus);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleConnect);
    socket.on("roomJoined", handleRoomJoined);
    socket.io.on("reconnect", joinRoom);

    // Cleanup function - remove user from room when component unmounts
    return () => {
      const newPath = window.location.pathname;
      // Only leave room if navigating to home or rooms page
      if (newPath === '/' || newPath === '/rooms') {
        console.log(`Leaving room ${code} as ${playerName} due to navigation to ${newPath}`);
        socket.emit("leaveRoom", code, playerName);
        localStorage.removeItem('gameSession');
      }
      
      socket.off("playerStatus", handlePlayerStatus);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
      socket.off("roomJoined", handleRoomJoined);
      socket.io.off("reconnect");
    };
  }, [code, playerName, socket, navigate, setPlayerStatus, setCode, setPlayerName]);

  // Add a listener for route changes
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (socket && code && playerName) {
        socket.emit("leaveRoom", code, playerName);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket, code, playerName]);

  const handleStartGame = (gameType) => {
    if (socket && code && playersPresent) {
      socket.emit("startGame", { gameType, roomCode: code });
      navigate(`/${gameType}`);
      window.scrollTo({ top: 0});
    }
  };

  const handleLeaveRoom = () => {
    socket.emit("leaveRoom", code, playerName);
    localStorage.removeItem('gameSession');
    setCode(null);
    setPlayerName("");
    navigate("/rooms");
  };

  // Custom navigation handlers for home and rooms routes
  const navigateToHome = () => {
    if (socket && code && playerName) {
      socket.emit("leaveRoom", code, playerName);
      localStorage.removeItem('gameSession');
      setCode(null);
      setPlayerName("");
    }
    navigate("/");
  };

  const navigateToRooms = () => {
    if (socket && code && playerName) {
      socket.emit("leaveRoom", code, playerName);
      localStorage.removeItem('gameSession');
      setCode(null);
      setPlayerName("");
    }
    navigate("/rooms");
  };

  if (!code || !playerName) {
    return (
      <div className="loading-screen">
        <div className="loading-text">Reconnecting to session...</div>
      </div>
    );
  }

  return (
    <div className="gameroom-container">
      <div className="header">
        <h2 className="room-code">Room Code: {code}</h2>
        <button className="leave-button" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>

      {connectionError && (
        <div className="connection-error">
          Connection lost. Attempting to reconnect...
        </div>
      )}

      {playersPresent ? (
        <>
          <h1 style={{textAlign: 'center', marginBottom: '2rem', color: '#333'}}>
            Select a Game to Play
          </h1>
          <div className="game-selection">
            {Object.keys(gameInfo).map((gameKey) => (
              <div key={gameKey} className="game-item">
                <div className="game-image-container">
                  <img 
                    src={gameInfo[gameKey].placeholderImage} 
                    alt={gameInfo[gameKey].title}
                    className="game-image" 
                  />
                </div>
                <div className="game-content">
                  <h3 className="my-game-title">{gameInfo[gameKey].title}</h3>
                  <p style={{marginBottom: '1rem', color: '#6c757d', fontSize: '0.9rem'}}>
                    {gameInfo[gameKey].description}
                  </p>
                  <button
                    className="start-button"
                    onClick={() => handleStartGame(gameKey)}
                  >
                    Start Game
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="status">
          <div className="waiting-text">Waiting for another player to join...</div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;