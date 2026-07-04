import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [gridSize, setGridSize] = useState({ rows: 40, cols: 40 });
  const initDataRef = useRef(null);
  const initCallbacksRef = useRef([]);

  if (!socketRef.current) {
    const serverUrl = import.meta.env.PROD ? '' : 'http://localhost:3001';
    socketRef.current = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }

  useEffect(() => {
    const socket = socketRef.current;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('init', (data) => {
      setUser(data.user);
      setOnlineCount(data.onlineCount);
      setGridSize(data.gridSize);
      initDataRef.current = data;
      initCallbacksRef.current.forEach(cb => cb(data));
      initCallbacksRef.current = [];
    });

    socket.on('user-joined', (data) => setOnlineCount(data.onlineCount));
    socket.on('user-left', (data) => setOnlineCount(data.onlineCount));

    socket.on('user-updated', (data) => {
      setUser(prev => {
        if (prev && prev.id === data.id) {
          return { ...prev, name: data.name };
        }
        return prev;
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  const onInit = useCallback((callback) => {
    if (initDataRef.current) {
      callback(initDataRef.current);
    } else {
      initCallbacksRef.current.push(callback);
    }
  }, []);

  return { socket: socketRef, isConnected, user, onlineCount, gridSize, emit, on, onInit };
}
