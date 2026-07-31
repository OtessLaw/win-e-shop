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
    // Format Ghana phone number (024XXXXXXX or 23324XXXXXXX)
    const rawDigits = to.replace(/\D/g, '');
    const ghanaPhone10 = rawDigits.startsWith('233') ? `0${rawDigits.slice(3)}` : (rawDigits.startsWith('0') ? rawDigits : `0${rawDigits}`);
    const ghanaPhone233 = rawDigits.startsWith('233') ? rawDigits : `233${rawDigits.replace(/^0/, '')}`;
    const formattedPlus233 = `+${ghanaPhone233}`;

    // Force live key provided by user
    const liveKey = 'bms_live_1785502841008_np14a00zkx';
    const envKey = (process.env.FASREACH_SMS_API_KEY || process.env.SMS_API_KEY || '').trim();
    const apiKey = (envKey && envKey !== 'your_api_key_here' && !envKey.includes('1785443302014')) ? envKey : liveKey;

    const senderId = (process.env.FASREACH_SMS_SENDER_ID || process.env.SMS_SENDER_ID || 'FASREACH').trim().slice(0, 11);

    console.log(`📱 [FasReach Dispatching] To: ${ghanaPhone10} | Key: ${apiKey.slice(0, 12)}... | Sender: ${senderId}`);

    // ── 1. FasReach Direct API Call ──────────────────────────────────────
    try {
      const payload = {
        to: ghanaPhone10,
        recipient: ghanaPhone10,
        phone: ghanaPhone10,
        message,
        sender: senderId,
      };

      const res = await axios.post(
        'https://fasreach.com/api/sms/send',
        payload,
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 12000,
        }
      );

      console.log(`✅ [FasReach API Success]:`, res.data);
      return {
        success: true,
        provider: 'FasReach',
        message: `SMS delivered via FasReach to ${ghanaPhone10} (Response: ${JSON.stringify(res.data)})`,
      };
    } catch (err1: any) {
      console.warn(`⚠️ First FasReach attempt with sender "${senderId}" failed:`, err1?.response?.data || err1?.message);

      // Fallback Attempt with sender "FASREACH" & 233 phone format
      try {
        const payloadFallback = {
          to: ghanaPhone10,
          recipient: ghanaPhone233,
          phone: ghanaPhone233,
          message,
          sender: 'FASREACH',
        };

        const resFallback = await axios.post(
          'https://fasreach.com/api/sms/send',
          payloadFallback,
          {
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            timeout: 12000,
          }
        );

        console.log(`✅ [FasReach Fallback Success]:`, resFallback.data);
        return {
          success: true,
          provider: 'FasReach Fallback',
          message: `SMS delivered via FasReach (Sender: FASREACH) to ${ghanaPhone10}`,
        };
      } catch (err2: any) {
        const rawResponse = err2?.response?.data;
        const statusCode = err2?.response?.status || 500;
        const detailedMsg = (typeof rawResponse === 'object' ? JSON.stringify(rawResponse) : rawResponse) || err2?.message || 'Server error';

        console.error(`❌ FasReach API Error HTTP ${statusCode}:`, detailedMsg);

        return {
          success: false,
          provider: 'FasReach API',
          message: `FasReach Server HTTP ${statusCode}: ${detailedMsg}`,
        };
      }
    }

  } catch (error: any) {
    const errorDetails = error?.response?.data || error?.message || 'Critical failure';
    console.error('❌ SMS Critical Error:', errorDetails);
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
