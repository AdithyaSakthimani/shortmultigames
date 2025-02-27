
  
  const initializeGameState = (gameType) => {
    const baseState = {
      player1: null,
      player2: null,
      gameInProgress: false
    };
  
    if (gameType === 'tictactoe') {
      return {
        ...baseState,
        board: Array(9).fill(null),
        isXNext: true
      };
    } else if (gameType === 'connect4') {
      return {
        ...baseState,
        board: Array(42).fill(null),
        isRedNext: true
      };
    } else if (gameType === 'rps') {
      return {
        ...baseState,
        player1Choice: null,
        player2Choice: null,
        result: null
      };
    } else if (gameType === 'othello') {

        const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
        newBoard[3][3] = 'white';
        newBoard[3][4] = 'black';
        newBoard[4][3] = 'black';
        newBoard[4][4] = 'white';
        
        return {
          board: newBoard,
          isBlackNext: true,
          gameInProgress: false,
          player1: null,
          player2: null,
         
        };
    } 
    if (gameType === 'battleship') {
        return {
          ...baseState,
          player1Board: Array(10).fill().map(() => Array(10).fill(null)), // Player 1's own board
          player2Board: Array(10).fill().map(() => Array(10).fill(null)), // Player 2's own board
          player1OpponentBoard: Array(10).fill().map(() => Array(10).fill(null)), // Player 1's view of Player 2's board
          player2OpponentBoard: Array(10).fill().map(() => Array(10).fill(null)), // Player 2's view of Player 1's board
          player1ShipsPlaced: false,
          player2ShipsPlaced: false,
          currentPlayer: null,
          phase: 'setup', // setup, placement, playing, ended
          winner: null
        };
      } else {
      throw new Error(`Unknown game type: ${gameType}`);
    }
  };
  module.exports = initializeGameState;
  