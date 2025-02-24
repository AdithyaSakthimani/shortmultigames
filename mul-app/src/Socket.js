import { io } from "socket.io-client";
// const SOCKET_URL = "https://shortmultigames.onrender.com";
const SOCKET_URL = "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
