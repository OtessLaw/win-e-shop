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
    const senderId = process.env.FASREACH_SMS_SENDER_ID || 'JNJVINTAGE';

    // Dispatch request to SMS platform
    if (apiKey && apiKey !== 'your_api_key_here') {
      await axios.post(smsEndpoint, {
        recipient: formattedPhone,
        message,
        senderId,
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`📱 [SMS Sent] To: ${formattedPhone} via Sender ID: ${senderId}`);
    } else {
      console.log(`📱 [SMS Simulation Mode] To: ${formattedPhone} | Message: "${message}"`);
    }

    return true;
  } catch (error: any) {
    console.error('SMS Send Error:', error?.response?.data || error?.message || error);
    return false;
  }
};

export const smsTemplates = {
  orderPlaced: (name: string, orderNumber: string, total: string, city: string) =>
    `Thank you for your order #${orderNumber}, ${name}! Total: GH₵ ${total}. Your luxury vintage items are being prepared for delivery to ${city}. - J&J Vintage Collection Ghana 🇬🇭`,

  orderStatusUpdate: (name: string, orderNumber: string, status: string) =>
    `Hi ${name}, your J&J Vintage order #${orderNumber} status has been updated to: ${status.toUpperCase()}. Track live: https://win-e-shop.onrender.com/track-order`,

  paymentSuccess: (name: string, orderNumber: string, amount: string) =>
    `Payment Confirmed! GH₵ ${amount} received for order #${orderNumber}. Thank you for shopping with J&J Vintage Collection! ✨`,
};
