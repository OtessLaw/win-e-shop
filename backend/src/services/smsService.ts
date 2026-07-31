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

    const apiKey = (process.env.SMS_API_KEY || process.env.FASREACH_SMS_API_KEY || process.env.ARKESEL_API_KEY || process.env.MNOTIFY_API_KEY || process.env.HUBTEL_API_KEY || '').trim();
    const smsEndpoint = (process.env.SMS_API_URL || process.env.FASREACH_SMS_API_URL || '').trim();
    const senderId = (process.env.SMS_SENDER_ID || process.env.FASREACH_SMS_SENDER_ID || 'JNJVINTAGE').trim().slice(0, 11);

    if (!apiKey || apiKey === 'your_api_key_here') {
      const msg = `No SMS API Key found in Render environment variables. Please set SMS_API_KEY on Render.`;
      console.log(`📱 [SMS Simulation Mode] To: ${formattedPlus233} | ${msg}`);
      return { success: false, provider: 'simulation', message: msg };
    }

    // ── If explicit custom SMS_API_URL is provided ──────────────────────
    if (smsEndpoint) {
      try {
        const res = await axios.post(
          smsEndpoint,
          {
            recipient: formattedPlus233,
            recipients: [ghanaPhone233],
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
            timeout: 10000,
          }
        );
        console.log(`📱 [Custom Endpoint SMS Sent] To: ${formattedPlus233}`, res.data);
        return { success: true, provider: 'Custom Endpoint', message: `SMS delivered via custom gateway to ${formattedPlus233}` };
      } catch (err: any) {
        console.warn(`⚠️ Custom Endpoint failed, trying provider fallback chain...`, err?.message);
      }
    }

    // ── Auto Fallback Chain across Top Ghana SMS Gateways ──────────────

    // Attempt 1: Arkesel
    try {
      const res = await axios.post(
        'https://api.arkesel.com/v2/sms/send',
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
          timeout: 8000,
        }
      );
      if (res.data?.status === 'success' || res.status === 200) {
        console.log(`📱 [Arkesel SMS Sent] To: ${ghanaPhone233}`, res.data);
        return { success: true, provider: 'Arkesel', message: `SMS delivered via Arkesel to ${ghanaPhone233}` };
      }
    } catch (e: any) {
      console.log(`[SMS Provider Check] Arkesel attempt did not match key:`, e?.response?.data || e?.message);
    }

    // Attempt 2: mNotify
    try {
      const res = await axios.post(
        `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`,
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
          timeout: 8000,
        }
      );
      if (res.data?.status === 'success' || res.status === 200) {
        console.log(`📱 [mNotify SMS Sent] To: ${ghanaPhone10}`, res.data);
        return { success: true, provider: 'mNotify', message: `SMS delivered via mNotify to ${ghanaPhone10}` };
      }
    } catch (e: any) {
      console.log(`[SMS Provider Check] mNotify attempt did not match key:`, e?.response?.data || e?.message);
    }

    // Attempt 3: Hubtel
    try {
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
          timeout: 8000,
        }
      );
      if (res.status === 200 || res.status === 201) {
        console.log(`📱 [Hubtel SMS Sent] To: ${ghanaPhone233}`, res.data);
        return { success: true, provider: 'Hubtel', message: `SMS delivered via Hubtel to ${ghanaPhone233}` };
      }
    } catch (e: any) {
      console.log(`[SMS Provider Check] Hubtel attempt did not match key:`, e?.response?.data || e?.message);
    }

    // Attempt 4: FasReach Platform
    try {
      const res = await axios.post(
        'https://bulk-sms-platform.vercel.app/api/send-sms',
        {
          recipient: formattedPlus233,
          message,
          senderId,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );
      console.log(`📱 [FasReach SMS Sent] To: ${formattedPlus233}`, res.data);
      return { success: true, provider: 'FasReach', message: `SMS delivered via FasReach to ${formattedPlus233}` };
    } catch (e: any) {
      console.log(`[SMS Provider Check] FasReach attempt failed:`, e?.response?.data || e?.message);
    }

    return {
      success: false,
      provider: 'Gateway Error',
      message: `SMS Gateway rejected your API key. Please check your SMS_API_KEY and SMS_API_URL environment variables on Render.`,
    };

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
