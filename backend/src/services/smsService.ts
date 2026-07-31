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

export const sendSMS = async ({ to, message }: SendSMSOptions): Promise<SMSResult> => {
  try {
    // Clean and format Ghana phone number
    const rawDigits = to.replace(/\D/g, '');
    let ghanaPhone10 = rawDigits;
    if (rawDigits.startsWith('233')) {
      ghanaPhone10 = `0${rawDigits.slice(3)}`;
    } else if (!rawDigits.startsWith('0')) {
      ghanaPhone10 = `0${rawDigits}`;
    }

    // Get active API Key and Sender ID from DB or fallback
    let apiKey = 'bms_live_1785502841008_np14a00zkx';
    let senderId = 'JNJVINTAGE';

    try {
      const dbApiKey = await SystemSetting.findOne({ key: { $in: ['fasreach_api_key', 'sms_api_key'] } }).lean();
      if (dbApiKey?.value && dbApiKey.value.startsWith('bms_live_')) {
        apiKey = dbApiKey.value.trim();
      }

      const dbSender = await SystemSetting.findOne({ key: 'sms_sender_id' }).lean();
      if (dbSender?.value) {
        senderId = dbSender.value.trim().slice(0, 11);
      }
    } catch {
      // Use defaults if DB fetch fails
    }

    console.log(`📱 [FasReach Dispatch] Sending SMS to ${ghanaPhone10} using Sender: ${senderId}`);

    // Direct POST call to www.fasreach.com (MUST include www. to prevent 308 redirect body loss)
    const response = await axios.post(
      'https://www.fasreach.com/api/sms/send',
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
        timeout: 15000,
        maxRedirects: 5,
      }
    );

    console.log(`✅ [FasReach Success]:`, response.data);

    const apiMsg = response.data?.message || 'SMS dispatched successfully!';
    return {
      success: true,
      provider: 'FasReach',
      message: `📱 SMS delivered via FasReach to ${ghanaPhone10}: "${apiMsg}"`,
    };
  } catch (error: any) {
    console.error('❌ [FasReach Error]:', error?.response?.data || error?.message);

    const serverResponse = error?.response?.data;
    let errorDetail = error?.message || 'Failed to dispatch SMS';

    if (serverResponse) {
      if (typeof serverResponse === 'string') {
        errorDetail = serverResponse;
      } else if (serverResponse.message) {
        errorDetail = serverResponse.message;
      } else {
        errorDetail = JSON.stringify(serverResponse);
      }
    }

    return {
      success: false,
      provider: 'FasReach Gateway',
      message: `⚠️ FasReach Gateway Error: ${errorDetail}`,
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
