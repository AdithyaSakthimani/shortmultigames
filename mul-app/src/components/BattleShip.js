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
  
  const [playerBoard, setPlayerBoard] = useState(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)));
  const [opponentBoard, setOpponentBoard] = useState(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)));
  const [shipsToPlace, setShipsToPlace] = useState([...SHIPS]);
  const [currentShip, setCurrentShip] = useState(null);
  const [orientation, setOrientation] = useState('horizontal');
  const [gamePhase, setGamePhase] = useState('setup'); // setup, placement, playing, ended
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState(null);

  const contextValue = useContext(NoteContext);
  const socket = contextValue?.socket;
  const code = contextValue?.code;
  const playerStatus = contextValue?.playerStatus || {};
  const playerName = contextValue?.playerName;

  // Initialize score from localStorage or default to 0
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem(`battleship_score_${code}`);
    return savedScore ? JSON.parse(savedScore) : { player1: 0, player2: 0 };
  });

  const player1 = playerStatus.player1;
  const player2 = playerStatus.player2;
  const currentPlayer = isPlayerTurn ? playerName : (playerName === player1 ? player2 : player1);

  // Save score to localStorage whenever it changes
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