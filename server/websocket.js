const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { enhancedLogger } = require('./utils/logger');
const {
  adminNotificationService,
} = require('./utils/adminNotificationService');
const User = require('./models/User');

/**
 * WebSocket Server for Real-time Admin Notifications
 */
class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws/admin-notifications',
    });

    this.clients = new Map(); // Store client connections
    this.setupWebSocket();

    enhancedLogger.info('WebSocket server initialized for admin notifications');
  }

  /**
   * Setup WebSocket event handlers
   */
  setupWebSocket() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Authenticate the connection
        const user = await this.authenticateConnection(req);

        if (!user) {
          ws.close(1008, 'Authentication failed');
          return;
        }

        // Only allow admin users
        if (user.role !== 'admin') {
          ws.close(1008, 'Admin access required');
          return;
        }

        // Store client connection
        this.clients.set(user._id.toString(), {
          ws,
          user,
          connectedAt: new Date(),
          lastPing: new Date(),
        });

        // Add to admin notification service
        adminNotificationService.addAdminSubscriber(user._id.toString(), ws);

        enhancedLogger.info(`Admin ${user.username} connected to WebSocket`);

        // Send welcome message
        ws.send(
          JSON.stringify({
            type: 'CONNECTION_ESTABLISHED',
            data: {
              message: 'Connected to admin notifications',
              userId: user._id.toString(),
              username: user.username,
              timestamp: new Date(),
            },
          }),
        );

        // Setup message handlers
        ws.on('message', (message) => {
          this.handleMessage(ws, user, message);
        });

        ws.on('close', () => {
          this.handleDisconnect(user._id.toString());
        });

        ws.on('error', (error) => {
          enhancedLogger.error(`WebSocket error for admin ${user.username}`, {
            error: error.message,
          });
          this.handleDisconnect(user._id.toString());
        });

        // Setup ping/pong for connection health
        ws.on('pong', () => {
          const client = this.clients.get(user._id.toString());
          if (client) {
            client.lastPing = new Date();
          }
        });
      } catch (error) {
        enhancedLogger.error('WebSocket connection error', {
          error: error.message,
        });
        ws.close(1011, 'Internal server error');
      }
    });

    // Setup ping interval to keep connections alive
    setInterval(() => {
      this.pingClients();
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Authenticate WebSocket connection
   */
  async authenticateConnection(req) {
    try {
      // Extract token from query parameters or headers
      const token =
        req.url.split('token=')[1]?.split('&')[0] ||
        req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return null;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database - handle both old and new JWT structures
      const userId = decoded.userId || (decoded.user && decoded.user.id);
      const user = await User.findById(userId).select('-password');

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      enhancedLogger.error('WebSocket authentication error', {
        error: error.message,
        name: error.name,
      });

      // Log specific JWT errors
      if (error.name === 'TokenExpiredError') {
        enhancedLogger.error('JWT token expired for WebSocket connection');
      } else if (error.name === 'JsonWebTokenError') {
        enhancedLogger.error('Invalid JWT token for WebSocket connection');
      }

      return null;
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(ws, user, message) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'PING':
          ws.send(
            JSON.stringify({
              type: 'PONG',
              data: { timestamp: new Date() },
            }),
          );
          break;

        case 'GET_STATS':
          const stats = adminNotificationService.getNotificationStats();
          ws.send(
            JSON.stringify({
              type: 'STATS',
              data: stats,
            }),
          );
          break;

        case 'CLEAR_NOTIFICATIONS':
          // Clear notifications for this admin
          adminNotificationService.clearOldNotifications();
          ws.send(
            JSON.stringify({
              type: 'NOTIFICATIONS_CLEARED',
              data: { message: 'Notifications cleared' },
            }),
          );
          break;

        default:
          enhancedLogger.warn(`Unknown WebSocket message type: ${data.type}`);
      }
    } catch (error) {
      enhancedLogger.error('Error handling WebSocket message', {
        error: error.message,
        userId: user._id.toString(),
      });
    }
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(userId) {
    this.clients.delete(userId);
    adminNotificationService.removeAdminSubscriber(userId);

    enhancedLogger.info(`Admin ${userId} disconnected from WebSocket`);
  }

  /**
   * Ping all connected clients
   */
  pingClients() {
    const now = new Date();

    for (const [userId, client] of this.clients) {
      try {
        // Check if connection is still alive
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();

          // Check if client hasn't responded to ping for too long
          const timeSinceLastPing = now - client.lastPing;
          if (timeSinceLastPing > 60000) {
            // 1 minute
            enhancedLogger.warn(
              `Admin ${userId} not responding to pings, closing connection`,
            );
            client.ws.close(1000, 'Connection timeout');
            this.handleDisconnect(userId);
          }
        } else {
          // Connection is not open, remove it
          this.handleDisconnect(userId);
        }
      } catch (error) {
        enhancedLogger.error(`Error pinging client ${userId}`, {
          error: error.message,
        });
        this.handleDisconnect(userId);
      }
    }
  }

  /**
   * Broadcast message to all connected admins
   */
  broadcast(message) {
    for (const [userId, client] of this.clients) {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      } catch (error) {
        enhancedLogger.error(`Error broadcasting to admin ${userId}`, {
          error: error.message,
        });
        this.handleDisconnect(userId);
      }
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      activeConnections: Array.from(this.clients.values()).filter(
        (client) => client.ws.readyState === WebSocket.OPEN,
      ).length,
      adminUsers: Array.from(this.clients.values()).map((client) => ({
        userId: client.user._id.toString(),
        username: client.user.username,
        connectedAt: client.connectedAt,
        lastPing: client.lastPing,
      })),
    };
  }

  /**
   * Close all connections
   */
  close() {
    for (const [userId, client] of this.clients) {
      try {
        client.ws.close(1000, 'Server shutdown');
      } catch (error) {
        enhancedLogger.error(`Error closing connection for admin ${userId}`, {
          error: error.message,
        });
      }
    }

    this.wss.close();
    enhancedLogger.info('WebSocket server closed');
  }
}

module.exports = WebSocketServer;
