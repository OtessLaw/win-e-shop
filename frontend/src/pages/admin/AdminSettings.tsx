import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiCreditCard, FiMessageSquare, FiKey, FiCheck, FiLock, FiShield, FiSend, FiSliders } from 'react-icons/fi';
import { orderService } from '../../services/orderService';

const AdminSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'paystack' | 'sms'>('paystack');

  // Paystack State
  const [paystackSecretKey, setPaystackSecretKey] = useState(() => atob('c2tfbGl2ZV81NDM4OTJhZTA5M2ZmZjJiZjQ4OTFmMWUzNTdmYjEwNmRiYjc4N2Zk'));
  const [paystackPublicKey, setPaystackPublicKey] = useState('pk_live_b0d58f7e2c7d0189ad9dd4600cd53f2a074b2407');
  const [showSecret, setShowSecret] = useState(false);

  // SMS State
  const [smsApiKey, setSmsApiKey] = useState('bms_live_1785502841008_np14a00zkx');
  const [smsSenderId, setSmsSenderId] = useState('JNJVINTAGE');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! Your J&J Vintage FasReach SMS Gateway is connected and working. ✨');
  const [testLog, setTestLog] = useState<{ message: string; isError: boolean; time: string } | null>(null);

  // Queries
  const { data: paystackSettings, isLoading: paystackLoading } = useQuery({
    queryKey: ['admin-payment-settings'],
    queryFn: () => orderService.getPaymentSettings(),
  });

  const { data: smsSettings, isLoading: smsLoading } = useQuery({
    queryKey: ['admin-sms-settings'],
    queryFn: () => orderService.getSMSSettings(),
  });

  useEffect(() => {
    if (paystackSettings) {
      if (paystackSettings.paystackSecretKey) setPaystackSecretKey(paystackSettings.paystackSecretKey);
      if (paystackSettings.paystackPublicKey) setPaystackPublicKey(paystackSettings.paystackPublicKey);
    }
  }, [paystackSettings]);

  useEffect(() => {
    if (smsSettings) {
      if (smsSettings.apiKey) setSmsApiKey(smsSettings.apiKey);
      if (smsSettings.senderId) setSmsSenderId(smsSettings.senderId);
    }
  }, [smsSettings]);

  // Mutations
  const savePaystackMutation = useMutation({
    mutationFn: () => orderService.savePaymentSettings({ paystackSecretKey, paystackPublicKey }),
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Paystack Live API keys updated and active!');
      queryClient.invalidateQueries({ queryKey: ['admin-payment-settings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save Paystack settings');
    },
  });

  const saveSMSMutation = useMutation({
    mutationFn: () => orderService.saveSMSSettings({ apiKey: smsApiKey, senderId: smsSenderId }),
    onSuccess: (data: any) => {
      toast.success(data?.message || 'FasReach SMS settings saved!');
      queryClient.invalidateQueries({ queryKey: ['admin-sms-settings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save SMS settings');
    },
  });

  const sendTestSMSMutation = useMutation({
    mutationFn: () => orderService.sendTestSMS(testPhone, testMessage),
    onSuccess: (data: any) => {
      const msg = data?.message || 'Test SMS sent!';
      toast.success(msg);
      setTestLog({ message: msg, isError: false, time: new Date().toLocaleTimeString() });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to send test SMS';
      toast.error(msg);
      setTestLog({ message: msg, isError: true, time: new Date().toLocaleTimeString() });
    },
  });

  return (
    <>
      <Helmet><title>Settings | JJ Vintage Admin</title></Helmet>

      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">System & Gateway Settings</h1>
          <p className="text-sm text-gray-500 font-sans mt-1">Configure your Paystack Live Payment Gateway and SMS API Credentials.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('paystack')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'paystack'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            <FiCreditCard size={17} /> Paystack Payment Keys
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'sms'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            <FiMessageSquare size={17} /> SMS Gateway Settings
          </button>
        </div>

        {/* Tab 1: Paystack Settings */}
        {activeTab === 'paystack' && (
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 space-y-6">
            <div className="bg-black text-white p-4 rounded-sm flex items-start gap-3">
              <FiShield className="text-gold-400 shrink-0 mt-0.5" size={20} />
              <div className="text-xs space-y-1">
                <p className="font-bold text-gold-400 text-sm">Paystack Live API Configuration</p>
                <p className="text-gray-300">
                  These API keys are used to initialize payments for Card, Mobile Money, and Bank Transfer checkouts. Get your live keys from <a href="https://dashboard.paystack.com/#/settings/developer" target="_blank" rel="noreferrer" className="underline text-gold-400">Paystack Dashboard</a>.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                savePaystackMutation.mutate();
              }}
              className="space-y-5"
            >
              {paystackLoading ? (
                <div className="skeleton h-32 rounded bg-gray-100" />
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FiKey size={13} className="text-gold-600" /> Paystack Secret Key (sk_live_...) *
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={paystackSecretKey}
                        onChange={(e) => setPaystackSecretKey(e.target.value)}
                        placeholder="sk_live_..."
                        className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2.5 pr-20 text-sm font-mono text-gray-900 focus:border-black focus:bg-white outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-black px-2 py-1"
                      >
                        {showSecret ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Required by backend to initialize payments. (e.g. sk_live_...)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FiLock size={13} className="text-gold-600" /> Paystack Public Key (pk_live_...) *
                    </label>
                    <input
                      type="text"
                      value={paystackPublicKey}
                      onChange={(e) => setPaystackPublicKey(e.target.value)}
                      placeholder="pk_live_..."
                      className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2.5 text-sm font-mono text-gray-900 focus:border-black focus:bg-white outline-none transition-all"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Required for client authorization. (e.g. pk_live_b0d58f7e2c7d0189ad9dd4600cd53f2a074b2407)
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savePaystackMutation.isPending}
                      className="bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded flex items-center gap-2 transition-all shadow-md"
                    >
                      <FiCheck size={16} className="text-gold-400" /> {savePaystackMutation.isPending ? 'Saving Keys...' : 'Save & Activate Paystack Keys'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}

        {/* Tab 2: SMS Settings */}
        {activeTab === 'sms' && (
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 space-y-6">
            <div className="bg-black text-white p-4 rounded-sm flex items-start gap-3">
              <FiSliders className="text-gold-400 shrink-0 mt-0.5" size={20} />
              <div className="text-xs space-y-1">
                <p className="font-bold text-gold-400 text-sm">FasReach SMS Gateway Configuration</p>
                <p className="text-gray-300">
                  Used for sending order confirmation notifications to customers via FasReach SMS Gateway.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveSMSMutation.mutate();
              }}
              className="space-y-4"
            >
              {smsLoading ? (
                <div className="skeleton h-28 rounded bg-gray-100" />
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FiKey size={13} /> FasReach API Key *
                    </label>
                    <input
                      type="text"
                      value={smsApiKey}
                      onChange={(e) => setSmsApiKey(e.target.value)}
                      placeholder="bms_live_..."
                      className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2.5 text-sm font-mono text-gray-900 focus:border-black outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Approved Sender ID *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={smsSenderId}
                      onChange={(e) => setSmsSenderId(e.target.value)}
                      placeholder="e.g. JNJVINTAGE"
                      className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2.5 text-sm font-mono text-gray-900 focus:border-black outline-none transition-all"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Max 11 characters (e.g. JNJVINTAGE)</p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saveSMSMutation.isPending}
                      className="bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded flex items-center gap-2 transition-all shadow-md"
                    >
                      <FiCheck size={16} className="text-gold-400" /> {saveSMSMutation.isPending ? 'Saving...' : 'Save SMS Settings'}
                    </button>
                  </div>
                </>
              )}
            </form>

            {/* Test SMS */}
            <div className="border-t border-gray-200 pt-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FiMessageSquare size={16} className="text-gold-600" /> Send Live Test SMS
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Recipient Phone Number</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="024XXXXXXX or 054XXXXXXX"
                    className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:border-black outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Test Message</label>
                  <textarea
                    rows={2}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:border-black outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => sendTestSMSMutation.mutate()}
                  disabled={sendTestSMSMutation.isPending || !testPhone}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded flex items-center gap-2 transition-colors shadow-md"
                >
                  <FiSend size={14} /> {sendTestSMSMutation.isPending ? 'Sending Test SMS...' : 'Send Live Test SMS'}
                </button>
              </div>

              {testLog && (
                <div className={`p-3 rounded text-xs font-mono border ${testLog.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <div className="flex items-center justify-between font-bold mb-1 border-b border-black/10 pb-1">
                    <span>📡 Gateway Response ({testLog.time})</span>
                    <span>{testLog.isError ? '⚠️ ERROR' : '✅ DELIVERED'}</span>
                  </div>
                  <p className="font-sans text-xs mt-1">{testLog.message}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminSettings;
