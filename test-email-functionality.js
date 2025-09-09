const nodemailer = require('nodemailer');
require('dotenv').config({ path: './server/config.env' });

// Test email functionality
async function testEmailFunctionality() {
  console.log('🧪 Testing Email Functionality...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(
    `EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Missing'}`,
  );
  console.log(
    `EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing'}`,
  );
  console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'Not set'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}\n`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not configured!');
    console.log('Please set EMAIL_USER and EMAIL_PASS in server/config.env');
    console.log('For Gmail:');
    console.log('1. Enable 2-Factor Authentication');
    console.log('2. Generate an App Password');
    console.log('3. Use the App Password in EMAIL_PASS');
    return;
  }

  try {
    // Create transporter
    console.log('📧 Creating email transporter...');
    const transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Test email
    const testEmail = 'abuthakur829@gmail.com';
    const resetUrl = 'http://localhost:3000/reset-password/test-token-123';

    console.log(`📤 Sending test email to: ${testEmail}`);

    const mailOptions = {
      from: `"Silsila-ul-Ahwaal" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: '🧪 Test Email - Password Reset Functionality',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🧪 Test Email</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Silsila-ul-Ahwaal - Email Functionality Test</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Assalamu Alaikum,
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              This is a test email to verify that the password reset functionality is working correctly.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
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
              • Email Service: ${process.env.EMAIL_SERVICE || 'gmail'}<br>
              • From: ${process.env.EMAIL_USER}<br>
              • Timestamp: ${new Date().toLocaleString()}<br>
              • Test URL: ${resetUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is a test email from Silsila-ul-Ahwaal system.<br>
              If you received this email, the password reset functionality is working correctly! 🎉
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Accepted: ${info.accepted.join(', ')}`);
    if (info.rejected.length > 0) {
      console.log(`❌ Rejected: ${info.rejected.join(', ')}`);
    }

    console.log('\n🎉 Email functionality test completed successfully!');
    console.log(
      '📱 Check your email inbox (and spam folder) for the test email.',
    );
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      response: error.response,
      command: error.command,
    });

    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. EMAIL_USER is correct');
      console.log('2. EMAIL_PASS is an App Password (not regular password)');
      console.log('3. 2-Factor Authentication is enabled on Gmail');
    }
  }
}

// Run the test
testEmailFunctionality().catch(console.error);
