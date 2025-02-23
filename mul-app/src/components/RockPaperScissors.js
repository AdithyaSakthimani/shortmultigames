import React, { useState, useContext, useEffect } from 'react';
import NoteContext from './NoteContext';
import './RockPaperScissors.css'
const RockPaperScissors = () => {
  const [choice, setChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [gameState, setGameState] = useState('choosing');
  
  const [scores, setScores] = useState(() => {
    try {
      const savedScores = localStorage.getItem('rpsScores');
      return savedScores ? JSON.parse(savedScores) : {
        player1: {
          name: '',
          wins: 0,
          losses: 0,
          draws: 0
        },
        player2: {
          name: '',
          wins: 0,
          losses: 0,
          draws: 0
        }
      };
    } catch (error) {
      console.error('Error loading scores from localStorage:', error);
      return {
        player1: { name: '', wins: 0, losses: 0, draws: 0 },
        player2: { name: '', wins: 0, losses: 0, draws: 0 }
      };
    }
  });

  const contextValue = useContext(NoteContext);
  const socket = contextValue?.socket;
  const code = contextValue?.code;
  const playerName = contextValue?.playerName;
  const playerStatus = contextValue?.playerStatus || {};

  useEffect(() => {
    if (playerStatus.player1 || playerStatus.player2) {
      setScores(prevScores => {
        const newScores = {
          player1: {
            ...prevScores.player1,
            name: playerStatus.player1 || ''
          },
          player2: {
            ...prevScores.player2,
            name: playerStatus.player2 || ''
          }
        };
        localStorage.setItem('rpsScores', JSON.stringify(newScores));
        return newScores;
      });
    }
  }, [playerStatus]);

  useEffect(() => {
    if (!socket) return;

    socket.on('gameUpdate', (data) => {
      if (data.player1Choice && data.player2Choice) {
        setOpponent(playerName === playerStatus.player1 ? data.player2Choice : data.player1Choice);
        setGameState('finished');
        setResult(data.result);
        
        setScores(prevScores => {
          const newScores = {
            player1: { ...prevScores.player1 },
            player2: { ...prevScores.player2 }
          };
          
          if (data.result === 'Draw') {
            newScores.player1.draws = (newScores.player1.draws || 0) + 1;
            newScores.player2.draws = (newScores.player2.draws || 0) + 1;
          } else {
            const winner = data.result === playerStatus.player1 ? 'player1' : 'player2';
            const loser = winner === 'player1' ? 'player2' : 'player1';
            
            newScores[winner].wins = (newScores[winner].wins || 0) + 1;
            newScores[loser].losses = (newScores[loser].losses || 0) + 1;
          }
          
          localStorage.setItem('rpsScores', JSON.stringify(newScores));
          return newScores;
        });
      }
    });

    return () => {
      socket.off('gameUpdate');
    };
  }, [socket, playerName, playerStatus]);

  const handleChoice = (selectedChoice) => {
    if (!socket || !code || !playerName || gameState !== 'choosing') return;

    setChoice(selectedChoice);
    setGameState('waiting');
    
    socket.emit('makeMove', {
      roomId: code,
      move: {
        type: 'rps',
        player: playerName === playerStatus.player1 ? 'player1' : 'player2',
        choice: selectedChoice
      }
    });
  };

  const resetGame = () => {
    if (!socket || !code) return;
    
    socket.emit('makeMove', {
      roomId: code,
      move: {
        type: 'rps',
        action: 'reset'
      }
    });
    
    setChoice(null);
    setOpponent(null);
    setResult(null);
    setGameState('choosing');
  };



  const getResultMessage = () => {
    if (!result) return '';
    if (result === 'Draw') return "It's a Draw!";
    return `${result} Wins!`;
  };

  const PlayerScoreCard = ({ playerData = {}, playerNumber }) => {
    const safePlayerData = {
      name: playerData?.name || '',
      wins: playerData?.wins || 0,
      losses: playerData?.losses || 0,
      draws: playerData?.draws || 0
    };

    const isCurrentPlayer = playerName === safePlayerData.name;
    
    // Add a class to handle responsive visibility
    const cardClasses = `player-score-card 
      ${isCurrentPlayer ? 'current-player' : 'opponent-card'}`;

    return (
      <div className={cardClasses}>
        <h3 className="player-name">
          {safePlayerData.name || `Player ${playerNumber}`}
          {isCurrentPlayer && <span className="you-badge">You</span>}
        </h3>
        <div className="score-details">
          <div className="score-item">
            <span className="score-label">Wins</span>
            <span className="score-value wins">{safePlayerData.wins}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Draws</span>
            <span className="score-value draws">{safePlayerData.draws}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Losses</span>
            <span className="score-value losses">{safePlayerData.losses}</span>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="rps-container">
      <div className='hero-area'>
        <h2>Rock Paper Scissors</h2>
        <div className="score-board">
        <PlayerScoreCard 
          playerData={scores?.player1} 
          playerNumber={1} 
        />
        <div className="score-divider">VS</div>
        <PlayerScoreCard 
          playerData={scores?.player2} 
          playerNumber={2} 
        />
      </div>
        <div className="choices">
          <button
            className={`choice-btn ${choice === 'rock' ? 'selected' : ''}`}
            onClick={() => handleChoice('rock')}
            disabled={gameState !== 'choosing'}
          >
            🪨 Rock
          </button>
          <button
            className={`choice-btn ${choice === 'paper' ? 'selected' : ''}`}
            onClick={() => handleChoice('paper')}
            disabled={gameState !== 'choosing'}
          >
            📄 Paper
          </button>
          <button
            className={`choice-btn ${choice === 'scissors' ? 'selected' : ''}`}
            onClick={() => handleChoice('scissors')}
            disabled={gameState !== 'choosing'}
          >
            ✂️ Scissors
          </button>
        </div>
        {gameState === 'finished' && (
          <button className="reset-btn" onClick={resetGame}>
            Play Again
          </button>
        )}
      </div>
      <div className="game-status">
          {gameState === 'choosing' && <p>Make your choice!</p>}
          {gameState === 'waiting' && <p>Waiting for opponent...</p>}
          {gameState === 'finished' && (
            <div className="result-display">
              <p>Your choice: {choice}</p>
              <p>Opponent's choice: {opponent}</p>
              <p className="result-message">{getResultMessage()}</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default RockPaperScissors;