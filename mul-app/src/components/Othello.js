import React, { useState, useEffect, useContext } from 'react';
import NoteContext from './NoteContext';
import './Othello.css';

const Othello = () => {
  const [board, setBoard] = useState(Array(8).fill(null).map(() => Array(8).fill(null)));
  const [isBlackNext, setIsBlackNext] = useState(true);
  const [winner, setWinner] = useState({ player: null, name: null });
  const [error, setError] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [mustSkip, setMustSkip] = useState(false);

  const contextValue = useContext(NoteContext);
  const socket = contextValue?.socket;
  const code = contextValue?.code;
  const playerStatus = contextValue?.playerStatus || {};
  const playerName = contextValue?.playerName;

  const player1 = playerStatus.player1;
  const player2 = playerStatus.player2;
  const currentPlayerName = isBlackNext ? (player1 || 'Player 1') : (player2 || 'Player 2');
  const checkValidMoves = (currentBoard, isBlack) => {
    const color = isBlack ? 'black' : 'white';
    const valid = [];
  
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (getFlippablePieces(currentBoard, row, col, color).length > 0) {
          valid.push([row, col]);
        }
      }
    }
    return valid;
  };
  
  useEffect(() => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    newBoard[3][3] = 'white';
    newBoard[3][4] = 'black';
    newBoard[4][3] = 'black';
    newBoard[4][4] = 'white';
    setBoard(newBoard);
    checkAndUpdateValidMoves(newBoard, true);
  }, []);

  useEffect(() => {
    if (!socket) {
      console.log('No socket connection');
      return;
    }

    socket.on('gameUpdate', (data) => {
      console.log('Received game update:', data);
      if (!data) return;

      setBoard(data.board);
      setIsBlackNext(data.isBlackNext);
      checkAndUpdateValidMoves(data.board, data.isBlackNext);
      if (data.winner) {
        setWinner({ player: data.winner, name: data.winner === 'black' ? player1 : player2 });
      }
    });

    return () => {
      socket?.off('gameUpdate');
    };
  }, [socket, player1, player2]);

  const getOppositeColor = (color) => (color === 'black' ? 'white' : 'black');
  const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  const getFlippablePieces = (board, row, col, color) => {
    if (!isValidPosition(row, col) || board[row][col] !== null) return [];

    const flippable = [];
    const oppositeColor = getOppositeColor(color);

    for (const [dx, dy] of directions) {
      let currentRow = row + dx;
      let currentCol = col + dy;
      const temp = [];

      while (
        isValidPosition(currentRow, currentCol) &&
        board[currentRow][currentCol] === oppositeColor
      ) {
        temp.push([currentRow, currentCol]);
        currentRow += dx;
        currentCol += dy;
      }

      if (
        temp.length > 0 &&
        isValidPosition(currentRow, currentCol) &&
        board[currentRow][currentCol] === color
      ) {
        flippable.push(...temp);
      }
    }
    return flippable;
  };

  const checkAndUpdateValidMoves = (currentBoard, isBlack) => {
    const color = isBlack ? 'black' : 'white';
    const valid = [];

    // Check for valid moves
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (getFlippablePieces(currentBoard, row, col, color).length > 0) {
          valid.push([row, col]);
        }
      }
    }

    setValidMoves(valid);

    // If no valid moves are available, set mustSkip to true
    if (valid.length === 0) {
      setMustSkip(true);
      // Find empty spaces for placing the piece
      const emptySpaces = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (currentBoard[row][col] === null) {
            emptySpaces.push([row, col]);
          }
        }
      }
      setValidMoves(emptySpaces);
    } else {
      setMustSkip(false);
    }
  };

  const calculateWinner = (board) => {
    let blackCount = 0;
    let whiteCount = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === 'black') blackCount++;
        else if (board[row][col] === 'white') whiteCount++;
      }
    }

    if (blackCount === whiteCount) return 'Draw';
    return blackCount > whiteCount ? 'black' : 'white';
  };

  const handleCellClick = (row, col) => {
    if (!socket || !code) {
      setError('Socket connection or room code not available');
      return;
    }
    if (winner.player) return;
  
    const isValidTurn = (isBlackNext && playerName === player1) || (!isBlackNext && playerName === player2);
    if (!isValidTurn) return;
  
    const currentColor = isBlackNext ? 'black' : 'white';
    const newBoard = board.map(row => [...row]);
  
    const flippablePieces = getFlippablePieces(board, row, col, currentColor);
    if (flippablePieces.length === 0) return;
  
    newBoard[row][col] = currentColor;
    flippablePieces.forEach(([r, c]) => (newBoard[r][c] = currentColor));
  
    // Check if current player has any valid moves left
    const nextPlayerHasMoves = checkValidMoves(newBoard, !isBlackNext).length > 0;
    const currentPlayerHasMoves = checkValidMoves(newBoard, isBlackNext).length > 0;
  
    let gameWinner = null;
    
    if (!nextPlayerHasMoves && !currentPlayerHasMoves) {
      gameWinner = calculateWinner(newBoard);
    }
  
    socket.emit('makeMove', {
      roomId: code,
      move: {
        type: 'othello',
        board: newBoard,
        isBlackNext: nextPlayerHasMoves ? !isBlackNext : isBlackNext, // Skip turn if no moves
        position: { row, col },
        winner: gameWinner
      }
    });
  
    setBoard(newBoard);
    setIsBlackNext(nextPlayerHasMoves ? !isBlackNext : isBlackNext);
  
    if (gameWinner) {
      setWinner({ player: gameWinner, name: gameWinner === 'black' ? player1 : player2 });
    }
  };
  

  return (
    <div className="othello-container">
      <div className="othello-game-status">
        {error && <div className="error">{error}</div>}
        {winner.player
          ? winner.player === 'Draw'
            ? "It's a Draw!"
            : `${winner.name} Wins!`
          : `${currentPlayerName}'s Turn (${isBlackNext ? 'Black' : 'White'})${mustSkip ? ' - No valid moves, place piece to skip turn' : ''}`}
      </div>
      <div className="othello-board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              className={`board-cell ${cell === 'black' ? 'piece-black' : cell === 'white' ? 'piece-white' : ''}
                ${validMoves.some(([r, c]) => r === rowIndex && c === colIndex) ? 'valid-move' : ''}`}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Othello;