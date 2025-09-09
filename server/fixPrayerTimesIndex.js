const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/masjid-dashboard',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

const PrayerTime = require('./models/PrayerTime');

async function fixPrayerTimesIndex() {
  try {
    console.log('🔧 Fixing prayer times unique index...');

    // Get the collection
    const collection = mongoose.connection.collection('prayertimes');

    // Drop the problematic unique index if it exists
    try {
      await collection.dropIndex('isActive_1');
      console.log('✅ Dropped unique index on isActive field');
    } catch (error) {
      if (error.code === 26) {
        console.log('ℹ️  Index does not exist, skipping...');
      } else {
        console.log('⚠️  Error dropping index:', error.message);
      }
    }

    // Create a new non-unique index for better query performance
    try {
      await collection.createIndex({ isActive: 1 });
      console.log('✅ Created non-unique index on isActive field');
    } catch (error) {
      console.log('⚠️  Error creating index:', error.message);
    }

    // Ensure we have at least one active prayer time record
    const activePrayerTime = await PrayerTime.findOne({ isActive: true });
    if (!activePrayerTime) {
      console.log('📝 Creating default prayer times...');
      const defaultPrayerTime = new PrayerTime({
        Fajr: '05:15',
        Dhuhr: '14:15',
        Asr: '17:30',
        Maghrib: '19:10',
        Isha: '20:45',
        isActive: true,
        updatedBy: null, // Will be set when admin updates
      });
      await defaultPrayerTime.save();
      console.log('✅ Created default prayer times');
    } else {
      console.log('ℹ️  Active prayer times already exist');
    }

    console.log('🎉 Prayer times index fix completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing prayer times index:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixPrayerTimesIndex();
