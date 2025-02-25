const calculateRPSWinner = (player1Choice, player2Choice) => {
    if (player1Choice === player2Choice) return 'Draw';
  
    const winningConditions = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    };
  
    return winningConditions[player1Choice] === player2Choice ? 'player1' : 'player2';
  };
  module.exports = calculateRPSWinner;