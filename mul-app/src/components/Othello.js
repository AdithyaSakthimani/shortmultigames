import React, { useState, useEffect, useContext } from 'react';
import NoteContext from './NoteContext';
import './Othello.css';

const Othello = () => {
  const [isBlackNext, setIsBlackNext] = useState(true);
  const [winner, setWinner] = useState({ player: null, name: null });
  const [error, setError] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [mustSkip, setMustSkip] = useState(false);
  const [score, setScore] = useState({ player1: 0, player2: 0 }); 
  const [playersPresent, setPlayersPresent] = useState(false);
    const [connectionError, setConnectionError] = useState(false);
  const contextValue = useContext(NoteContext);
  const socket = contextValue?.socket;
  const code = contextValue?.code;
  const setPlayerName = contextValue?.setPlayerName;
  const setCode = contextValue?.setCode;
  const setPlayerCode = contextValue?.setPlayerCode;
  const playerStatus = contextValue?.playerStatus || {};
  const playerName = contextValue?.playerName;
  const setPlayerStatus = contextValue?.setPlayerStatus;
  

  const player1 = playerStatus.player1;
  const player2 = playerStatus.player2;
  const currentPlayerName = isBlackNext ? (player1 || 'Player 1') : (player2 || 'Player 2');
  const [board, setBoard] = useState(() => {
    const savedSession = localStorage.getItem('gameSession');
    let savedCode = null;
    
    if (savedSession) {
      const { savedCode: code } = JSON.parse(savedSession);
      savedCode = code;
    }
    
    // If we have a code, try to load the saved board
    if (savedCode) {
      const savedBoard = JSON.parse(localStorage.getItem(`othello_board_${savedCode}`));
      if (savedBoard) {
        return savedBoard;
      }
    }
    
    // Otherwise, create a new board with initial positions
    const initialBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    initialBoard[3][3] = 'white';
    initialBoard[3][4] = 'black';
    initialBoard[4][3] = 'black';
    initialBoard[4][4] = 'white';
    return initialBoard;
  });
  useEffect(() => {
    if (code) {
      localStorage.setItem(`othello_board_${code}`, JSON.stringify(board));
      localStorage.setItem(`othello_turn_${code}`, JSON.stringify(isBlackNext));
    }
  }, [board, isBlackNext, code]);
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
  
  // Get piece counts for display purposes
  const getPieceCounts = (currentBoard) => {
    let blackCount = 0;
    let whiteCount = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (currentBoard[row][col] === 'black') blackCount++;
        else if (currentBoard[row][col] === 'white') whiteCount++;
      }
    }

    return { blackCount, whiteCount };
  };
  
  useEffect(() => {
    if (code) {
      const savedBoard = JSON.parse(localStorage.getItem(`othello_board_${code}`));
      const savedTurn = JSON.parse(localStorage.getItem(`othello_turn_${code}`));
      
      if (savedBoard) {
        setBoard(savedBoard);
      } else {
        // Create new board with initial setup if no saved board exists
        const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
        newBoard[3][3] = 'white';
        newBoard[3][4] = 'black';
        newBoard[4][3] = 'black';
        newBoard[4][4] = 'white';
        setBoard(newBoard);
      }
      
      // Restore the turn if it exists, otherwise default to true (black's turn)
      if (savedTurn !== null) {
        setIsBlackNext(savedTurn);
      }
      
      // Check valid moves based on the loaded board and turn
      const boardToCheck = savedBoard || board;
      checkAndUpdateValidMoves(boardToCheck, savedTurn !== null ? savedTurn : isBlackNext);
    }
    
    // Load saved scores if they exist
    if (code) {
      const savedScores = localStorage.getItem(`othello-scores-${code}`);
      if (savedScores) {
        setScore(JSON.parse(savedScores));
      }
    }
  }, [code]);

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
      if (code) {
        localStorage.setItem(`othello_board_${code}`, JSON.stringify(data.board));
        localStorage.setItem(`othello_turn_${code}`, JSON.stringify(data.isBlackNext));
      }
      // Update win scores if provided in the game update
      if (data.score) {
        setScore(data.score);
        localStorage.setItem(`othello-scores-${code}`, JSON.stringify(data.score));
      }
      
      checkAndUpdateValidMoves(data.board, data.isBlackNext);
      if (data.winner) {
        setWinner({ player: data.winner, name: data.winner === 'black' ? player1 : player2 });
      }
    });

    return () => {
      socket?.off('gameUpdate');
    };
  }, [socket, player1, player2, code]);

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
    let updatedScore = { ...score };
    
    if (!nextPlayerHasMoves && !currentPlayerHasMoves) {
      gameWinner = calculateWinner(newBoard);
      
      // Update win counter if there's a winner (not a draw)
      if (gameWinner !== 'Draw') {
        if (gameWinner === 'black') {
          updatedScore.player1 += 1;
        } else {
          updatedScore.player2 += 1;
        }
        setScore(updatedScore);
        localStorage.setItem(`othello-scores-${code}`, JSON.stringify(updatedScore));
      }
    }
  
    socket.emit('makeMove', {
      roomId: code,
      move: {
        type: 'othello',
        board: newBoard,
        isBlackNext: nextPlayerHasMoves ? !isBlackNext : isBlackNext, // Skip turn if no moves
        position: { row, col },
        winner: gameWinner,
        score: updatedScore
      }
    });
  
    setBoard(newBoard);
    setIsBlackNext(nextPlayerHasMoves ? !isBlackNext : isBlackNext);
  
    if (gameWinner) {
      setWinner({ player: gameWinner, name: gameWinner === 'black' ? player1 : player2 });
    }
  };
  
  // Reset game but keep scores
  const handleReset = () => {
    if (!socket || !code) {
      setError('Socket connection or room code not available');
      return;
    }
    
    socket.emit('makeMove', {
      roomId: code,
      move: {
        type: 'othello',
        action: 'reset',
        score: score // Maintain current scores
      }
    });
  };
  
  // Get current piece counts for display
  const { blackCount, whiteCount } = getPieceCounts(board);
  
  return (
    <div className="othello-container">
      <div className='othello-area'>
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
        <div className="current-count">
          Current pieces: Black: {blackCount} | White: {whiteCount}
        </div>
        <div className="score-area">
          <div className="score-item">
            <span className="player-label">
              <strong>{player1 || 'Player 1'} (Black)</strong>
            </span>
            <span className="score-value">{score.player1} wins</span>
          </div>
          <div className="score-item">
            <span className="player-label">
              <strong>{player2 || 'Player 2'} (White)</strong>
            </span>
            <span className="score-value">{score.player2} wins</span>
          </div>
        </div>
        {winner.player && (
          <button 
            className="reset-button" 
            onClick={handleReset}
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
};

export default Othello;