import React, { useState, useEffect, useContext } from 'react';
import { X, Circle } from 'lucide-react';
import './TicTacToe.css';
import NoteContext from './NoteContext';

const TicTacToe = () => {
  // Track who started the last game to alternate first player
  const [lastGameStarter, setLastGameStarter] = useState(() => {
    const savedSession = localStorage.getItem('gameSession');
    let savedCode = null;
    
    if (savedSession) {
      const { savedCode: code } = JSON.parse(savedSession);
      savedCode = code;
    }
    
    if (savedCode) {
      const savedStarter = JSON.parse(localStorage.getItem(`tictactoe_lastStarter_${savedCode}`));
      if (savedStarter !== null) {
        return savedStarter;
      }
    }
    
    return true; // Default X starts first game
  });

  const [isXNext, setIsXNext] = useState(() => {
    const savedSession = localStorage.getItem('gameSession');
    let savedCode = null;
    
    if (savedSession) {
      const { savedCode: code } = JSON.parse(savedSession);
      savedCode = code;
    }
    
    if (savedCode) {
      const savedTurn = JSON.parse(localStorage.getItem(`tictactoe_turn_${savedCode}`));
      if (savedTurn !== null) {
        return savedTurn;
      }
    }
    
    return true; // Default value if no saved state
  });
  const [winner, setWinner] = useState({ mark: null, name: null });
  const [error, setError] = useState(null);
  const [playersPresent, setPlayersPresent] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const contextValue = useContext(NoteContext);
  const socket = contextValue?.socket;
  const code = contextValue?.code;
  const playerStatus = contextValue?.playerStatus || {};
  const playerName = contextValue?.playerName;
  const setPlayerStatus = contextValue?.setPlayerStatus;
  const setCode = contextValue?.setCode;
  const setPlayerName = contextValue?.setPlayerName;

  // Initialize score from localStorage or default to 0
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem(`tictactoe_score_${code}`);
    return savedScore ? JSON.parse(savedScore) : { player1: 0, player2: 0 };
  });

  const player1 = playerStatus.player1;
  const player2 = playerStatus.player2;
  const currentPlayerName = isXNext ? (player1 || 'Player 1') : (player2 || 'Player 2');
  const [board, setBoard] = useState(()=>{

    const savedSession = localStorage.getItem('gameSession');
    let savedCode = null;
    
    if (savedSession) {
      const { savedCode: code } = JSON.parse(savedSession);
      savedCode = code;
    }
    if (savedCode) {
      const savedBoard = JSON.parse(localStorage.getItem(`tictactoe_board_${savedCode}`));
      if (savedBoard) {
        return savedBoard;
      }
    }
    const initialBoard = Array(9).fill(null)
    return initialBoard;});
  
  // Save board and turn state to localStorage
  useEffect(() => {
      if (code) {
        localStorage.setItem(`tictactoe_board_${code}`, JSON.stringify(board));
        localStorage.setItem(`tictactoe_turn_${code}`, JSON.stringify(isXNext));
        localStorage.setItem(`tictactoe_lastStarter_${code}`, JSON.stringify(lastGameStarter));
      }
    }, [board, isXNext, code, lastGameStarter]);
  
  // Load turn state from localStorage
  useEffect(()=>{
    if (code) {
      const savedTurn = JSON.parse(localStorage.getItem(`tictactoe_turn_${code}`));
      if (savedTurn !== null) {
        setIsXNext(savedTurn);
      }

      const savedStarter = JSON.parse(localStorage.getItem(`tictactoe_lastStarter_${code}`));
      if (savedStarter !== null) {
        setLastGameStarter(savedStarter);
      }
    }
  },[code]);
  
  // Save score to localStorage whenever it changes
  useEffect(() => {
    if (code && score) {
      localStorage.setItem(`tictactoe_score_${code}`, JSON.stringify(score));
    }
  }, [score, code]);
  
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
    if (!socket) return;

    socket.on('gameUpdate', (data) => {
      if (!data) return;
      
      setBoard(data.board);
      setIsXNext(data.isXNext);
      
      if (data.winner) {
        if (data.winner === 'Draw') {
          setWinner({ mark: 'Draw', name: 'Draw' });
        } else {
          const winnerMark = data.winner === player1 ? 'X' : 'O';
          setWinner({ mark: winnerMark, name: data.winner });
          
          setScore(prevScore => {
            const newScore = {
              ...prevScore,
              [data.winner === player1 ? 'player1' : 'player2']: 
                prevScore[data.winner === player1 ? 'player1' : 'player2'] + 1
            };
            return newScore;
          });
        }
      }
    });

    return () => socket.off('gameUpdate');
  }, [socket, player1, player2]);
  
  const getWinningCombination = (board) => {
    const winningCombinations = [
      [0, 1, 2], // Top row
      [3, 4, 5], // Middle row
      [6, 7, 8], // Bottom row
      [0, 3, 6], // Left column
      [1, 4, 7], // Middle column
      [2, 5, 8], // Right column
      [0, 4, 8], // Diagonal from top-left to bottom-right
      [2, 4, 6], // Diagonal from top-right to bottom-left
    ];
  
    for (let combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return combination;
      }
    }
  
    return null;
  };
  
  const winningCombination = winner.mark ? getWinningCombination(board) : null;
  
  const handleClick = (index) => {
    if (!socket || !code) {
      setError('Connection not available');
      return;
    }

    if (board[index] || winner.mark) return;

    const isValidTurn = (isXNext && playerName === player1) || 
                       (!isXNext && playerName === player2);

    if (!isValidTurn) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';

    socket.emit('makeMove', {
      roomId: code,
      move: { 
        type: 'tictactoe', 
        position: index,
        board: newBoard,
        isXNext: !isXNext
      }
    });
  };
  const renderWinningLine = (winningCombination) => {
    if (!winningCombination) return null;
    
    const [a, b, c] = winningCombination;
    
    // Horizontal rows
    if (a % 3 === 0 && b === a + 1 && c === a + 2) {
      const row = Math.floor(a / 3);
      return <div className={`winning-line winning-line-horizontal row-${row}`}></div>;
    }
    
    // Vertical columns
    if (a === 0 || a === 1 || a === 2) {
      if (b === a + 3 && c === a + 6) {
        const col = a % 3;
        return <div className={`winning-line winning-line-vertical col-${col}`}></div>;
      }
    }
    
    // Diagonal from top-left to bottom-right
    if (a === 0 && b === 4 && c === 8) {
      return <div className={`winning-line winning-line-diagonal top-left`}></div>;
    }
    
    // Diagonal from top-right to bottom-left
    if (a === 2 && b === 4 && c === 6) {
      return <div className={`winning-line winning-line-diagonal top-right`}></div>;
    }
    
    return null;
  };
  const renderCell = (index, winningCombination) => {
    const cellValue = board[index];
    const isCurrentPlayer = (isXNext && playerName === player1) || 
                          (!isXNext && playerName === player2);
    const isWinningCell = winningCombination && winningCombination.includes(index);
    const combinationIndex = isWinningCell ? winningCombination.indexOf(index) : null;
  
    return (
      <div 
        key={index}
        className={`cell ${isCurrentPlayer ? 'active' : ''} ${isWinningCell ? 'winning-cell' : ''}`}
        data-combination={combinationIndex}
        onClick={() => handleClick(index)}
      >
        {cellValue === 'X' && <X className="x-icon" />}
        {cellValue === 'O' && <Circle className="o-icon" />}
      </div>
    );
  };

  const resetGame = () => {
    if (!socket || !code) {
      setError('Cannot reset game - connection not available');
      return;
    }
    
    // Change who starts the next game
    const newStartingPlayer = !lastGameStarter;
    setLastGameStarter(newStartingPlayer);
    
    setWinner({ mark: null, name: null });
    
    socket.emit('makeMove', {
      roomId: code,
      move: { 
        type: 'tictactoe',
        action: 'reset',
        board: Array(9).fill(null),
        isXNext: newStartingPlayer // Use the new starter to determine who goes first
      }
    });
  };

  return (
      <div className="game-container">
        {/* Left Side - Game Board */}
        <div className="game-info-mobile">
            {winner.mark 
              ? winner.mark === 'Draw' 
                ? "It's a Draw!" 
                : `${winner.name} Wins!`
              : `${currentPlayerName}'s Turn`}
          </div>
        <div className="game-board-container">
        <div className="game-board">
        {renderWinningLine(winningCombination)}
  {board.map((_, index) => renderCell(index, winningCombination))}
</div>
        </div>
    
        {/* Right Side - Analytics */}
        <div className="tictactoe-game-analytics">
          <div className="score-area">
            <div className="score-item">
              <span className="player-label">
                <strong>Player X</strong>
                {player1 || 'Waiting...'}
              </span>
              <span className="score-value">{score.player1}</span>
            </div>
            <div className="score-item">
              <span className="player-label">
                <strong>Player O</strong>
                {player2 || 'Waiting...'}
              </span>
              <span className="score-value">{score.player2}</span>
            </div>
          </div>
    
          <div className="game-status">
            <div>You are: {playerName}</div>
            <div>Current Turn: {currentPlayerName}</div>
            <div>Next game starts with: {!lastGameStarter ? 'Player X' : 'Player O'}</div>
          </div>
          <div className="game-info-pc">
            {winner.mark 
              ? winner.mark === 'Draw' 
                ? "It's a Draw!" 
                : `${winner.name} Wins!`
              : `${currentPlayerName}'s Turn`}
          </div>
    
          {(winner.mark || !board.includes(null)) && (
            <button className="reset-button" onClick={resetGame}>
              Play Again
            </button>
          )}
    
          {error && <div className="error">{error}</div>}
        </div>
      </div>
  );
};

export default TicTacToe;