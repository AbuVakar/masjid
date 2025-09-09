const { logError } = require('./logger');

class WhatsAppService {
  constructor() {
    this.adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+919876543210';
    this.isEnabled = process.env.WHATSAPP_ENABLED === 'true';
    this.apiUrl =
      process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send';
  }

  // Format contact message for WhatsApp
  formatContactMessage(contactData) {
    const { category, name, mobile, message } = contactData;

    const formattedMessage = `🕌 *New Contact Message from Masjid Dashboard*

📋 *Category:* ${category}
👤 *Name:* ${name}
📱 *Mobile:* ${mobile || 'Not provided'}
💬 *Message:* ${message}

⏰ *Time:* ${new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}

---
*Sent from Masjid Dashboard System*`;

    return encodeURIComponent(formattedMessage);
  }

  // Generate WhatsApp URL
  generateWhatsAppUrl(contactData) {
    if (!this.isEnabled) {
      console.log('⚠️ WhatsApp integration is disabled');
      return null;
    }

    const message = this.formatContactMessage(contactData);
    const url = `${this.apiUrl}?phone=${this.adminNumber}&text=${message}`;

    console.log('📱 Generated WhatsApp URL:', url);
    return url;
  }

  // Send WhatsApp notification
  async sendWhatsAppNotification(contactData) {
    try {
      if (!this.isEnabled) {
        console.log('⚠️ WhatsApp integration is disabled');
        return { success: false, message: 'WhatsApp integration is disabled' };
      }

      const url = this.generateWhatsAppUrl(contactData);
      if (!url) {
        throw new Error('Failed to generate WhatsApp URL');
      }

      // Log the WhatsApp notification
      console.log('📱 WhatsApp notification prepared:', {
        adminNumber: this.adminNumber,
        category: contactData.category,
        name: contactData.name,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'WhatsApp notification prepared',
        url: url,
        adminNumber: this.adminNumber,
      };
    } catch (error) {
      logError(error, 'WhatsApp Notification', 'MEDIUM', {
        contactData: {
          category: contactData.category,
          name: contactData.name,
          hasMobile: !!contactData.mobile,
        },
      });

      return {
        success: false,
        message: 'Failed to prepare WhatsApp notification',
        error: error.message,
      };
    }
  }

  // Get admin phone number
  getAdminNumber() {
    return this.adminNumber;
  }

  // Check if WhatsApp is enabled
  isWhatsAppEnabled() {
    return this.isEnabled;
  }
}

module.exports = new WhatsAppService();
