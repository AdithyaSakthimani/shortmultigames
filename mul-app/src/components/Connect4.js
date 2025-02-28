import React, { useState, useEffect, useContext } from 'react';
import './Connect4.css';
import NoteContext from './NoteContext';

const Connect4 = () => {
  const [isRedNext, setIsRedNext] = useState(()=>{const savedSession = localStorage.getItem('gameSession');
  let savedCode = null;
  
  if (savedSession) {
    const { savedCode: code } = JSON.parse(savedSession);
    savedCode = code;
  }
  
  if (savedCode) {
    const savedTurn = JSON.parse(localStorage.getItem(`connect4_turn_${savedCode}`));
    if (savedTurn !== null) {
      return savedTurn;
    }
  }
  
  return true;} );
  const [currentColumn, setCurrentColumn] = useState(null);
  const [winner, setWinner] = useState({ mark: null, name: null });
  const [error, setError] = useState(null);
  const [playersPresent, setPlayersPresent] = useState(false);
      const [connectionError, setConnectionError] = useState(false);
  const contextValue = useContext(NoteContext);
  const socket = contextValue?.socket;
  const code = contextValue?.code;
  const playerStatus = contextValue?.playerStatus || {};
  const setPlayerStatus = contextValue?.setPlayerStatus;
  const setCode = contextValue?.setCode;
  const playerName = contextValue?.playerName;
  const setPlayerName = contextValue?.setPlayerName;

  // Initialize score from localStorage or default to 0
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem(`connect4_score_${code}`);
    return savedScore ? JSON.parse(savedScore) : { player1: 0, player2: 0 };
  });

  const player1 = playerStatus.player1;
  const player2 = playerStatus.player2;
  const currentPlayerName = isRedNext ? (player1 || 'Player 1') : (player2 || 'Player 2');
  const [board, setBoard] = useState(()=>{
  
      const savedSession = localStorage.getItem('gameSession');
      let savedCode = null;
      
      if (savedSession) {
        const { savedCode: code } = JSON.parse(savedSession);
        savedCode = code;
      }
      if (savedCode) {
        const savedBoard = JSON.parse(localStorage.getItem(`connect4_board_${savedCode}`));
        if (savedBoard) {
          return savedBoard;
        }
      }
      const initialBoard = Array(42).fill(null)
      return initialBoard;});
  // Save score to localStorage whenever it changes
  useEffect(() => {
    if (code && score) {
      localStorage.setItem(`connect4_score_${code}`, JSON.stringify(score));
    }
  }, [score, code]);
  useEffect(() => {
        if (code) {
          localStorage.setItem(`connect4_board_${code}`, JSON.stringify(board));
          localStorage.setItem(`connect4_turn_${code}`, JSON.stringify(isRedNext));
        }
      }, [board, isRedNext, code]);
      useEffect(()=>{if (code) 
        {const savedTurn = JSON.parse(localStorage.getItem(`connect4_turn_${code}`));
        if (savedTurn !== null) {
          setIsRedNext(savedTurn);
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
    if (!socket) {
      console.log('No socket connection');
      return;
    }

    socket.on('gameUpdate', (data) => {
      console.log('Received game update:', data);
      if (!data) return;
      
      setBoard(data.board);
      setIsRedNext(data.isRedNext);
      
      if (data.winner) {
        if (data.winner === 'Draw') {
          setWinner({ mark: 'Draw', name: 'Draw' });
        } else {
          const winnerMark = data.winner === player1 ? 'Red' : 'Yellow';
          setWinner({ mark: winnerMark, name: data.winner });
          
          // Update score when there's a winner
          setScore(prevScore => ({
            ...prevScore,
            [data.winner === player1 ? 'player1' : 'player2']: 
              prevScore[data.winner === player1 ? 'player1' : 'player2'] + 1
          }));
        }
      }
    });

    return () => {
      socket?.off('gameUpdate');
    };
  }, [socket, player1, player2]);

  const handleColumnClick = (column) => {
    if (!socket) {
      setError('Socket connection not available');
      return;
    }

    if (!code) {
      setError('Room code not available');
      return;
    }

    if (winner.mark) {
      console.log('Game already won');
      return;
    }

    // Check if it's the player's turn
    const isValidTurn = (isRedNext && playerName === player1) || 
                       (!isRedNext && playerName === player2);

    if (!isValidTurn) {
      console.log('Not your turn');
      return;
    }

    // Find the lowest empty cell in the column
    let row = 5;
    while (row >= 0) {
      const index = row * 7 + column;
      if (!board[index]) {
        const newBoard = [...board];
        newBoard[index] = isRedNext ? 'Red' : 'Yellow';

        socket.emit('makeMove', {
          roomId: code,
          move: { 
            type: 'connect4',
            position: index,
            board: newBoard,
            isRedNext: !isRedNext
          }
        });
        break;
      }
      row--;
    }
  };

  const handleColumnHover = (column) => {
    if (!winner.mark && ((isRedNext && playerName === player1) || (!isRedNext && playerName === player2))) {
      setCurrentColumn(column);
    }
  };

  const renderColumn = (columnIndex) => {
    const cells = [];
    for (let row = 0; row < 6; row++) {  // Reverse the order
      const index = row * 7 + columnIndex;
      cells.push(
        <div
          key={index}
          className={`connect4-cell ${
            board[index] ? `player-${board[index].toLowerCase()}` : ''
          } ${
            !board[index] && 
            currentColumn === columnIndex && 
            ((isRedNext && playerName === player1) || (!isRedNext && playerName === player2))
              ? `preview-${isRedNext ? 'red' : 'yellow'}`
              : ''
          }`}
        />
      );
    }
    return cells;
  };

  const resetGame = () => {
    if (!socket || !code) {
      setError('Cannot reset game - connection not available');
      return;
    }
    
    // Reset local state
    setWinner({ mark: null, name: null });
    
    // Emit reset move
    socket.emit('makeMove', {
      roomId: code,
      move: { 
        type: 'connect4',
        action: 'reset',
        board: Array(42).fill(null),
        isRedNext: true
      }
    });
  };

  return (
    <div className="connect-game-container">
      <div>
        <div className="game-info">
            {winner.mark
              ? winner.mark === 'Draw'
                ? "It's a Draw!"
                : `${winner.name} Wins!`
              : `${currentPlayerName}'s Turn`}
          </div>
        <div className="game-board-container">
          <div className="connect4-board">
            {Array(7).fill(null).map((_, columnIndex) => (
              <div
                key={columnIndex}
                className="connect4-column"
                onMouseEnter={() => handleColumnHover(columnIndex)}
                onMouseLeave={() => setCurrentColumn(null)}
                onClick={() => handleColumnClick(columnIndex)}
              >
                {renderColumn(columnIndex)}
              </div>
            ))}
          </div>
        </div>
      </div>
  
      {/* Right Side - Analytics */}
      <div className="connect-game-analytics">
        <div className="connect-score-board">
          <div className="connect-score-item">
            <span className="player-label">
              <strong>Player Red</strong>
              {player1 || 'Waiting...'}
            </span>
            <span className="score-value">{score.player1}</span>
          </div>
          <div className="connect-score-item">
            <span className="player-label">
              <strong>Player Yellow</strong>
              {player2 || 'Waiting...'}
            </span>
            <span className="score-value">{score.player2}</span>
          </div>
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

export default Connect4;