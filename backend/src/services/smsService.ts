import axios from 'axios';

export interface SendSMSOptions {
  to: string;
  message: string;
}

export const sendSMS = async ({ to, message }: SendSMSOptions): Promise<boolean> => {
  try {
    const formattedPhone = to.startsWith('+') ? to : `+233${to.replace(/^0/, '')}`;
    const smsEndpoint = process.env.FASREACH_SMS_API_URL || 'https://bulk-sms-platform.vercel.app/api/send-sms';
    const apiKey = process.env.FASREACH_SMS_API_KEY;

    // Dispatch request to custom FasReach SMS platform
    if (apiKey && apiKey !== 'your_api_key_here') {
      await axios.post(smsEndpoint, {
        recipient: formattedPhone,
        message,
        senderId: 'JJVINTAGE',
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`📱 [FasReach SMS Sent] To: ${formattedPhone}`);
    } else {
      console.log(`📱 [FasReach SMS Ready (Simulation Mode)] To: ${formattedPhone} | Message: "${message}"`);
    }

    return true;
  } catch (error) {
    console.error('FasReach SMS Send Error:', error);
    return false;
  }
};

export const smsTemplates = {
  orderPlaced: (name: string, orderNumber: string, total: string, city: string) =>
    `Thank you for your order #${orderNumber}, ${name}! Total: GH₵ ${total}. Your luxury vintage items are being prepared for delivery to ${city}. - JJ Vintage Collection Ghana 🇬🇭`,

  orderStatusUpdate: (name: string, orderNumber: string, status: string) =>
    `Hi ${name}, your JJ Vintage order #${orderNumber} status has been updated to: ${status.toUpperCase()}. Track live: http://localhost:5173/track-order`,

  paymentSuccess: (name: string, orderNumber: string, amount: string) =>
    `Payment Confirmed! GH₵ ${amount} received for order #${orderNumber}. Thank you for shopping with JJ Vintage Collection! ✨`,
};
