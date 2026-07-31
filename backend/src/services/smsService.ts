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

export interface SMSMultiConfig {
  fasreachApiKey: string;
  arkeselApiKey: string;
  mnotifyApiKey: string;
  senderId: string;
  primaryProvider: string;
  autoFailover: boolean;
  smsEndpoint: string;
}

export const getDynamicSMSConfig = async (): Promise<SMSMultiConfig> => {
  try {
    const settings = await SystemSetting.find({
      key: { $in: [
        'sms_api_key', 'fasreach_api_key', 'arkesel_api_key', 'mnotify_api_key',
        'sms_sender_id', 'sms_provider', 'sms_endpoint', 'auto_failover'
      ] }
    }).lean();

    const configMap: Record<string, string> = {};
    settings.forEach((s) => {
      configMap[s.key] = s.value;
    });

    const fasreachApiKey = (
      configMap['fasreach_api_key'] ||
      configMap['sms_api_key'] ||
      process.env.FASREACH_SMS_API_KEY ||
      process.env.SMS_API_KEY ||
      'bms_live_1785502841008_np14a00zkx'
    ).trim();

    const arkeselApiKey = (
      configMap['arkesel_api_key'] ||
      process.env.ARKESEL_API_KEY ||
      ''
    ).trim();

    const mnotifyApiKey = (
      configMap['mnotify_api_key'] ||
      process.env.MNOTIFY_API_KEY ||
      ''
    ).trim();

    const senderId = (
      configMap['sms_sender_id'] ||
      process.env.FASREACH_SMS_SENDER_ID ||
      process.env.SMS_SENDER_ID ||
      'JNJVINTAGE'
    ).trim().slice(0, 11);

    const primaryProvider = (configMap['sms_provider'] || 'fasreach').toLowerCase();
    const autoFailover = configMap['auto_failover'] !== 'false';
    const smsEndpoint = (configMap['sms_endpoint'] || 'https://fasreach.com/api/sms/send').trim();

    return {
      fasreachApiKey,
      arkeselApiKey,
      mnotifyApiKey,
      senderId,
      primaryProvider,
      autoFailover,
      smsEndpoint,
    };
  } catch {
    return {
      fasreachApiKey: 'bms_live_1785502841008_np14a00zkx',
      arkeselApiKey: '',
      mnotifyApiKey: '',
      senderId: 'JNJVINTAGE',
      primaryProvider: 'fasreach',
      autoFailover: true,
      smsEndpoint: 'https://fasreach.com/api/sms/send',
    };
  }
};

// Helper: Send via FasReach
const sendViaFasReach = async (phone10: string, message: string, senderId: string, apiKey: string): Promise<SMSResult> => {
  if (!apiKey) throw new Error('FasReach API Key not configured');
  
  // Try primary senderId
  try {
    const res = await axios.post(
      'https://fasreach.com/api/sms/send',
      { to: phone10, message, sender: senderId },
      { headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return { success: true, provider: 'FasReach', message: `SMS delivered via FasReach to ${phone10} (Sender: ${senderId})` };
  } catch {
    // Retry with FASREACH sender fallback
    const resFallback = await axios.post(
      'https://fasreach.com/api/sms/send',
      { to: phone10, message, sender: 'FASREACH' },
      { headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return { success: true, provider: 'FasReach Fallback', message: `SMS delivered via FasReach (Sender: FASREACH) to ${phone10}` };
  }
};

// Helper: Send via Arkesel
const sendViaArkesel = async (phone233: string, message: string, senderId: string, apiKey: string): Promise<SMSResult> => {
  if (!apiKey) throw new Error('Arkesel API Key not configured');

  const res = await axios.post(
    'https://api.arkesel.com/v2/sms/send',
    { sender: senderId, recipients: [phone233], message },
    { headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }, timeout: 10000 }
  );

  return { success: true, provider: 'Arkesel', message: `SMS delivered via Arkesel to ${phone233}` };
};

// Helper: Send via mNotify
const sendViaMNotify = async (phone10: string, message: string, senderId: string, apiKey: string): Promise<SMSResult> => {
  if (!apiKey) throw new Error('mNotify API Key not configured');

  const res = await axios.post(
    `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`,
    { recipient: [phone10], sender: senderId, message, is_schedule: false },
    { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 10000 }
  );

  return { success: true, provider: 'mNotify', message: `SMS delivered via mNotify to ${phone10}` };
};

export const sendSMS = async ({ to, message }: SendSMSOptions): Promise<SMSResult> => {
  const rawDigits = to.replace(/\D/g, '');
  const ghanaPhone10 = rawDigits.startsWith('233') ? `0${rawDigits.slice(3)}` : (rawDigits.startsWith('0') ? rawDigits : `0${rawDigits}`);
  const ghanaPhone233 = rawDigits.startsWith('233') ? rawDigits : `233${rawDigits.replace(/^0/, '')}`;

  const config = await getDynamicSMSConfig();
  const errors: string[] = [];

  // Attempt 1: Primary Provider
  if (config.primaryProvider === 'arkesel') {
    try {
      return await sendViaArkesel(ghanaPhone233, message, config.senderId, config.arkeselApiKey);
    } catch (e: any) {
      errors.push(`Arkesel Primary: ${e?.response?.data?.message || e?.message}`);
    }
  } else if (config.primaryProvider === 'mnotify') {
    try {
      return await sendViaMNotify(ghanaPhone10, message, config.senderId, config.mnotifyApiKey);
    } catch (e: any) {
      errors.push(`mNotify Primary: ${e?.response?.data?.message || e?.message}`);
    }
  } else {
    // Default FasReach
    try {
      return await sendViaFasReach(ghanaPhone10, message, config.senderId, config.fasreachApiKey);
    } catch (e: any) {
      errors.push(`FasReach Primary: ${e?.response?.data?.message || e?.message}`);
    }
  }

  // If Primary succeeded, it returned. If it failed & Auto-Failover enabled:
  if (config.autoFailover) {
    // Failover Attempt 1: FasReach (if not primary)
    if (config.primaryProvider !== 'fasreach' && config.fasreachApiKey) {
      try {
        const res = await sendViaFasReach(ghanaPhone10, message, config.senderId, config.fasreachApiKey);
        res.message = `[Failover Active] ${res.message}`;
        return res;
      } catch (e: any) {
        errors.push(`FasReach Failover: ${e?.response?.data?.message || e?.message}`);
      }
    }

    // Failover Attempt 2: Arkesel (if not primary)
    if (config.primaryProvider !== 'arkesel' && config.arkeselApiKey) {
      try {
        const res = await sendViaArkesel(ghanaPhone233, message, config.senderId, config.arkeselApiKey);
        res.message = `[Failover Active] ${res.message}`;
        return res;
      } catch (e: any) {
        errors.push(`Arkesel Failover: ${e?.response?.data?.message || e?.message}`);
      }
    }

    // Failover Attempt 3: mNotify (if not primary)
    if (config.primaryProvider !== 'mnotify' && config.mnotifyApiKey) {
      try {
        const res = await sendViaMNotify(ghanaPhone10, message, config.senderId, config.mnotifyApiKey);
        res.message = `[Failover Active] ${res.message}`;
        return res;
      } catch (e: any) {
        errors.push(`mNotify Failover: ${e?.response?.data?.message || e?.message}`);
      }
    }
  }

  return {
    success: false,
    provider: 'Multi-Gateway Failure',
    message: `All SMS Gateways failed. Logs: ${errors.join(' | ')}`,
  };
};

export const smsTemplates = {
  orderPlaced: (name: string, orderNumber: string, total: string, city: string) =>
    `Thank you for your order #${orderNumber}, ${name}! Total: GH₵ ${total}. Your luxury vintage items are being prepared for delivery to ${city}. - J&J Vintage Collection Ghana 🇬🇭`,

  orderStatusUpdate: (name: string, orderNumber: string, status: string) =>
    `Hi ${name}, your J&J Vintage order #${orderNumber} status has been updated to: ${status.toUpperCase()}. Track live: https://win-e-shop.onrender.com/track-order`,

  paymentSuccess: (name: string, orderNumber: string, amount: string) =>
    `Payment Confirmed! GH₵ ${amount} received for order #${orderNumber}. Thank you for shopping with J&J Vintage Collection! ✨`,
};
