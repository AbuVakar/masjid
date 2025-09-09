const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

// Ensure MONGODB_URI is set
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  console.log(
    '📁 Looking for config.env in:',
    path.join(__dirname, 'config.env'),
  );
  process.exit(1);
}

const resetAdminPassword = async (newPassword = null) => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();

    // Check if admin exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      console.log('❌ Admin user does not exist');
      console.log('💡 Run "npm run setup-admin" to create admin user first');
      process.exit(1);
    }

    console.log('✅ Admin user found');
    console.log('Username: admin');
    console.log('Role:', existingAdmin.role);
    console.log('Email: bakrabu786@gmail.com');

    // Use provided password or generate secure password
    const adminPassword = newPassword || generateSecurePassword();
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Update admin password
    existingAdmin.password = hashedPassword;
    await existingAdmin.save();

    console.log('✅ Admin password reset successfully!');
    console.log('Username: admin');
    console.log('New Password:', adminPassword);
    console.log('Role: admin');
    console.log('Email: bakrabu786@gmail.com');
    console.log('⚠️  IMPORTANT: Save this new password securely!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    process.exit(1);
  }
};

// Generate secure password
const generateSecurePassword = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Get new password from command line argument
const newPassword = process.argv[2];

// Run the reset function
resetAdminPassword(newPassword);
