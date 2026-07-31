import axios from 'axios';

export interface SendSMSOptions {
  to: string;
  message: string;
}

export interface SMSResult {
  success: boolean;
  provider: string;
  message: string;
}

export const sendSMS = async ({ to, message }: SendSMSOptions): Promise<SMSResult> => {
  try {
    const rawDigits = to.replace(/\D/g, '');
    const ghanaPhone10 = rawDigits.startsWith('233') ? `0${rawDigits.slice(3)}` : (rawDigits.startsWith('0') ? rawDigits : `0${rawDigits}`);
    const ghanaPhone233 = rawDigits.startsWith('233') ? rawDigits : `233${rawDigits.replace(/^0/, '')}`;
    const formattedPlus233 = `+${ghanaPhone233}`;

    const apiKey = process.env.SMS_API_KEY || process.env.FASREACH_SMS_API_KEY || process.env.ARKESEL_API_KEY || process.env.MNOTIFY_API_KEY || process.env.HUBTEL_API_KEY;
    const smsEndpoint = process.env.SMS_API_URL || process.env.FASREACH_SMS_API_URL || '';
    const senderId = (process.env.SMS_SENDER_ID || process.env.FASREACH_SMS_SENDER_ID || 'JNJVINTAGE').slice(0, 11);

    if (!apiKey || apiKey === 'your_api_key_here') {
      const msg = `No SMS API Key found in Render environment. Please add SMS_API_KEY in Render.`;
      console.log(`📱 [SMS Simulation Mode] To: ${formattedPlus233} | ${msg}`);
      return { success: false, provider: 'simulation', message: msg };
    }

    const endpointLower = smsEndpoint.toLowerCase();
    const keyLower = apiKey.toLowerCase();

    // ── 1. Arkesel Auto-Detection ─────────────────────────────────────────
    if (endpointLower.includes('arkesel') || keyLower.includes('arkesel') || process.env.ARKESEL_API_KEY) {
      const targetUrl = smsEndpoint || 'https://api.arkesel.com/v2/sms/send';
      const res = await axios.post(
        targetUrl,
        {
          sender: senderId,
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
      console.log(`📱 [Arkesel SMS Sent] To: ${ghanaPhone233}`, res.data);
      return { success: true, provider: 'Arkesel', message: `SMS delivered via Arkesel to ${ghanaPhone233}` };
    }

    // ── 2. mNotify Auto-Detection ─────────────────────────────────────────
    if (endpointLower.includes('mnotify') || keyLower.includes('mnotify') || process.env.MNOTIFY_API_KEY) {
      const targetUrl = `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`;
      const res = await axios.post(
        targetUrl,
        {
          recipient: [ghanaPhone10],
          sender: senderId,
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
      console.log(`📱 [mNotify SMS Sent] To: ${ghanaPhone10}`, res.data);
      return { success: true, provider: 'mNotify', message: `SMS delivered via mNotify to ${ghanaPhone10}` };
    }

    // ── 3. Hubtel Auto-Detection ─────────────────────────────────────────
    if (endpointLower.includes('hubtel') || process.env.HUBTEL_API_KEY) {
      const authHeader = apiKey.includes(':') ? `Basic ${Buffer.from(apiKey).toString('base64')}` : `Bearer ${apiKey}`;
      const res = await axios.post(
        'https://smsc.hubtel.com/v1/messages/send',
        {
          From: senderId,
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
      console.log(`📱 [Hubtel SMS Sent] To: ${ghanaPhone233}`, res.data);
      return { success: true, provider: 'Hubtel', message: `SMS delivered via Hubtel to ${ghanaPhone233}` };
    }

    // ── 4. Custom / Generic / FasReach SMS Gateway ────────────────────────
    const targetUrl = smsEndpoint || 'https://bulk-sms-platform.vercel.app/api/send-sms';
    const res = await axios.post(
      targetUrl,
      {
        recipient: formattedPlus233,
        phone: ghanaPhone233,
        message,
        senderId,
        sender: senderId,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`📱 [Generic SMS Sent] To: ${formattedPlus233} via ${targetUrl}`, res.data);
    return { success: true, provider: 'Generic Gateway', message: `SMS delivered via gateway to ${formattedPlus233}` };

  } catch (error: any) {
    const errorDetails = error?.response?.data?.message || error?.response?.data || error?.message || 'SMS delivery failed';
    console.error('❌ SMS Send Error Details:', errorDetails);
    return {
      success: false,
      provider: 'Gateway Error',
      message: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : String(errorDetails),
    };
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
