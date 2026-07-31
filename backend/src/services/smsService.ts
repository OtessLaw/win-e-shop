import axios from 'axios';
import { SystemSetting } from '../models/SystemSetting';

export interface SendSMSOptions {
  to: string;
  message: string;
}

export interface SMSResult {
  success: boolean;
  provider: string;
  message: string;
}

export const getDynamicSMSConfig = async () => {
  try {
    const settings = await SystemSetting.find({
      key: { $in: ['sms_api_key', 'sms_sender_id', 'sms_provider', 'sms_endpoint'] }
    }).lean();

    const configMap: Record<string, string> = {};
    settings.forEach((s) => {
      configMap[s.key] = s.value;
    });

    const apiKey = (
      configMap['sms_api_key'] ||
      process.env.FASREACH_SMS_API_KEY ||
      process.env.SMS_API_KEY ||
      'bms_live_1785502841008_np14a00zkx'
    ).trim();

    const senderId = (
      configMap['sms_sender_id'] ||
      process.env.FASREACH_SMS_SENDER_ID ||
      process.env.SMS_SENDER_ID ||
      'JNJVINTAGE'
    ).trim().slice(0, 11);

    const smsEndpoint = (
      configMap['sms_endpoint'] ||
      process.env.FASREACH_SMS_API_URL ||
      process.env.SMS_API_URL ||
      'https://fasreach.com/api/sms/send'
    ).trim();

    const provider = (configMap['sms_provider'] || 'fasreach').toLowerCase();

    return { apiKey, senderId, smsEndpoint, provider };
  } catch {
    return {
      apiKey: 'bms_live_1785502841008_np14a00zkx',
      senderId: 'JNJVINTAGE',
      smsEndpoint: 'https://fasreach.com/api/sms/send',
      provider: 'fasreach',
    };
  }
};

export const sendSMS = async ({ to, message }: SendSMSOptions): Promise<SMSResult> => {
  try {
    const rawDigits = to.replace(/\D/g, '');
    const ghanaPhone10 = rawDigits.startsWith('233') ? `0${rawDigits.slice(3)}` : (rawDigits.startsWith('0') ? rawDigits : `0${rawDigits}`);
    const ghanaPhone233 = rawDigits.startsWith('233') ? rawDigits : `233${rawDigits.replace(/^0/, '')}`;
    const formattedPlus233 = `+${ghanaPhone233}`;

    const { apiKey, senderId, smsEndpoint, provider } = await getDynamicSMSConfig();

    console.log(`📱 [SMS Dispatching] To: ${ghanaPhone10} | Provider: ${provider} | Key: ${apiKey.slice(0, 10)}... | Sender: ${senderId}`);

    if (!apiKey || apiKey === 'your_api_key_here') {
      const msg = `No SMS API Key configured. Please enter your API Key in Admin SMS Settings.`;
      return { success: false, provider: 'Configuration Required', message: msg };
    }

    // ── 1. FasReach Official API ─────────────────────────────────────────
    if (provider === 'fasreach' || smsEndpoint.includes('fasreach.com')) {
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
            timeout: 12000,
          }
        );

        console.log(`✅ [FasReach API Success]:`, res.data);
        return {
          success: true,
          provider: 'FasReach',
          message: `SMS delivered via FasReach to ${ghanaPhone10} (Sender: ${senderId})`,
        };
      } catch (err1: any) {
        console.warn(`⚠️ First FasReach attempt with sender "${senderId}" failed:`, err1?.response?.data || err1?.message);

        // Fallback Attempt with sender "FASREACH"
        try {
          const resFallback = await axios.post(
            'https://fasreach.com/api/sms/send',
            {
              to: ghanaPhone10,
              message,
              sender: 'FASREACH',
            },
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
            provider: 'FasReach API Error',
            message: `FasReach Server HTTP ${statusCode}: ${detailedMsg}`,
          };
        }
      }
    }

    // ── 2. Arkesel API ───────────────────────────────────────────────────
    if (provider === 'arkesel' || smsEndpoint.includes('arkesel')) {
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
            timeout: 10000,
          }
        );
        return { success: true, provider: 'Arkesel', message: `SMS delivered via Arkesel to ${ghanaPhone233}` };
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || 'Arkesel error';
        return { success: false, provider: 'Arkesel Error', message: String(errMsg) };
      }
    }

    // ── 3. mNotify API ───────────────────────────────────────────────────
    if (provider === 'mnotify' || smsEndpoint.includes('mnotify')) {
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
            timeout: 10000,
          }
        );
        return { success: true, provider: 'mNotify', message: `SMS delivered via mNotify to ${ghanaPhone10}` };
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || 'mNotify error';
        return { success: false, provider: 'mNotify Error', message: String(errMsg) };
      }
    }

    // ── 4. Custom Endpoint ───────────────────────────────────────────────
    try {
      const res = await axios.post(
        smsEndpoint,
        {
          to: ghanaPhone10,
          recipient: formattedPlus233,
          phone: ghanaPhone233,
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
      return { success: true, provider: 'Custom Gateway', message: `SMS delivered via custom gateway to ${formattedPlus233}` };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Custom gateway error';
      return { success: false, provider: 'Custom Gateway Error', message: String(errMsg) };
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
