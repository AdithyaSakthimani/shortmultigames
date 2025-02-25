const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const calculateConnect4Winner = require('./Connect4Func.js');
const calculateTicTacToeWinner = require('./TicTacToeFunc.js');
const calculateRPSWinner = require('./RPSFunc.js');
const initializeGameState  = require('./InitGames.js');
const{handleBattleshipMove,checkAllShipsSunk} = require('./BattleShip.js')
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

let rooms = {};
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('createRoom', (gameType = 'tictactoe') => {
    const roomCode = Math.random().toString(36).substr(2, 5);
    rooms[roomCode] = initializeGameState(gameType);
    socket.emit('getCode', roomCode);
    console.log(`Room created: ${roomCode} for ${gameType}`);
  });
  socket.on('joinRoom', (name, roomCode) => {
    console.log(`Attempting to join room ${roomCode} as ${name}`);
    console.log('Current room state:', rooms[roomCode]);

    if (!rooms[roomCode]) {
      console.log('Room not found');
      socket.emit("roomJoined", { success: false, error: "Room not found" });
      return;
    }

    let room = rooms[roomCode];

    // Log current players
    console.log('Current players:', {
      player1: room.player1,
      player2: room.player2
    });

    if (room.player1 === name || room.player2 === name) {
      console.log('Player already in room');
      // If it's a reconnection, we should allow it
      socket.join(roomCode);
      socket.emit("roomJoined", { success: true, roomCode });
      io.to(roomCode).emit('playerStatus', {
        player1: room.player1,
        player2: room.player2
      });
      return;
    }

    let assigned = false;

    if (!room.player1) {
      room.player1 = name;
      assigned = true;
      console.log(`Assigned ${name} as player1`);
    } else if (!room.player2) {
      room.player2 = name;
      assigned = true;
      console.log(`Assigned ${name} as player2`);
    }

    if (assigned) {
      socket.join(roomCode);
      socket.emit("roomJoined", { success: true, roomCode });

      io.to(roomCode).emit('playerStatus', {
        player1: room.player1,
        player2: room.player2
      });

      io.to(roomCode).emit('gameUpdate', {
        board: room.board,
        isXNext: room.isXNext,
        isRedNext: room.isRedNext,
        isBlackNext: room.isBlackNext,
        player1Choice: room.player1Choice,
        player2Choice: room.player2Choice
      });
    } else {
      console.log('Room is full');
      socket.emit("roomJoined", { success: false, error: "Room is full" });
    }
  });

  socket.on('makeMove', ({ roomId, move }) => {
    if (!rooms[roomId]) return;

    const room = rooms[roomId];

    if (move.action === 'reset') {
      const gameType = move.type;
      const newState = initializeGameState(gameType);
      rooms[roomId] = {
        ...newState,
        player1: room.player1,
        player2: room.player2,
        gameInProgress: true
      };

      io.to(roomId).emit('gameUpdate', {
        board: rooms[roomId].board,
        isXNext: rooms[roomId].isXNext,
        isRedNext: rooms[roomId].isRedNext,
        isBlackNext: rooms[roomId].isBlackNext,
        player1Choice: rooms[roomId].player1Choice,
        player2Choice: rooms[roomId].player2Choice
      });
      return;
    }

    if (!room.gameInProgress && room.player1 && room.player2) {
      room.gameInProgress = true;
    }

    if (!room.gameInProgress) return;

    // Handle Tic-Tac-Toe moves
    if (move.type === 'tictactoe') {
      room.board = move.board;
      room.isXNext = move.isXNext;

      const winner = calculateTicTacToeWinner(room.board);
      const isDraw = !room.board.includes(null);

      io.to(roomId).emit('gameUpdate', {
        board: room.board,
        isXNext: room.isXNext,
        winner: winner ? (winner === 'X' ? room.player1 : room.player2) : (isDraw ? 'Draw' : null)
      });

      if (winner || isDraw) {
        room.gameInProgress = false;
      }
    }

    // Handle Connect4 moves
    else if (move.type === 'connect4') {
      room.board = move.board;
      room.isRedNext = move.isRedNext;

      const winner = calculateConnect4Winner(room.board);
      const isDraw = !room.board.includes(null);

      io.to(roomId).emit('gameUpdate', {
        board: room.board,
        isRedNext: room.isRedNext,
        winner: winner ? (winner === 'Red' ? room.player1 : room.player2) : (isDraw ? 'Draw' : null)
      });

      if (winner || isDraw) {
        room.gameInProgress = false;
      }
    }

    // Handle Rock-Paper-Scissors moves
    else if (move.type === 'rps') {
      if (move.player === 'player1') {
        room.player1Choice = move.choice;
      } else if (move.player === 'player2') {
        room.player2Choice = move.choice;
      }

      if (room.player1Choice && room.player2Choice) {
        const winner = calculateRPSWinner(room.player1Choice, room.player2Choice);
        room.result = winner === 'Draw' ? 'Draw' : room[winner];

        io.to(roomId).emit('gameUpdate', {
          player1Choice: room.player1Choice,
          player2Choice: room.player2Choice,
          result: room.result
        });

        room.gameInProgress = false;
      }
    }
  else if (move.type === 'othello') {
  room.board = move.board;
  room.isBlackNext = move.isBlackNext;
  if (move.winner) {
    io.to(roomId).emit('gameUpdate', {
      board: room.board,
      isBlackNext: room.isBlackNext,
      winner: move.winner
    });
    room.gameInProgress = false;
  } else {
    io.to(roomId).emit('gameUpdate', {
      board: room.board,
      isBlackNext: room.isBlackNext,
      winner: null
    });
  }
} 
  else if (move.type === 'battleship'){
    handleBattleshipMove(io,room, move, move.player,roomId,socket);
    return;
  }
  });

  socket.on('leaveRoom', (roomCode, name) => {
    if (!rooms[roomCode]) return;

    let room = rooms[roomCode];

    if (room.player1 === name) {
      room.player1 = null;
    } else if (room.player2 === name) {
      room.player2 = null;
    }

    const gameType = room.board.length === 9 ? 'tictactoe' : 'connect4';
    const newState = initializeGameState(gameType);
    rooms[roomCode] = {
      ...newState,
      player1: room.player1,
      player2: room.player2
    };

    if (!room.player1 && !room.player2) {
      delete rooms[roomCode];
      console.log(`Room ${roomCode} deleted`);
    } else {
      io.to(roomCode).emit('playerStatus', {
        player1: room.player1,
        player2: room.player2
      });

      io.to(roomCode).emit('gameUpdate', {
        board: room.board,
        isXNext: room.isXNext,
        isRedNext: room.isRedNext
      });
    }

    socket.leave(roomCode);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));