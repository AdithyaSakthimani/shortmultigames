import React, { useState, useEffect } from "react";
import NoteContext from "./NoteContext";
import socket from "../Socket"; // Import the singleton socket

const NoteState = (props) => {
  const [code, setCode] = useState(localStorage.getItem("gameRoomCode") || "");
  const [playerName, setPlayerName] = useState(localStorage.getItem("playerName") || "");
  const[playerStatus , setPlayerStatus] = useState({
    player1:'',
    player2:''
  }) ; 
  const [scores,setScores] = useState(()=>{
    return {
      player1Score:0,
      player2Score:0
    }
  })
  useEffect(() => {
    if (code) {
      localStorage.setItem("gameRoomCode", code);
    } else {
      localStorage.removeItem("gameRoomCode");
    }
  }, [code]);

  useEffect(() => {
    localStorage.setItem("playerName", playerName);
  }, [playerName]);

  return (
    <NoteContext.Provider value={{ code, setCode, playerName, setPlayerName, socket , scores,setScores , playerStatus,setPlayerStatus}}>
      {props.children}
    </NoteContext.Provider>
  );
};

export default NoteState;
