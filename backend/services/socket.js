const { Server } = require('socket.io');

let io = null;

//Inicializar Socket.io con el servidor HTTP
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // El cliente se une a la room de su sede
    socket.on('join:sede', (sedeId) => {
      socket.join(`sede-${sedeId}`);
      console.log(`📍 Socket ${socket.id} unido a sede-${sedeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

// Obtener la instancia de Socket.io (desde cualquier módulo)/
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama a initSocket(server) primero.');
  }
  return io;
};

// Emitir evento de reserva a la room de la sede y al canal global
const emitirEventoReserva = (evento, reserva) => {
  if (!io) return;
  // Emitir a la room de la sede específica
  if (reserva.sede_id) {
    io.to(`sede-${reserva.sede_id}`).emit(evento, reserva);
  }
  // Emitir al canal global (para dashboards multisede)
  io.emit(evento, reserva);
};

module.exports = { initSocket, getIO, emitirEventoReserva };
