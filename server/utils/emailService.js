const nodemailer = require('nodemailer');

// Create a test account for development (you can replace with real SMTP settings)
const createTestAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.error('Error creating test account:', error);
    throw error;
  }
};

// For production, you would use real SMTP settings
const createProductionTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';

  if (emailService === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_PASS, // SendGrid API Key
      },
    });
  } else if (emailService === 'mailgun') {
    return nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else if (emailService === 'smtp2go') {
    return nodemailer.createTransport({
      host: 'mail.smtp2go.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Default to Gmail
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    // Use real SMTP if email credentials are configured, otherwise test account
    const transporter =
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_PASS !== 'your_app_password_here'
        ? createProductionTransporter()
        : await createTestAccount();

    const mailOptions = {
      from: '"Silsila-ul-Ahwaal" <noreply@masjid.com>',
      to: email,
      subject: 'Password Reset Request - Silsila-ul-Ahwaal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔑 Password Reset Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Silsila-ul-Ahwaal - Har Ghar Deen ka Markaz</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Assalamu Alaikum,
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Aapke account ke liye password reset ka request mila hai. Agar aapne ye request nahi kiya hai, to is email ko ignore kar sakte hain.
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
                🔄 Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              <strong>Note:</strong> Ye link 1 ghante ke liye valid hai. Agar link kaam nahi karta, to aap ye URL copy karke browser mein paste kar sakte hain:
            </p>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50;">
              <p style="margin: 0; font-size: 12px; color: #2E7D32; word-break: break-all;">
                ${resetUrl}
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Ye email Silsila-ul-Ahwaal system se bheja gaya hai.<br>
              Agar aapko koi confusion hai, to admin se contact karein.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Password reset email sent successfully');
    console.log('Message ID:', info.messageId);

    // Only log preview URL for test accounts
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl:
        process.env.NODE_ENV !== 'production'
          ? nodemailer.getTestMessageUrl(info)
          : null,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
    });
    throw error;
  }
};

const sendAdminNotificationEmail = async (notification, adminEmails) => {
  try {
    // Use real SMTP if email credentials are configured, otherwise test account
    const transporter =
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_PASS !== 'your_app_password_here'
        ? createProductionTransporter()
        : await createTestAccount();

    // Determine email template based on priority
    let subject, template;
    switch (notification.priority) {
      case 'CRITICAL':
        subject = '🚨 CRITICAL - Admin Notification';
        template = getCriticalEmailTemplate(notification);
        break;
      case 'IMPORTANT':
        subject = '⚠️ IMPORTANT - Admin Notification';
        template = getImportantEmailTemplate(notification);
        break;
      default:
        subject = '📢 Admin Notification';
        template = getRegularEmailTemplate(notification);
    }

    const mailOptions = {
      from: `"Silsila-ul-Ahwaal Admin" <${process.env.EMAIL_USER || 'noreply@masjid.com'}>`,
      to: adminEmails.join(', '),
      subject: subject,
      html: template,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Admin notification email sent successfully');
    console.log('Message ID:', info.messageId);
    console.log('Sent to:', adminEmails);

    // Only log preview URL for test accounts
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl:
        process.env.NODE_ENV !== 'production'
          ? nodemailer.getTestMessageUrl(info)
          : null,
      accepted: info.accepted,
      rejected: info.rejected,
      sentTo: adminEmails,
    };
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
    });
    throw error;
  }
};

// Email templates
const getCriticalEmailTemplate = (notification) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #d32f2f, #f44336); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">🚨 CRITICAL ALERT</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Silsila-ul-Ahwaal - Admin Notification</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #d32f2f; font-size: 18px;">Critical System Alert</h2>
      </div>
      
      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
        <strong>Message:</strong> ${notification.message}
      </p>
      
      <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Notification Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">User:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${notification.username}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Action:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${notification.action}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Resource:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${notification.resource}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666;">Timestamp:</td>
            <td style="padding: 8px 0; color: #333;">${new Date(notification.timestamp).toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" 
           style="background: linear-gradient(135deg, #d32f2f, #f44336); 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 25px; 
                  font-weight: bold; 
                  display: inline-block;
                  box-shadow: 0 4px 15px rgba(211, 47, 47, 0.3);">
          🔍 View Admin Panel
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        This is a critical alert from Silsila-ul-Ahwaal system.<br>
        Please take immediate action if required.
      </p>
    </div>
  </div>
`;

const getImportantEmailTemplate = (notification) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #f57c00, #ff9800); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">⚠️ IMPORTANT ALERT</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Silsila-ul-Ahwaal - Admin Notification</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #f57c00; font-size: 18px;">Important System Alert</h2>
      </div>
      
      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
        <strong>Message:</strong> ${notification.message}
      </p>
      
      <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Notification Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">User:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${notification.username}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Action:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${notification.action}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Resource:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${notification.resource}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666;">Timestamp:</td>
            <td style="padding: 8px 0; color: #333;">${new Date(notification.timestamp).toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" 
           style="background: linear-gradient(135deg, #f57c00, #ff9800); 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 25px; 
                  font-weight: bold; 
                  display: inline-block;
                  box-shadow: 0 4px 15px rgba(245, 124, 0, 0.3);">
          🔍 View Admin Panel
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        This is an important alert from Silsila-ul-Ahwaal system.<br>
        Please review when convenient.
      </p>
    </div>
  </div>
`;

const getRegularEmailTemplate = (notification) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">📢 Admin Notification</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Silsila-ul-Ahwaal - Admin Notification</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
        <strong>Message:</strong> ${notification.message}
      </p>
      
      <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Notification Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">User:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${notification.username}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Action:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${notification.action}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Resource:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${notification.resource}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666;">Timestamp:</td>
            <td style="padding: 8px 0; color: #333;">${new Date(notification.timestamp).toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" 
           style="background: linear-gradient(135deg, #2E7D32, #4CAF50); 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 25px; 
                  font-weight: bold; 
                  display: inline-block;
                  box-shadow: 0 4px 15px rgba(46, 125, 50, 0.3);">
          🔍 View Admin Panel
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        This is a notification from Silsila-ul-Ahwaal system.<br>
        No immediate action required.
      </p>
    </div>
  </div>
`;

module.exports = {
  sendPasswordResetEmail,
  sendAdminNotificationEmail,
};
