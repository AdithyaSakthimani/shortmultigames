import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import NoteContext from './components/NoteContext';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { setCode, playerName, setPlayerName, socket } = useContext(NoteContext);
  const [genCode, setGenCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [buttonClicked, setButtonClicked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const[roomToggle,setRoomToggle] = useState(false) ;
  const[publicPlayerName , setPublicPlayerName] = useState(''); 
  useEffect(() => {
    if (!socket) return;

    socket.on('getCode', (myCode) => {
      console.log('Received Room Code:', myCode);
      setGenCode(myCode);
    });

    socket.on('getPublicRooms', (myPublicRooms) => {
      setPublicRooms(myPublicRooms);
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

    // Request public rooms when component mounts
    socket.emit('getPublicRooms');

    return () => {
      socket.off('getCode');
      socket.off('roomJoined');
      socket.off('getPublicRooms');
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

  const handlePublicRoomClick = () => {
    setButtonClicked((prev) => !prev);
    console.log('publicCreateButtonPressed');
  };

  const createPublicRoom = () => {
    if (roomName !== '') {
      socket.emit('createPublicRoom', roomName);
      setRoomName('');
      setButtonClicked(false);
      setTimeout(() => {
        socket.emit('getPublicRooms');
      }, 500); 
    }
  };

  const joinPublicRoom = (roomCode) => {
    if (!socket || !publicPlayerName) {
      alert('Please enter your player name before joining a room');
      return;
    }
    setPlayerName(publicPlayerName);
    setInputCode(roomCode);
    socket.emit('joinRoom', playerName, roomCode);
  };

  const renderPublicRooms = () => {
    console.log("Rendering public rooms:", publicRooms);
    
    // Make sure to match the property names from your server
    const filteredRooms = publicRooms.filter(room => 
      room.roomName && room.roomName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredRooms.length === 0) {
      return (
        <div className="public-rooms-container">
          <h3 className="rooms-title">Public Rooms</h3>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <p className="no-rooms-message">No public rooms available</p>
        </div>
      );
    }

    return (
      <div className="public-rooms-container">
        <h3 className="rooms-title">Public Rooms</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="room-search-input"
          />
        </div>
        <div className="rooms-list">
          {filteredRooms.map((room, index) => (
            <div key={index} className="room-item">
              <span className="room-name">{room.roomName}</span>
              <span className="room-players">Players: {room.players?.length || 0}</span>
              <button 
                className={`join-room-button${!roomToggle?'':'close'}`}
                onClick={() => setRoomToggle((prev)=>!prev)}
              >
                {!roomToggle? 'Join' : 'close'}
              </button>
              {roomToggle?<div>
                <div className="input-group">
          <p className='display-playername'>Player Name</p>
          <input
            className="player-room-input-field"
            value={publicPlayerName}
            onChange={(e) => setPublicPlayerName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
                <button
                  className="join-room-button"
                  onClick={() => joinPublicRoom(room.roomId)}
                >
                  Join
                </button>
              </div> : ''}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="hompage-container">
      <div className="box">
        {publicRooms.length > 0 ? renderPublicRooms() : ''}
        <h2 className="rooms-title">Create Room</h2>
        <h3 className="sub-title">Generate a custom room to play games with your friends</h3>
        <div className='home-button-area'>
          <button className="rooms-button" onClick={createRoom}>
            Create Private Room
          </button>
          <button className={`rooms-button${!buttonClicked?'':'close'}`} onClick={handlePublicRoomClick}>
            {!buttonClicked?"Create Public Rooms":"Close"}
          </button>
        </div>

        {buttonClicked ? <div className="create-public-room">
            <input
              onChange={(e) => setRoomName(e.target.value)}
              value={roomName}
              placeholder='Enter your room name'
              className="input-field"
            />
            <button
              onClick={createPublicRoom}
              className="create-public-button"
            >
              Create Room
            </button>
        </div> : ''}

        {genCode && <p className="gen-room-code">Room Code To share with other player: <span>{genCode}</span></p>}
      </div>

      <div className="box">
        <h2 className="rooms-title">Join Private Room</h2>
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
        <button className="rooms-join-button" onClick={joinRoom}>
          Join
        </button>
      </div>
    </div>
  );
}

export default HomePage;