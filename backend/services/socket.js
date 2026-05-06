const { Server } = require('socket.io');

let io = null;

// Inicializar Socket.io
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);

    // Unir a room de sede
    socket.on('join:sede', (sedeId) => {
      socket.join(`sede-${sedeId}`);
      console.log(`[Socket] Socket ${socket.id} unido a sede-${sedeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

// Obtener instancia de Socket.io
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama a initSocket(server) primero.');
  }
  return io;
};

// Emitir evento de reserva
const emitirEventoReserva = (evento, reserva) => {
  if (!io) return;
  // Room de sede
  if (reserva.sede_id) {
    io.to(`sede-${reserva.sede_id}`).emit(evento, reserva);
  }
  // Canal global
  io.emit(evento, reserva);
};

module.exports = { initSocket, getIO, emitirEventoReserva };
