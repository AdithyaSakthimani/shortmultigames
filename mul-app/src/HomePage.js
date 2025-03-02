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
  const [roomToggle, setRoomToggle] = useState(false);
  const [publicPlayerName, setPublicPlayerName] = useState({}); // Changed to an object to store names by roomId
  const [selectedRoomId, setSelectedRoomId] = useState(null); // Track which room is selected
  const [createdRooms, setCreatedRooms] = useState([]); // Track rooms created by this user
  const [isSearching, setIsSearching] = useState(false);
    const handleRandomMatch = () => {
      if (!playerName || playerName.trim() === '') {
        alert('Please enter your name first');
        return;
      }
      
      setIsSearching(true);
      socket.emit('findRandomMatch', playerName);
      
      socket.on('waitingForMatch', () => {
        console.log('Waiting for a match...');
        // You can add a loading spinner or message here
      });
      
      socket.on('randomMatchFound', ({ roomCode }) => {
        setCode(roomCode);
        
        // Save session info to localStorage
        localStorage.setItem('gameSession', JSON.stringify({
          savedCode: roomCode,
          savedName: playerName
        }));
        
        setIsSearching(false);
        navigate('/gameroom');
      });
    };
    
    const cancelSearch = () => {
      socket.emit('cancelRandomMatch', playerName);
      socket.off('waitingForMatch');
      socket.off('randomMatchFound');
      setIsSearching(false);
    };
    socket.on('matchmakingCanceled', () => {
      setIsSearching(false);
    });
  useEffect(() => {
    if (!socket) return;

    socket.on('getCode', (myCode) => {
      console.log('Received Room Code:', myCode);
      setGenCode(myCode);
      // Add this room to the list of rooms created by this user
      setCreatedRooms(prev => [...prev, myCode]);
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

    socket.on('roomDeleted', (roomId) => {
      // Remove from created rooms if it was created by this user
      setCreatedRooms(prev => prev.filter(id => id !== roomId));
    });

    // Request public rooms when component mounts
    socket.emit('getPublicRooms');

    return () => {
      socket.off('getCode');
      socket.off('roomJoined');
      socket.off('getPublicRooms');
      socket.off('roomDeleted');
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

  const deletePublicRoom = (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      socket.emit('deleteRoom', roomId);
      // We'll update the local state after receiving confirmation from the server
    }
  };

  const toggleRoomJoin = (roomId) => {
    setSelectedRoomId(roomId === selectedRoomId ? null : roomId);
    setRoomToggle(roomId === selectedRoomId ? false : true);
  };

  const handlePublicPlayerNameChange = (roomId, value) => {
    setPublicPlayerName(prev => ({
      ...prev,
      [roomId]: value
    }));
  };

  const joinPublicRoom = (roomId) => {
    if (!socket || !publicPlayerName[roomId]) {
      alert('Please enter your player name before joining a room');
      return;
    }
    
    // Set the player name from publicPlayerName[roomId]
    setPlayerName(publicPlayerName[roomId]);
    setInputCode(roomId);
    socket.emit('joinRoom', publicPlayerName[roomId], roomId);
  };

  const isRoomCreator = (roomId) => {
    return createdRooms.includes(roomId);
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
              
              <div className="room-actions">
                {isRoomCreator(room.roomId) && (
                  <button 
                    className="delete-room-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePublicRoom(room.roomId);
                    }}
                  >
                    Delete
                  </button>
                )}
                <button 
                  className={`join-room-button${selectedRoomId === room.roomId && roomToggle ? 'close' : ''}`}
                  onClick={() => toggleRoomJoin(room.roomId)}
                >
                  {selectedRoomId !== room.roomId || !roomToggle ? 'Join' : 'Close'}
                </button>
              </div>
              
              {selectedRoomId === room.roomId && roomToggle && (
                <div>
                  <div className="input-group">
                    <p className='display-playername'>Player Name</p>
                    <input
                      className="player-room-input-field"
                      value={publicPlayerName[room.roomId] || ''}
                      onChange={(e) => handlePublicPlayerNameChange(room.roomId, e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <button
                    className="join-room-button"
                    onClick={() => joinPublicRoom(room.roomId)}
                  >
                    Join
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="hompage-container">
      <div className="box">
  {!isSearching ? (
    <div className="random-match-form">
      <h2 className="rooms-title">Quick Play</h2>
      <h3 className="sub-title">Quickly find a opponent to play with online</h3>
      <div className="input-group">
        <label>Your Name</label>
        <input
          className="input-field"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>
      <button 
        className="random-match-button"
        onClick={handleRandomMatch}
        disabled={!playerName || playerName.trim() === ''}
      >
        Connect with Random Player
      </button>
    </div>
  ) : (
    <div className="searching-container">
      <div className="searching-text">Searching for opponent...</div>
      <div className="searching-name">Playing as: <strong>{playerName}</strong></div>
      <button 
        className="cancel-search-button"
        onClick={cancelSearch}
      >
        Cancel
      </button>
    </div>
  )}
</div>
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