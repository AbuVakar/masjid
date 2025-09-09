const webPush = require('web-push');

// Generate VAPID keys
const vapidKeys = webPush.generateVAPIDKeys();

console.log('🔑 VAPID Keys Generated Successfully!');
console.log('=====================================');
console.log('Public Key (Frontend):');
console.log('REACT_APP_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('\nPrivate Key (Backend):');
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('\n=====================================');
console.log('📝 Instructions:');
console.log('1. Copy Public Key to frontend .env file');
console.log('2. Copy Private Key to server config.env file');
console.log('3. Restart both frontend and backend servers');
