import React, { useState, useEffect, useContext } from 'react';
import { X, Circle } from 'lucide-react';
import './TicTacToe.css';
import NoteContext from './NoteContext';

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState({ mark: null, name: null });
  const [error, setError] = useState(null);
  
  const contextValue = useContext(NoteContext);
  const socket = contextValue?.socket;
  const code = contextValue?.code;
  const playerStatus = contextValue?.playerStatus || {};
  const playerName = contextValue?.playerName;

  // Initialize score from localStorage or default to 0
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem(`tictactoe_score_${code}`);
    return savedScore ? JSON.parse(savedScore) : { player1: 0, player2: 0 };
  });

  const player1 = playerStatus.player1;
  const player2 = playerStatus.player2;
  const currentPlayerName = isXNext ? (player1 || 'Player 1') : (player2 || 'Player 2');

  // Save score to localStorage whenever it changes
  useEffect(() => {
    if (code && score) {
      localStorage.setItem(`tictactoe_score_${code}`, JSON.stringify(score));
    }
  }, [score, code]);

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

  const renderCell = (index) => {
    const cellValue = board[index];
    const isCurrentPlayer = (isXNext && playerName === player1) || 
                          (!isXNext && playerName === player2);

    return (
      <div 
        key={index}
        className={`cell ${isCurrentPlayer ? 'active' : ''}`}
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
    
    setWinner({ mark: null, name: null });
    
    socket.emit('makeMove', {
      roomId: code,
      move: { 
        type: 'tictactoe',
        action: 'reset',
        board: Array(9).fill(null),
        isXNext: true
      }
    });
  };

  return (
      <div className="game-container">
        {/* Left Side - Game Board */}
        <div className="game-board-container">
          <div className="game-board">
            {board.map((_, index) => renderCell(index))}
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
          </div>
    
          <div className="game-info">
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