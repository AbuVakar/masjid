const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables first
require('dotenv').config({ path: './config.env' });

// Load SSL certificates
const options = {
  key: fs.readFileSync(path.join(__dirname, '../cert.key')),
  cert: fs.readFileSync(path.join(__dirname, '../cert.crt'))
};

// Import the Express app
const app = require('./server');

const PORT = process.env.HTTPS_PORT || 5001;

// Create HTTPS server
const server = https.createServer(options, app);

// Start HTTPS server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 HTTPS Server running on https://localhost:${PORT}`);
  console.log(`📱 Mobile HTTPS URL: https://10.31.43.76:${PORT}`);
  console.log('🔐 SSL Certificate loaded successfully');
});

module.exports = server;
