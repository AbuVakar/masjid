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

const setupAdmin = async (customPassword = null) => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();

    // Check if admin exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Username: admin');
      console.log('Role:', existingAdmin.role);
      console.log('Email: bakrabu786@gmail.com');
      console.log(
        'To change password, delete the admin user first and run this script again.',
      );
      return;
    }

    console.log('🔐 Creating admin user...');

    // Use custom password or generate secure password
    const adminPassword = customPassword || generateSecurePassword();
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      email: 'bakrabu786@gmail.com',
      mobile: '9876543210',
      name: 'Administrator',
      role: 'admin',
      preferences: {
        notifications: true,
        quietHours: { start: '22:00', end: '06:00' },
        theme: 'light',
        language: 'en',
        prayerTiming: { before: 15, after: 5 },
      },
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password:', adminPassword);
    console.log('Role: admin');
    console.log('Email: bakrabu786@gmail.com');
    console.log('⚠️  IMPORTANT: Save this password securely!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
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

// Get custom password from command line argument
const customPassword = process.argv[2];

// Run the setup function
setupAdmin(customPassword);
