const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables
require('dotenv').config({ path: './config.env' });

const createProductionAdmin = async () => {
  try {
    console.log('🔗 Connecting to production database...');
    await connectDB();

    // Check if admin exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists in production');
      console.log('Username: admin');
      console.log('Role:', existingAdmin.role);
      console.log('Email:', existingAdmin.email);
      return;
    }

    console.log('🔐 Creating admin user in production...');

    // Create admin user with known password
    const adminPassword = 'Admin123!';
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
    console.log('✅ Admin user created successfully in production!');
    console.log('Username: admin');
    console.log('Password: Admin123!');
    console.log('Role: admin');
    console.log('Email: bakrabu786@gmail.com');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the setup function
createProductionAdmin();