import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NoteContext from "./NoteContext";
import "./GameRoom.css";

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
  const [playersPresent, setPlayersPresent] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

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

    return () => {
      socket.off("playerStatus", handlePlayerStatus);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
      socket.off("roomJoined", handleRoomJoined);
      socket.io.off("reconnect");
    };
  }, [code, playerName, socket, navigate, setPlayerStatus, setCode, setPlayerName]);

  const handleStartGame = (gameType) => {
    if (socket && code && playersPresent) {
      socket.emit("startGame", { gameType, roomCode: code });
      navigate(`/${gameType}`);
    }
  };

  const handleLeaveRoom = () => {
    socket.emit("leaveRoom", code, playerName);
    localStorage.removeItem('gameSession');
    setCode(null);
    setPlayerName("");
    navigate("/");
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
        <button className="button leave-button" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>

      {connectionError && (
        <div className="connection-error">
          Connection lost. Attempting to reconnect...
        </div>
      )}


      {playersPresent && (
        <div className="game-selection">
          {["connect4", "tictactoe" , "rockpaperscissors"].map((game) => (
            <div key={game} className="game-item">
              <h3 className="game-title">
                {game === "connect4" ? "Connect 4" : ""}
                {game === "tictactoe" ? "Tic Tac Toe" : ""}
                {game === "rockpaperscissors" ? "Rock Paper Scissors" : ""}
              </h3>
              <button
                className="button start-button"
                onClick={() => handleStartGame(game)}
              >
                Start Game
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="status">
        {!playersPresent ? (
          <div className="waiting-text">Waiting for players...</div>
        ) : (
          <div className="connected-text">Players connected!</div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;