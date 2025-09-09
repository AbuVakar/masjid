const mongoose = require('mongoose');
const InfoData = require('./models/InfoData');
const User = require('./models/User');

const seedInfoData = async () => {
  try {
    console.log('🌱 Seeding InfoData...');

    // Get admin user for updatedBy field
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    const infoDataSeeds = [
      {
        type: 'timetable',
        title: 'Prayer Timetable',
        items: [
          { name: 'Fajr', time: '05:00 AM' },
          { name: 'Dhuhr', time: '12:30 PM' },
          { name: 'Asr', time: '03:45 PM' },
          { name: 'Maghrib', time: '06:15 PM' },
          { name: 'Isha', time: '07:30 PM' },
        ],
        updatedBy: adminUser._id,
      },
      {
        type: 'imam',
        title: 'Imam Information',
        items: [{ name: 'Imam Sahab', mobile: '+91-9876500000' }],
        updatedBy: adminUser._id,
      },
      {
        type: 'aumoor',
        title: 'Aumoor',
        items: [
          { name: 'Aumoomi Ghast', note: 'Every week — Monday after Maghrib' },
          { name: 'Taleem & Mashwara', note: 'Everyday after Isha' },
          {
            name: 'Haftwari Mashwara',
            note: "Every Jumu'ah after Jumu'ah at Jama Masjid Badarkha",
          },
          {
            name: 'Shab-guzari',
            note: 'Every Saturday — Garh Tehsil Masjid after Asr',
          },
        ],
        updatedBy: adminUser._id,
      },
      {
        type: 'running',
        title: "Jama'at Activities",
        sections: [
          {
            title: 'Outgoing Jamaats',
            items: [
              { name: '3-Day Jamaat', note: 'Monthly - First week' },
              { name: '10-Day Jamaat', note: 'Quarterly - Special occasions' },
              { name: '40-Day Jamaat', note: 'Annual - Summer program' },
            ],
          },
          {
            title: 'Local Activities',
            items: [
              { name: 'Weekly Taleem', note: 'Every Sunday after Maghrib' },
              { name: 'Monthly Ijtema', note: 'Last Sunday of each month' },
              { name: 'Annual Conference', note: 'December - Main event' },
            ],
          },
        ],
        updatedBy: adminUser._id,
      },
      {
        type: 'outgoing',
        title: 'Outgoing Jamaats',
        items: [
          { name: '3-Day Jamaat', note: 'Monthly - First week' },
          { name: '10-Day Jamaat', note: 'Quarterly - Special occasions' },
          { name: '40-Day Jamaat', note: 'Annual - Summer program' },
          { name: '4-Month Jamaat', note: 'Annual - Extended program' },
        ],
        updatedBy: adminUser._id,
      },
      {
        type: 'contact',
        title: 'Contact Information',
        items: [
          { name: 'M/s Ji Mursaleen Sahab', mobile: '+91-9639874789' },
          { name: 'Haroon Bhai', mobile: '+91-9568094910' },
          { name: 'Imaam Sahab', mobile: '+91-9760253216' },
        ],
        updatedBy: adminUser._id,
      },

      {
        type: 'resources_imp',
        title: 'Important Resources',
        items: [
          {
            name: 'Quran Learning Guide',
            note: 'Complete guide for beginners',
          },
          { name: 'Prayer Times Calendar', note: 'Monthly prayer schedule' },
          { name: 'Islamic Calendar 2024', note: 'Important dates and events' },
        ],
        updatedBy: adminUser._id,
      },
      {
        type: 'resources_dawah',
        title: 'Dawah Resources',
        items: [
          { name: 'Dawah Guidelines', note: 'Best practices for Dawah work' },
          { name: 'Islamic Literature', note: 'Books and pamphlets' },
          { name: 'Audio Lectures', note: 'Recorded speeches and talks' },
        ],
        updatedBy: adminUser._id,
      },
      {
        type: 'resources_gallery',
        title: 'Gallery',
        items: [
          { name: 'Event Photos', note: 'Local activities and events' },
          { name: 'Jamaat Pictures', note: 'Outgoing Jamaat photos' },
          { name: 'Community Events', note: 'Festivals and gatherings' },
        ],
        updatedBy: adminUser._id,
      },
      {
        type: 'resources_misc',
        title: 'Miscellaneous',
        items: [
          { name: 'FAQs', note: 'Common questions and answers' },
          { name: 'Contact Forms', note: 'Feedback and suggestions' },
          { name: 'Newsletter', note: 'Monthly community updates' },
        ],
        updatedBy: adminUser._id,
      },
    ];

    // Clear existing data
    await InfoData.deleteMany({});

    // Insert seed data
    const createdData = await InfoData.insertMany(infoDataSeeds);

    console.log(`✅ Seeded ${createdData.length} InfoData records`);
    console.log(
      '📋 InfoData types created:',
      createdData.map((d) => d.type),
    );
  } catch (error) {
    console.error('❌ Error seeding InfoData:', error);
    throw error;
  }
};

module.exports = seedInfoData;
