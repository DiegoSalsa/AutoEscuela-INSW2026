import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

export function useSocket(sedeId) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Inicializar conexión
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Unirse al canal de la sede si existe
      if (sedeId) {
        newSocket.emit('join:sede', sedeId);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sedeId]);

  return { socket, isConnected };
}
