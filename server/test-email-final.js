const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

async function testEmail() {
  console.log('🧪 Testing Email Setup with Real Gmail...\n');

  // Check credentials
  console.log('📋 Configuration Check:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log(
    `EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing'}`,
  );
  console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE}\n`);

  try {
    // Create transporter
    console.log('📧 Creating Gmail transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Test connection
    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📤 Sending test email to bakrabu786@gmail.com...');
    const info = await transporter.sendMail({
      from: `"Silsila-ul-Ahwaal" <${process.env.EMAIL_USER}>`,
      to: 'bakrabu786@gmail.com',
      subject: '🧪 Test Email - Password Reset Functionality',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🧪 Test Email</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Silsila-ul-Ahwaal - Email Test</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Assalamu Alaikum,
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              This is a test email to verify that the password reset functionality is working correctly.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/reset-password/test-token-123" 
                 style="background: linear-gradient(135deg, #2E7D32, #4CAF50); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(46, 125, 50, 0.3);">
                🔄 Test Reset Link
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              <strong>Test Details:</strong><br>
              • Email Service: Gmail<br>
              • From: ${process.env.EMAIL_USER}<br>
              • To: bakrabu786@gmail.com<br>
              • Timestamp: ${new Date().toLocaleString()}<br>
              • Status: ✅ Working
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is a test email from Silsila-ul-Ahwaal system.<br>
              If you received this email, the password reset functionality is working correctly! 🎉
            </p>
          </div>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Accepted: ${info.accepted.join(', ')}`);

    console.log('\n🎉 Email functionality is working perfectly!');
    console.log(
      '📱 Check bakrabu786@gmail.com inbox (and spam folder) for the test email.',
    );
    console.log('🚀 Your forgot password system is now ready!');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);

    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. EMAIL_USER is correct');
      console.log('2. EMAIL_PASS is the correct App Password');
      console.log('3. 2-Factor Authentication is enabled on Gmail');
      console.log('4. App Password was generated correctly');
    }
  }
}

testEmail().catch(console.error);
