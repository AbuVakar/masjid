const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: './config.env' });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import database connection and validation
const connectDB = require('./config/db');
const validateEnvironment = require('./config/validateEnv');

// Import error handling
const {
  errorHandler,
  notFoundHandler,
  setupProcessErrorHandlers,
} = require('./middleware/errorHandler');

// Import logging
const { enhancedLogger } = require('./utils/logger');

// Import CSRF protection
const { csrfToken, validateCSRF, getCSRFToken } = require('./middleware/csrf');

// Import routes
const housesRoutes = require('./routes/houses');
const resourcesRoutes = require('./routes/resources');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const activityLogsRoutes = require('./routes/activityLogs');
const infoDataRoutes = require('./routes/infoData');

// Import WebSocket server
const WebSocketServer = require('./websocket');

// Initialize express app
const app = express();

// Validate environment variables
validateEnvironment();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://10.113.136.76:3000',
      'http://192.168.56.1:3000',
      // Allow all local network IPs for mobile testing
      /^http:\/\/192\.168\.\d+\.\d+:3000$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
      /^http:\/\/172\.\d+\.\d+\.\d+:3000$/,
      // Note: do not use '*' inside list; rely on explicit origins only
      'http://192.168.1.100:3000',
      'http://192.168.1.101:3000',
      'http://192.168.1.102:3000',
      'http://192.168.1.103:3000',
      'http://192.168.1.104:3000',
      'http://192.168.1.105:3000',
      'http://192.168.1.106:3000',
      'http://192.168.1.107:3000',
      'http://192.168.1.108:3000',
      'http://192.168.1.109:3000',
      'http://192.168.1.110:3000',
      'http://192.168.1.111:3000',
      'http://192.168.1.112:3000',
      'http://192.168.1.113:3000',
      'http://192.168.1.114:3000',
      'http://192.168.1.115:3000',
      'http://192.168.1.116:3000',
      'http://192.168.1.117:3000',
      'http://192.168.1.118:3000',
      'http://192.168.1.119:3000',
      'http://192.168.1.120:3000',
      'http://192.168.1.121:3000',
      'http://192.168.1.122:3000',
      'http://192.168.1.123:3000',
      'http://192.168.1.124:3000',
      'http://192.168.1.125:3000',
      'http://192.168.1.126:3000',
      'http://192.168.1.127:3000',
      'http://192.168.1.128:3000',
      'http://192.168.1.129:3000',
      'http://192.168.1.130:3000',
      'http://192.168.1.131:3000',
      'http://192.168.1.132:3000',
      'http://192.168.1.133:3000',
      'http://192.168.1.134:3000',
      'http://192.168.1.135:3000',
      'http://192.168.1.136:3000',
      'http://192.168.1.137:3000',
      'http://192.168.1.138:3000',
      'http://192.168.1.139:3000',
      'http://192.168.1.140:3000',
      'http://192.168.1.141:3000',
      'http://192.168.1.142:3000',
      'http://192.168.1.143:3000',
      'http://192.168.1.144:3000',
      'http://192.168.1.145:3000',
      'http://192.168.1.146:3000',
      'http://192.168.1.147:3000',
      'http://192.168.1.148:3000',
      'http://192.168.1.149:3000',
      'http://192.168.1.150:3000',
      'http://192.168.1.151:3000',
      'http://192.168.1.152:3000',
      'http://192.168.1.153:3000',
      'http://192.168.1.154:3000',
      'http://192.168.1.155:3000',
      'http://192.168.1.156:3000',
      'http://192.168.1.157:3000',
      'http://192.168.1.158:3000',
      'http://192.168.1.159:3000',
      'http://192.168.1.160:3000',
      'http://192.168.1.161:3000',
      'http://192.168.1.162:3000',
      'http://192.168.1.163:3000',
      'http://192.168.1.164:3000',
      'http://192.168.1.165:3000',
      'http://192.168.1.166:3000',
      'http://192.168.1.167:3000',
      'http://192.168.1.168:3000',
      'http://192.168.1.169:3000',
      'http://192.168.1.170:3000',
      'http://192.168.1.171:3000',
      'http://192.168.1.172:3000',
      'http://192.168.1.173:3000',
      'http://192.168.1.174:3000',
      'http://192.168.1.175:3000',
      'http://192.168.1.176:3000',
      'http://192.168.1.177:3000',
      'http://192.168.1.178:3000',
      'http://192.168.1.179:3000',
      'http://192.168.1.180:3000',
      'http://192.168.1.181:3000',
      'http://192.168.1.182:3000',
      'http://192.168.1.183:3000',
      'http://192.168.1.184:3000',
      'http://192.168.1.185:3000',
      'http://192.168.1.186:3000',
      'http://192.168.1.187:3000',
      'http://192.168.1.188:3000',
      'http://192.168.1.189:3000',
      'http://192.168.1.190:3000',
      'http://192.168.1.191:3000',
      'http://192.168.1.192:3000',
      'http://192.168.1.193:3000',
      'http://192.168.1.194:3000',
      'http://192.168.1.195:3000',
      'http://192.168.1.196:3000',
      'http://192.168.1.197:3000',
      'http://192.168.1.198:3000',
      'http://192.168.1.199:3000',
      'http://192.168.1.200:3000',
      'http://192.168.1.201:3000',
      'http://192.168.1.202:3000',
      'http://192.168.1.203:3000',
      'http://192.168.1.204:3000',
      'http://192.168.1.205:3000',
      'http://192.168.1.206:3000',
      'http://192.168.1.207:3000',
      'http://192.168.1.208:3000',
      'http://192.168.1.209:3000',
      'http://192.168.1.210:3000',
      'http://192.168.1.211:3000',
      'http://192.168.1.212:3000',
      'http://192.168.1.213:3000',
      'http://192.168.1.214:3000',
      'http://192.168.1.215:3000',
      'http://192.168.1.216:3000',
      'http://192.168.1.217:3000',
      'http://192.168.1.218:3000',
      'http://192.168.1.219:3000',
      'http://192.168.1.220:3000',
      'http://192.168.1.221:3000',
      'http://192.168.1.222:3000',
      'http://192.168.1.223:3000',
      'http://192.168.1.224:3000',
      'http://192.168.1.225:3000',
      'http://192.168.1.226:3000',
      'http://192.168.1.227:3000',
      'http://192.168.1.228:3000',
      'http://192.168.1.229:3000',
      'http://192.168.1.230:3000',
      'http://192.168.1.231:3000',
      'http://192.168.1.232:3000',
      'http://192.168.1.233:3000',
      'http://192.168.1.234:3000',
      'http://192.168.1.235:3000',
      'http://192.168.1.236:3000',
      'http://192.168.1.237:3000',
      'http://192.168.1.238:3000',
      'http://192.168.1.239:3000',
      'http://192.168.1.240:3000',
      'http://192.168.1.241:3000',
      'http://192.168.1.242:3000',
      'http://192.168.1.243:3000',
      'http://192.168.1.244:3000',
      'http://192.168.1.245:3000',
      'http://192.168.1.246:3000',
      'http://192.168.1.247:3000',
      'http://192.168.1.248:3000',
      'http://192.168.1.249:3000',
      'http://192.168.1.250:3000',
      'http://192.168.1.251:3000',
      'http://192.168.1.252:3000',
      'http://192.168.1.253:3000',
      'http://192.168.1.254:3000',
      'http://192.168.1.255:3000',
      'http://10.146.95.76:3000',
      'http://10.146.95.77:3000',
      'http://10.146.95.78:3000',
      'http://10.146.95.79:3000',
      'http://10.146.95.80:3000',
      'http://10.146.95.81:3000',
      'http://10.146.95.82:3000',
      'http://10.146.95.83:3000',
      'http://10.146.95.84:3000',
      'http://10.146.95.85:3000',
      'http://10.146.95.86:3000',
      'http://10.146.95.87:3000',
      'http://10.146.95.88:3000',
      'http://10.146.95.89:3000',
      'http://10.146.95.90:3000',
      'http://10.146.95.91:3000',
      'http://10.146.95.92:3000',
      'http://10.146.95.93:3000',
      'http://10.146.95.94:3000',
      'http://10.146.95.95:3000',
      'http://10.146.95.96:3000',
      'http://10.146.95.97:3000',
      'http://10.146.95.98:3000',
      'http://10.146.95.99:3000',
      'http://10.146.95.100:3000',
      'http://10.146.95.101:3000',
      'http://10.146.95.102:3000',
      'http://10.146.95.103:3000',
      'http://10.146.95.104:3000',
      'http://10.146.95.105:3000',
      'http://10.146.95.106:3000',
      'http://10.146.95.107:3000',
      'http://10.146.95.108:3000',
      'http://10.146.95.109:3000',
      'http://10.146.95.110:3000',
      'http://10.146.95.111:3000',
      'http://10.146.95.112:3000',
      'http://10.146.95.113:3000',
      'http://10.146.95.114:3000',
      'http://10.146.95.115:3000',
      'http://10.146.95.116:3000',
      'http://10.146.95.117:3000',
      'http://10.146.95.118:3000',
      'http://10.146.95.119:3000',
      'http://10.146.95.120:3000',
      'http://10.146.95.121:3000',
      'http://10.146.95.122:3000',
      'http://10.146.95.123:3000',
      'http://10.146.95.124:3000',
      'http://10.146.95.125:3000',
      'http://10.146.95.126:3000',
      'http://10.146.95.127:3000',
      'http://10.146.95.128:3000',
      'http://10.146.95.129:3000',
      'http://10.146.95.130:3000',
      'http://10.146.95.131:3000',
      'http://10.146.95.132:3000',
      'http://10.146.95.133:3000',
      'http://10.146.95.134:3000',
      'http://10.146.95.135:3000',
      'http://10.146.95.136:3000',
      'http://10.146.95.137:3000',
      'http://10.146.95.138:3000',
      'http://10.146.95.139:3000',
      'http://10.146.95.140:3000',
      'http://10.146.95.141:3000',
      'http://10.146.95.142:3000',
      'http://10.146.95.143:3000',
      'http://10.146.95.144:3000',
      'http://10.146.95.145:3000',
      'http://10.146.95.146:3000',
      'http://10.146.95.147:3000',
      'http://10.146.95.148:3000',
      'http://10.146.95.149:3000',
      'http://10.146.95.150:3000',
      'http://10.146.95.151:3000',
      'http://10.146.95.152:3000',
      'http://10.146.95.153:3000',
      'http://10.146.95.154:3000',
      'http://10.146.95.155:3000',
      'http://10.146.95.156:3000',
      'http://10.146.95.157:3000',
      'http://10.146.95.158:3000',
      'http://10.146.95.159:3000',
      'http://10.146.95.160:3000',
      'http://10.146.95.161:3000',
      'http://10.146.95.162:3000',
      'http://10.146.95.163:3000',
      'http://10.146.95.164:3000',
      'http://10.146.95.165:3000',
      'http://10.146.95.166:3000',
      'http://10.146.95.167:3000',
      'http://10.146.95.168:3000',
      'http://10.146.95.169:3000',
      'http://10.146.95.170:3000',
      'http://10.146.95.171:3000',
      'http://10.146.95.172:3000',
      'http://10.146.95.173:3000',
      'http://10.146.95.174:3000',
      'http://10.146.95.175:3000',
      'http://10.146.95.176:3000',
      'http://10.146.95.177:3000',
      'http://10.146.95.178:3000',
      'http://10.146.95.179:3000',
      'http://10.146.95.180:3000',
      'http://10.146.95.181:3000',
      'http://10.146.95.182:3000',
      'http://10.146.95.183:3000',
      'http://10.146.95.184:3000',
      'http://10.146.95.185:3000',
      'http://10.146.95.186:3000',
      'http://10.146.95.187:3000',
      'http://10.146.95.188:3000',
      'http://10.146.95.189:3000',
      'http://10.146.95.190:3000',
      'http://10.146.95.191:3000',
      'http://10.146.95.192:3000',
      'http://10.146.95.193:3000',
      'http://10.146.95.194:3000',
      'http://10.146.95.195:3000',
      'http://10.146.95.196:3000',
      'http://10.146.95.197:3000',
      'http://10.146.95.198:3000',
      'http://10.146.95.199:3000',
      'http://10.146.95.200:3000',
      'http://10.146.95.201:3000',
      'http://10.146.95.202:3000',
      'http://10.146.95.203:3000',
      'http://10.146.95.204:3000',
      'http://10.146.95.205:3000',
      'http://10.146.95.206:3000',
      'http://10.146.95.207:3000',
      'http://10.146.95.208:3000',
      'http://10.146.95.209:3000',
      'http://10.146.95.210:3000',
      'http://10.146.95.211:3000',
      'http://10.146.95.212:3000',
      'http://10.146.95.213:3000',
      'http://10.146.95.214:3000',
      'http://10.146.95.215:3000',
      'http://10.146.95.216:3000',
      'http://10.146.95.217:3000',
      'http://10.146.95.218:3000',
      'http://10.146.95.219:3000',
      'http://10.146.95.220:3000',
      'http://10.146.95.221:3000',
      'http://10.146.95.222:3000',
      'http://10.146.95.223:3000',
      'http://10.146.95.224:3000',
      'http://10.146.95.225:3000',
      'http://10.146.95.226:3000',
      'http://10.146.95.227:3000',
      'http://10.146.95.228:3000',
      'http://10.146.95.229:3000',
      'http://10.146.95.230:3000',
      'http://10.146.95.231:3000',
      'http://10.146.95.232:3000',
      'http://10.146.95.233:3000',
      'http://10.146.95.234:3000',
      'http://10.146.95.235:3000',
      'http://10.146.95.236:3000',
      'http://10.146.95.237:3000',
      'http://10.146.95.238:3000',
      'http://10.146.95.239:3000',
      'http://10.146.95.240:3000',
      'http://10.146.95.241:3000',
      'http://10.146.95.242:3000',
      'http://10.146.95.243:3000',
      'http://10.146.95.244:3000',
      'http://10.146.95.245:3000',
      'http://10.146.95.246:3000',
      'http://10.146.95.247:3000',
      'http://10.146.95.248:3000',
      'http://10.146.95.249:3000',
      'http://10.146.95.250:3000',
      'http://10.146.95.251:3000',
      'http://10.146.95.252:3000',
      'http://10.146.95.253:3000',
      'http://10.146.95.254:3000',
      'http://10.146.95.255:3000',
      'http://10.209.233.76:3000',
      // Netlify URLs for production
      'https://tiny-torrone-c5fa9b.netlify.app',
      'https://madina-masjid.netlify.app',
      'https://*.netlify.app',
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true,
  }),
);

// Rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 20, // Higher limit for development
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resourcesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 50, // Higher limit for resources in development
  message: {
    error: 'Too many resource requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Skip rate limiting in test environment
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', generalLimiter);
  app.use('/api/users/login', authLimiter);
  app.use('/api/users/register', authLimiter);
  app.use('/api/resources', resourcesLimiter);
}

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CSRF protection middleware
// We will not apply CSRF to GET, HEAD, OPTIONS, TRACE requests.
// And we will skip it in test environment and development for easier testing
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
  app.use(csrfToken);
  app.use(validateCSRF);
}

// Enhanced request logging
app.use(enhancedLogger.logRequest);

// Basic logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static file serving for uploads with proper configuration
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Set proper headers for file downloads
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Accept-Ranges', 'bytes');
    },
  }),
);

// Additional file serving route for better compatibility
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Get file stats
  const stats = fs.statSync(filePath);
  console.log(`📁 Serving file: ${filename}, Size: ${stats.size} bytes`);

  // Set proper headers
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', stats.size);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-cache');

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// CSRF token endpoint
app.get('/api/csrf-token', getCSRFToken);

// API Routes
app.use('/api/houses', housesRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prayer-times', require('./routes/prayerTimes'));
app.use('/api/contact', contactRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/info-data', infoDataRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Masjid Dashboard API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Masjid Dashboard API',
    version: '1.0.0',
    endpoints: {
      houses: '/api/houses',
      resources: '/api/resources',
      health: '/api/health',
    },
  });
});

// 404 handler - must be last
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

// Setup process error handlers
setupProcessErrorHandlers();

// Start server
const PORT = process.env.PORT || 5000;

let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', async () => {
    await connectDB();

    // Initialize WebSocket server for admin notifications
    const wsServer = new WebSocketServer(server);

    enhancedLogger.info('Server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      apiUrl: `http://localhost:${PORT}`,
      mobileUrl: `http://10.31.43.76:${PORT}`,
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      websocket: 'ws://localhost:' + PORT + '/ws/admin-notifications',
    });
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  enhancedLogger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    enhancedLogger.info('Process terminated');
  });
});

module.exports = app;
