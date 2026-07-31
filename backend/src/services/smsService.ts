import axios from 'axios';

export interface SendSMSOptions {
  to: string;
  message: string;
}

export const sendSMS = async ({ to, message }: SendSMSOptions): Promise<boolean> => {
  try {
    // Format Ghana phone number (e.g. 0541234567 -> 233541234567 or +233541234567)
    const rawDigits = to.replace(/\D/g, '');
    const ghanaPhone10 = rawDigits.startsWith('233') ? `0${rawDigits.slice(3)}` : (rawDigits.startsWith('0') ? rawDigits : `0${rawDigits}`);
    const ghanaPhone233 = rawDigits.startsWith('233') ? rawDigits : `233${rawDigits.replace(/^0/, '')}`;
    const formattedPlus233 = `+${ghanaPhone233}`;

    const apiKey = process.env.FASREACH_SMS_API_KEY || process.env.SMS_API_KEY || process.env.ARKESEL_API_KEY || process.env.MNOTIFY_API_KEY;
    const smsEndpoint = process.env.FASREACH_SMS_API_URL || process.env.SMS_API_URL || 'https://bulk-sms-platform.vercel.app/api/send-sms';
    const senderId = process.env.FASREACH_SMS_SENDER_ID || process.env.SMS_SENDER_ID || 'JNJVINTAGE';

    if (!apiKey || apiKey === 'your_api_key_here') {
      console.log(`📱 [SMS Simulation Mode - No API Key Set] To: ${formattedPlus233} | Sender: ${senderId}`);
      console.log(`💬 Message: "${message}"`);
      return true;
    }

    const endpointLower = smsEndpoint.toLowerCase();

    // ── 1. Arkesel SMS API ──────────────────────────────────────────────
    if (endpointLower.includes('arkesel')) {
      await axios.post(
        smsEndpoint.includes('v2') ? smsEndpoint : 'https://api.arkesel.com/v2/sms/send',
        {
          sender: senderId.slice(0, 11),
          recipients: [ghanaPhone233],
          message,
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`📱 [Arkesel SMS Sent] To: ${ghanaPhone233}`);
      return true;
    }

    // ── 2. mNotify SMS API ──────────────────────────────────────────────
    if (endpointLower.includes('mnotify')) {
      await axios.post(
        'https://api.mnotify.com/api/sms/quick',
        {
          recipient: [ghanaPhone10],
          sender: senderId.slice(0, 11),
          message,
          is_schedule: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`📱 [mNotify SMS Sent] To: ${ghanaPhone10}`);
      return true;
    }

    // ── 3. Hubtel SMS API ──────────────────────────────────────────────
    if (endpointLower.includes('hubtel')) {
      const authHeader = apiKey.includes(':') ? `Basic ${Buffer.from(apiKey).toString('base64')}` : `Bearer ${apiKey}`;
      await axios.post(
        'https://smsc.hubtel.com/v1/messages/send',
        {
          From: senderId.slice(0, 11),
          To: ghanaPhone233,
          Content: message,
        },
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`📱 [Hubtel SMS Sent] To: ${ghanaPhone233}`);
      return true;
    }

    // ── 4. FasReach / Custom SMS Platform (Default) ─────────────────────
    await axios.post(
      smsEndpoint,
      {
        recipient: formattedPlus233,
        phone: ghanaPhone233,
        message,
        senderId: senderId.slice(0, 11),
        sender: senderId.slice(0, 11),
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`📱 [Custom/FasReach SMS Sent] To: ${formattedPlus233} via Sender ID: ${senderId}`);
    return true;
  } catch (error: any) {
    console.error('❌ SMS Send Error Details:', error?.response?.data || error?.message || error);
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
