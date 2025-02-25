const calculateConnect4Winner = (squares) => {
    // Check horizontal
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const index = row * 7 + col;
        if (squares[index] &&
            squares[index] === squares[index + 1] &&
            squares[index] === squares[index + 2] &&
            squares[index] === squares[index + 3]) {
          return squares[index];
        }
      }
    }
  
    // Check vertical
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 7; col++) {
        const index = row * 7 + col;
        if (squares[index] &&
            squares[index] === squares[index + 7] &&
            squares[index] === squares[index + 14] &&
            squares[index] === squares[index + 21]) {
          return squares[index];
        }
      }
    }
  
    // Check diagonal (positive slope)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const index = row * 7 + col;
        if (squares[index] &&
            squares[index] === squares[index + 8] &&
            squares[index] === squares[index + 16] &&
            squares[index] === squares[index + 24]) {
          return squares[index];
        }
      }
    }
  
    // Check diagonal (negative slope)
    for (let row = 3; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const index = row * 7 + col;
        if (squares[index] &&
            squares[index] === squares[index - 6] &&
            squares[index] === squares[index - 12] &&
            squares[index] === squares[index - 18]) {
          return squares[index];
        }
      }
    }
  
    return null;
  };
module.exports = calculateConnect4Winner;