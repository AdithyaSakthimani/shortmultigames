import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import NoteContext from './components/NoteContext';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { setCode, playerName, setPlayerName, socket } = useContext(NoteContext);
  const [genCode, setGenCode] = useState('');
  const [inputCode, setInputCode] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('getCode', (myCode) => {
      console.log('Received Room Code:', myCode);
      setGenCode(myCode);
    });

    socket.on('roomJoined', (response) => {
      console.log('Room join response:', response);
      if (response.success) {
        setCode(inputCode);
        navigate('/GameRoom');
      } else {
        alert(response.error);
      }
    });

    return () => {
      socket.off('getCode');
      socket.off('roomJoined');
    };
  }, [socket, navigate, setCode, inputCode]);

  const createRoom = () => {
    if (!socket) return;
    socket.emit('createRoom');
  };

  const joinRoom = () => {
    if (!socket || !playerName || !inputCode) {
      alert('Please enter both player name and room code');
      return;
    }
    socket.emit('joinRoom', playerName, inputCode);
  };

  return (
    <div className="hompage-container">
      <div className="box">
        <h2 className="rooms-title">Create Room</h2>
        <h3 className="sub-title">Generate a custom room to play games with your friends</h3>
        <button className="rooms-button" onClick={createRoom}>
          Create
        </button>
        {genCode && <p className="gen-room-code">Room code: <span>{genCode}</span></p>}
      </div>

      <div className="box">
        <h2 className="rooms-title">Join Room</h2>
        <h3 className="sub-title">Join a custom room to play games with your friends</h3>
        <div className="input-group">
          <label>Player Name</label>
          <input
            className="input-field"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div className="input-group">
          <label>Room Code</label>
          <input
            className="input-field"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Enter room code"
          />
        </div>
        <button className="button join-button" onClick={joinRoom}>
          Join
        </button>
      </div>
    </div>
  );
}

export default HomePage;
