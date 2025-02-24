// index.js
import React, { useContext } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import HomePage from './HomePage';
import reportWebVitals from './reportWebVitals';
import NoteState from './components/NoteState';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import TicTacToe from './components/TicTacToe';
import Connect4 from './components/Connect4';
import GameRoom from './components/GameRoom';
import RockPaperScissors from './components/RockPaperScissors';
import HomeArea from './HomeArea';
const root = ReactDOM.createRoot(document.getElementById('root'));

const NavFunc = () => {
  return (
    <>
     {/*<Navbar />*/}
      <div>
        <Routes>
          <Route path="/" element={<HomeArea />} />
          <Route path="/rooms" element={<HomePage />} />
          <Route path="/connect4" element={<Connect4/>} />
          <Route path="/tictactoe" element={<TicTacToe/>} />
          <Route path="/gameroom" element={<GameRoom/>} />
          <Route path="/rockpaperscissors" element={<RockPaperScissors/>} />
        </Routes>
      </div>
      {/*<Navbar />*/}
    </>
  );
};

root.render(
  <React.StrictMode>
    <NoteState>
      <Router>
        <NavFunc />
      </Router>
    </NoteState>
  </React.StrictMode>
);

reportWebVitals();