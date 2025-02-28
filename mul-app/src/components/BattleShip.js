import React, { useState, useEffect, useContext } from 'react';
import { Crosshair, Ship, Waves, CheckCircle, XCircle } from 'lucide-react';
import './BattleShip.css';
import NoteContext from './NoteContext';

const Battleship = () => {
  const BOARD_SIZE = 10;
  const SHIPS = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 }
  ];
  

  const [shipsToPlace, setShipsToPlace] = useState(() => {
    const savedSession = localStorage.getItem('gameSession');
    let savedCode = null;
    
    if (savedSession) {
      const { savedCode: code } = JSON.parse(savedSession);
      savedCode = code;
    }
    
    if (savedCode) {
      const savedShips = JSON.parse(localStorage.getItem(`battleship_shipsToPlace_${savedCode}`));
      if (savedShips) {
        return savedShips;
      }
    }
    
    return [...SHIPS];
  });
  const [currentShip, setCurrentShip] = useState(null);
  const [orientation, setOrientation] = useState('horizontal');
  const [gamePhase, setGamePhase] = useState(()=> {const savedSession = localStorage.getItem('gameSession');
    let savedCode = null;
    
    if (savedSession) {
      const { savedCode: code } = JSON.parse(savedSession);
      savedCode = code;
    }
    
    if (savedCode) {
      const savedTurn = JSON.parse(localStorage.getItem(`battleship_phase_${savedCode}`));
      if (savedTurn !== null) {
        return savedTurn;
      }
    }
    
    return 'setup';}); // setup, placement, playing, ended
  const [isPlayerTurn, setIsPlayerTurn] = useState(()=> {const savedSession = localStorage.getItem('gameSession');
  let savedCode = null;
  
  if (savedSession) {
    const { savedCode: code } = JSON.parse(savedSession);
    savedCode = code;
  }
  
  if (savedCode) {
    const savedTurn = JSON.parse(localStorage.getItem(`battleship_turn_${savedCode}`));
    if (savedTurn !== null) {
      return savedTurn;
    }
  }
  
  return false;})
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState(null);
  const [playersPresent, setPlayersPresent] = useState(false);
      const [connectionError, setConnectionError] = useState(false);
  const contextValue = useContext(NoteContext);
  const socket = contextValue?.socket;
  const code = contextValue?.code;
  const playerStatus = contextValue?.playerStatus || {};
  const playerName = contextValue?.playerName;
  const setPlayerStatus = contextValue?.setPlayerStatus;
  const setPlayerName = contextValue?.setPlayerName;
  const setCode = contextValue?.setCode;
  // Initialize score from localStorage or default to 0
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem(`battleship_score_${code}`);
    return savedScore ? JSON.parse(savedScore) : { player1: 0, player2: 0 };
  });

  const player1 = playerStatus.player1;
  const player2 = playerStatus.player2;
  const currentPlayer = isPlayerTurn ? playerName : (playerName === player1 ? player2 : player1);
  const [playerBoard, setPlayerBoard] = useState(() => {
    const savedSession = localStorage.getItem('gameSession');
    let savedCode = null;
    
    if (savedSession) {
      const { savedCode: code } = JSON.parse(savedSession);
      savedCode = code;
    }
    
    // If we have a code, try to load the saved board
    if (savedCode) {
      const savedBoard = JSON.parse(localStorage.getItem(`battleship_playerBoard_${savedCode}`));
      if (savedBoard) {
        return savedBoard;
      }
    }
    
    // Otherwise, create a new board with initial positions
    const initialBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
    return initialBoard;
  });
  const [opponentBoard, setOpponentBoard] = useState(() => {
    const savedSession = localStorage.getItem('gameSession');
    let savedCode = null;
    
    if (savedSession) {
      const { savedCode: code } = JSON.parse(savedSession);
      savedCode = code;
    }
    
    // If we have a code, try to load the saved board
    if (savedCode) {
      const savedBoard = JSON.parse(localStorage.getItem(`battleship_opponentBoard_${savedCode}`));
      if (savedBoard) {
        return savedBoard;
      }
    }
    
    // Otherwise, create a new board with initial positions
    const initialBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
    return initialBoard;
  });
  // Save score to localStorage whenever it changes
  useEffect(() => {
      if (code) {
        localStorage.setItem(`battleship_opponentBoard_${code}`, JSON.stringify(opponentBoard));
        localStorage.setItem(`battleship_playerBoard_${code}`, JSON.stringify(playerBoard));
        localStorage.setItem(`battleship_turn_${code}`, JSON.stringify(isPlayerTurn));
        localStorage.setItem(`battleship_phase_${code}`, JSON.stringify(gamePhase));
        localStorage.setItem(`battleship_shipsToPlace_${code}`, JSON.stringify(shipsToPlace));
      }
    }, [playerBoard,opponentBoard, isPlayerTurn, gamePhase,code,shipsToPlace]);
    useEffect(()=>{if (code) 
          {const savedTurn = JSON.parse(localStorage.getItem(`battleship_turn_${code}`));
          const savedPhase = JSON.parse(localStorage.getItem(`battleship_phase_${code}`));
          const savedShips = JSON.parse(localStorage.getItem(`battleship_shipsToPlace_${code}`));
          if (savedTurn !== null) {
            setIsPlayerTurn(savedTurn);
          }
          if (savedPhase !== null) {
            setGamePhase(savedPhase);
          }
          if (savedShips !== null) {
            setShipsToPlace(savedShips);
          }}
        },[code]);
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
      }, [code, playerName, socket,  setPlayerStatus, setCode, setPlayerName]);
  useEffect(() => {
    if (code && score) {
      localStorage.setItem(`battleship_score_${code}`, JSON.stringify(score));
    }
  }, [score, code]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;
  
    socket.on('gameUpdate', (data) => {
      if (!data || data.type !== 'battleship') return;
      console.log('gameData', data);
      
      if (data.action === 'scoreUpdate') {
        setScore(data.score);
      }
      
      if (data.action === 'boardUpdate') {
        if (data.player === playerName) {
          // Update my board (if needed)
          setPlayerBoard(data.board);
        }
      } else if (data.action === 'phaseChange') {
        // Handle phase change
        setGamePhase(data.phase);
        if (data.phase === 'playing') {
          setIsPlayerTurn(data.playerTurn === playerName);
        }
      } else if (data.action === 'shotResult') {
        // If I fired the shot, update my view of opponent's board
        if (data.player === playerName) {
          const newOpponentBoard = [...opponentBoard];
          newOpponentBoard[data.row][data.col] = data.result;
          setOpponentBoard(newOpponentBoard);
        } 
        // If opponent fired the shot at me, update my board
        else {
          const newPlayerBoard = [...playerBoard];
          newPlayerBoard[data.row][data.col] = data.result;
          setPlayerBoard(newPlayerBoard);
        }
  
        if (data.nextTurn) {
          setIsPlayerTurn(data.nextTurn === playerName);
        }
      } 
      
      if (data.action === 'gameEnd') {
        setWinner(data.winner);
        setGamePhase('ended');
      
        if (data.winner === playerName) {
          // Calculate the new score
          const newScore = {
            ...score,
            [playerName === player1 ? 'player1' : 'player2']:
              score[playerName === player1 ? 'player1' : 'player2'] + 1
          };
          
          // Update local state
          setScore(newScore);
          
          // Send the score update to the server
          socket.emit('makeMove', {
            roomId: code,
            move: {
              type: 'battleship',
              action: 'updateScore',
              score: newScore
            }
          });
        }
      } else if (data.action === 'resetGame') {
        resetLocalGameState();
      }
    });
  
    return () => socket.off('gameUpdate');
  }, [socket, playerName, player1, player2, opponentBoard, playerBoard, score]);

  // Select a ship to place
  const selectShip = (ship) => {
    if (gamePhase !== 'setup') return;
    setCurrentShip(ship);
  };

  // Toggle ship orientation
  const toggleOrientation = () => {
    setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };

  // Check if ship can be placed at specific position
  const canPlaceShip = (row, col, ship) => {
    if (!ship) return false;
    
    const size = ship.size;
    
    // Check if ship fits on board
    if (orientation === 'horizontal' && col + size > BOARD_SIZE) return false;
    if (orientation === 'vertical' && row + size > BOARD_SIZE) return false;
    
    // Check if space is clear
    for (let i = 0; i < size; i++) {
      const r = orientation === 'vertical' ? row + i : row;
      const c = orientation === 'horizontal' ? col + i : col;
      if (playerBoard[r][c]) return false;
    }
    
    return true;
  };

  // Place a ship on the board
  const placeShip = (row, col) => {
    if (!currentShip || !canPlaceShip(row, col, currentShip)) return;
  
    const newBoard = [...playerBoard];
    const size = currentShip.size;
  
    for (let i = 0; i < size; i++) {
      const r = orientation === 'vertical' ? row + i : row;
      const c = orientation === 'horizontal' ? col + i : col;
      newBoard[r][c] = currentShip.name;
    }
  
    setPlayerBoard(newBoard);
    setShipsToPlace(prev => prev.filter(s => s.name !== currentShip.name));
    setCurrentShip(null);
  
    // If all ships placed, emit ready event
    if (shipsToPlace.length === 1) {
      socket.emit('makeMove', {
        roomId: code,
        move: {
          type: 'battleship',
          action: 'ready',
          board: newBoard,
          player: playerName
        }
      });
      setGamePhase('placement'); // Update phase to 'placement' while waiting for opponent
    }
  };

  // Fire a shot at opponent's board
  const fireShot = (row, col) => {
    if (gamePhase !== 'playing' || !isPlayerTurn || opponentBoard[row][col]) return;
    
    socket.emit('makeMove', {
      roomId: code,
      move: {
        type: 'battleship',
        action: 'fire',
        row,
        col,
        player: playerName
      }
    });
  };

  const resetLocalGameState = () => {
    setPlayerBoard(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)));
    setOpponentBoard(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)));
    setShipsToPlace([...SHIPS]);
    setCurrentShip(null);
    setOrientation('horizontal');
    setGamePhase('setup');
    setIsPlayerTurn(false);
    setWinner(null);
  };

  const resetGame = () => {
    if (!socket || !code) {
      setError('Cannot reset game - connection not available');
      return;
    }
    
    socket.emit('makeMove', {
      roomId: code,
      move: {
        type: 'battleship',
        action: 'reset'
      }
    });
    
    resetLocalGameState();
  };

  // Render player's board cell
  const renderPlayerCell = (row, col) => {
    const cellValue = playerBoard[row][col];
    const isShip = cellValue && cellValue !== 'hit' && cellValue !== 'miss';
    const isHit = cellValue === 'hit';
    const isMiss = cellValue === 'miss';
    
    return (
      <div 
        key={`player-${row}-${col}`}
        className={`battleship-cell player-cell ${isShip ? 'ship-cell' : ''} ${isHit ? 'hit-cell' : ''} ${isMiss ? 'miss-cell' : ''}`}
        onClick={() => gamePhase === 'setup' && placeShip(row, col)}
      >
        {isShip && <Ship size={16} />}
        {isHit && <XCircle size={16} className="hit-marker" />}
        {isMiss && <Waves size={16} className="miss-marker" />}
      </div>
    );
  };

  // Render opponent's board cell
  const renderOpponentCell = (row, col) => {
    const cellValue = opponentBoard[row][col];
    const isHit = cellValue === 'hit';
    const isMiss = cellValue === 'miss';
    
    return (
      <div 
        key={`opponent-${row}-${col}`}
        className={`battleship-cell opponent-cell ${isHit ? 'hit-cell' : ''} ${isMiss ? 'miss-cell' : ''} ${isPlayerTurn && gamePhase === 'playing' ? 'active' : ''}`}
        onClick={() => isPlayerTurn && gamePhase === 'playing' && fireShot(row, col)}
      >
        {!cellValue && isPlayerTurn && gamePhase === 'playing' && <Crosshair size={16} className="target-marker" />}
        {isHit && <XCircle size={16} className="hit-marker" />}
        {isMiss && <Waves size={16} className="miss-marker" />}
      </div>
    );
  };

  return (
    <div className="battleship-container">
      {/* Left Side - Game Boards */}
      <div className="battleship-boards">
        <div className="board-container">
          <h3>Your Fleet</h3>
          <div className="battleship-board">
            {playerBoard.map((row, rowIndex) => (
              <div key={`player-row-${rowIndex}`} className="board-row">
                {row.map((_, colIndex) => renderPlayerCell(rowIndex, colIndex))}
              </div>
            ))}
          </div>
        </div>

        <div className="board-container">
          <h3>Enemy Waters</h3>
          <div className="battleship-board">
            {opponentBoard.map((row, rowIndex) => (
              <div key={`opponent-row-${rowIndex}`} className="board-row">
                {row.map((_, colIndex) => renderOpponentCell(rowIndex, colIndex))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Controls and Info */}
      <div className="battleship-controls">

        {gamePhase === 'setup' && (
          <div className="ship-selection">
            <h3>Place Your Ships</h3>
            <button onClick={toggleOrientation} className="orientation-btn">
              Orientation: {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
            </button>
            <div className="ship-list">
              {shipsToPlace.map(ship => (
                <button 
                  key={ship.name} 
                  className={`ship-btn ${currentShip?.name === ship.name ? 'selected' : ''}`}
                  onClick={() => selectShip(ship)}
                >
                  {ship.name} ({ship.size})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="game-status">
          <div>You: {playerName}</div>
          {gamePhase === 'setup' && <div>Place your ships</div>}
          {gamePhase === 'placement' && <div>Waiting for opponent...</div>}
          {gamePhase === 'playing' && <div>Current Turn: {currentPlayer}</div>}
          {gamePhase === 'ended' && <div>{winner === playerName ? 'You Win!' : 'You Lose!'}</div>}
        </div>

        {gamePhase === 'ended' && (
          <button className="reset-button" onClick={resetGame}>
            Play Again
          </button>
        )}
        <div className="score-area">
          <div className="score-item">
            <span className="player-label">
              <strong>{player1 || 'Player 1'}</strong>
            </span>
            <span className="score-value">{score.player1}</span>
          </div>
          <div className="score-item">
            <span className="player-label">
              <strong>{player2 || 'Player 2'}</strong>
            </span>
            <span className="score-value">{score.player2}</span>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
};

export default Battleship;