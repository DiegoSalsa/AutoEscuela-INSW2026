const { Server } = require('socket.io');

let io = null;

// Inicializar servidor WebSocket con Socket.io
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Suscribir al cliente a la room de su sede
    socket.on('join:sede', (sedeId) => {
      socket.join(`sede-${sedeId}`);
      console.log(`Socket ${socket.id} unido a sede-${sedeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

// Obtener la instancia de Socket.io
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama a initSocket(server) primero.');
  }
  return io;
};

// Emitir un evento de reserva a la room de la sede y al canal global
const emitirEventoReserva = (evento, reserva) => {
  if (!io) return;
  // Emitir a la room de la sede especifica
  if (reserva.sede_id) {
    io.to(`sede-${reserva.sede_id}`).emit(evento, reserva);
  }
  // Emitir al canal global (para dashboards)
  io.emit(evento, reserva);
};

module.exports = { initSocket, getIO, emitirEventoReserva };
