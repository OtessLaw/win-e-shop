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
    // Format Ghana phone number (0541234567 or 233541234567)
    const rawDigits = to.replace(/\D/g, '');
    const ghanaPhone10 = rawDigits.startsWith('233') ? `0${rawDigits.slice(3)}` : (rawDigits.startsWith('0') ? rawDigits : `0${rawDigits}`);
    const ghanaPhone233 = rawDigits.startsWith('233') ? rawDigits : `233${rawDigits.replace(/^0/, '')}`;
    const formattedPlus233 = `+${ghanaPhone233}`;

    // Get configured API Key (defaulting to live key provided by user)
    const apiKey = (
      process.env.FASREACH_SMS_API_KEY ||
      process.env.SMS_API_KEY ||
      'bms_live_1785502841008_np14a00zkx'
    ).trim();

    const smsEndpoint = (
      process.env.FASREACH_SMS_API_URL ||
      process.env.SMS_API_URL ||
      'https://fasreach.com/api/sms/send'
    ).trim();

    const senderId = (
      process.env.FASREACH_SMS_SENDER_ID ||
      process.env.SMS_SENDER_ID ||
      'FASREACH'
    ).trim().slice(0, 11);

    // ── 1. FasReach Official API (Primary Integration) ───────────────────
    if (smsEndpoint.includes('fasreach.com')) {
      try {
        const res = await axios.post(
          'https://fasreach.com/api/sms/send',
          {
            to: ghanaPhone10,
            message,
            sender: senderId,
          },
          {
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        console.log(`📱 [FasReach SMS Sent Successfully] To: ${ghanaPhone10}`, res.data);
        return {
          success: true,
          provider: 'FasReach',
          message: `SMS delivered via FasReach to ${ghanaPhone10}`,
        };
      } catch (err: any) {
        console.error('❌ FasReach Primary API Error:', err?.response?.data || err?.message || err);
        const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'FasReach API Error';
        
        // If custom key was overridden and failed, fallback to secondary attempt
        if (smsEndpoint !== 'https://fasreach.com/api/sms/send') {
          console.warn('Trying secondary endpoint fallback...');
        } else {
          return {
            success: false,
            provider: 'FasReach Error',
            message: typeof errMsg === 'object' ? JSON.stringify(errMsg) : String(errMsg),
          };
        }
      }
    }

    // ── 2. Generic / Custom Endpoint Fallback ────────────────────────────
    try {
      const res = await axios.post(
        smsEndpoint || 'https://fasreach.com/api/sms/send',
        {
          to: ghanaPhone10,
          recipient: formattedPlus233,
          recipients: [ghanaPhone233],
          message,
          sender: senderId,
          senderId,
        },
        {
          headers: {
            'x-api-key': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log(`📱 [SMS Sent Successfully] To: ${ghanaPhone10}`, res.data);
      return {
        success: true,
        provider: 'FasReach Custom',
        message: `SMS delivered via FasReach gateway to ${ghanaPhone10}`,
      };
    } catch (err: any) {
      const errorDetails = err?.response?.data?.message || err?.response?.data || err?.message || 'FasReach delivery failed';
      console.error('❌ FasReach Gateway Error Details:', errorDetails);
      return {
        success: false,
        provider: 'FasReach Gateway Error',
        message: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : String(errorDetails),
      };
    }

  } catch (error: any) {
    const errorDetails = error?.response?.data?.message || error?.response?.data || error?.message || 'SMS delivery failed';
    console.error('❌ SMS Send Critical Error:', errorDetails);
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
