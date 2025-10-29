/**
 * WebSocket/Socket.IO Setup
 * Provides real-time communication for chat and notifications
 */
import { Server } from 'socket.io';

export function setupWebSocket(httpServer, config, logger, container) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.get('security.corsOrigins'),
      credentials: true,
    },
  });

  // Middleware for authentication (optional)
  io.use((socket, next) => {
    // TODO: Implement session-based or JWT authentication
    // For now, allow all connections
    const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
    if (userId) {
      socket.userId = userId;
    }
    next();
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('WebSocket client connected', { socketId: socket.id, userId: socket.userId });

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Chat room events
    socket.on('chat:join_room', (roomId) => {
      socket.join(`room:${roomId}`);
      logger.debug('User joined chat room', { userId: socket.userId, roomId });
    });

    socket.on('chat:leave_room', (roomId) => {
      socket.leave(`room:${roomId}`);
      logger.debug('User left chat room', { userId: socket.userId, roomId });
    });

    socket.on('chat:typing', (roomId) => {
      socket.to(`room:${roomId}`).emit('chat:user_typing', { userId: socket.userId });
    });

    socket.on('chat:stop_typing', (roomId) => {
      socket.to(`room:${roomId}`).emit('chat:user_stop_typing', { userId: socket.userId });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', { socketId: socket.id, userId: socket.userId });
    });
  });

  // Store io instance in container for use by services
  container.registerInstance('io', io);

  logger.info('WebSocket server initialized');

  return io;
}

/**
 * Helper function to emit events to specific rooms or users
 */
export function emitToRoom(io, roomId, event, data) {
  io.to(`room:${roomId}`).emit(event, data);
}

export function emitToUser(io, userId, event, data) {
  io.to(`user:${userId}`).emit(event, data);
}
