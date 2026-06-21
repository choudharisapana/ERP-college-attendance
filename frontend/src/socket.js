import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const connectSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Socket connected');
      // Join user's personal room
      socket.emit('join', userId);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};