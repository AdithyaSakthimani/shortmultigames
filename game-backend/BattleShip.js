const handleBattleshipMove = (io,room, move, player, roomId, socket) => {
    if (!room.player1OpponentBoard) {
      room.player1OpponentBoard = Array(10).fill().map(() => Array(10).fill(null));
    }
    if (!room.player2OpponentBoard) {
      room.player2OpponentBoard = Array(10).fill().map(() => Array(10).fill(null));
    }
    if (move.action === 'ready') {
      // Player is ready after placing all ships
      if (player === room.player1) {
        room.player1Board = move.board;
        room.player1ShipsPlaced = true;
      } else if (player === room.player2) {
        room.player2Board = move.board;
        room.player2ShipsPlaced = true;
      }
  
      // Check if both players are ready
      if (room.player1ShipsPlaced && room.player2ShipsPlaced) {
        room.phase = 'playing';
        room.currentPlayer = room.player1; // Player 1 starts first
  
        // Notify both players that the game is starting
        io.to(roomId).emit('gameUpdate', {
          type: 'battleship',
          action: 'phaseChange',
          phase: room.phase,
          playerTurn: room.currentPlayer
        });
      } else {
        // Notify the current player that they are waiting for the opponent
        socket.emit('gameUpdate', {
          type: 'battleship',
          action: 'phaseChange',
          phase: 'placement', // Still waiting for the opponent
          playerTurn: null
        });
      }
    } else if (move.action === 'fire') {
      const { row, col } = move;
      const opponentBoard = player === room.player1 ? room.player2Board : room.player1Board;
      const playerOpponentBoard = player === room.player1 ? room.player1OpponentBoard : room.player2OpponentBoard;
  
      // Check the opponent's board to determine if it's a hit or miss
      const cell = opponentBoard[row][col];
      console.log(playerOpponentBoard)
      if (cell === null) {
        // Miss
        playerOpponentBoard[row][col] = 'miss'; // Record the miss on the player's opponent board
        io.to(roomId).emit('gameUpdate', {
          type: 'battleship',
          action: 'shotResult',
          row,
          col,
          result: 'miss',
          nextTurn: player === room.player1 ? room.player2 : room.player1,
          player: player // Include the player who fired the shot
        });
      } else if (cell !== 'hit' && cell !== 'miss') {
        // Hit
        playerOpponentBoard[row][col] = 'hit'; // Record the hit on the player's opponent board
        opponentBoard[row][col] = 'hit';
        io.to(roomId).emit('gameUpdate', {
          type: 'battleship',
          action: 'shotResult',
          row,
          col,
          result: 'hit',
          nextTurn: player === room.player1 ? room.player2 : room.player1,
          player: player // Include the player who fired the shot
        });
  
        // Check if all ships are sunk
        if (checkAllShipsSunk(opponentBoard , playerOpponentBoard)) {
          room.winner = player;
          room.phase = 'ended';
          io.to(roomId).emit('gameUpdate', {
            type: 'battleship',
            action: 'gameEnd',
            winner: player
          });
        }
      }
    } else if (move.action === 'reset') {
      // Reset the game state
      const newState = initializeGameState('battleship');
      rooms[roomId] = {
        ...newState,
        player1: room.player1,
        player2: room.player2
      };
      io.to(roomId).emit('gameUpdate', {
        type: 'battleship',
        action: 'resetGame'
      });
    }
    if (move.action === 'updateScore') {
      // Store the score in the room
      room.battleshipScore = move.score;
      
      // Broadcast the score to all players in the room
      io.to(roomId).emit('gameUpdate', {
        type: 'battleship',
        action: 'scoreUpdate',
        score: move.score
      });
    }
  };
  
  const checkAllShipsSunk = (opponentBoard, playerOpponentBoard) => {
    // Check all cells on the opponent's board
    for (let row = 0; row < opponentBoard.length; row++) {
      for (let col = 0; col < opponentBoard[row].length; col++) {
        const opponentCell = opponentBoard[row][col];
        const playerViewCell = playerOpponentBoard[row][col];
        
        // If this cell contains a ship (not null, not 'hit', not 'miss')
        if (opponentCell && opponentCell !== 'hit' && opponentCell !== 'miss') {
          return false;
        }
      }
    }
    // If all ship cells have been hit, all ships are sunk
    return true;
  };
  module.exports = {handleBattleshipMove,checkAllShipsSunk};