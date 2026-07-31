import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiSend, FiKey, FiMessageSquare, FiSliders, FiShield } from 'react-icons/fi';
import { orderService } from '../../services/orderService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SMSSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [fasreachApiKey, setFasreachApiKey] = useState('bms_live_1785502841008_np14a00zkx');
  const [arkeselApiKey, setArkeselApiKey] = useState('');
  const [mnotifyApiKey, setMnotifyApiKey] = useState('');
  const [senderId, setSenderId] = useState('JNJVINTAGE');
  const [provider, setProvider] = useState('fasreach');
  const [autoFailover, setAutoFailover] = useState(true);

  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! Your J&J Vintage Multi-Gateway SMS system is working perfectly. ✨');
  const [testLog, setTestLog] = useState<{ message: string; isError: boolean; time: string } | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-sms-settings'],
    queryFn: () => orderService.getSMSSettings(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (settings) {
      if (settings.fasreachApiKey) setFasreachApiKey(settings.fasreachApiKey);
      if (settings.arkeselApiKey) setArkeselApiKey(settings.arkeselApiKey);
      if (settings.mnotifyApiKey) setMnotifyApiKey(settings.mnotifyApiKey);
      if (settings.senderId) setSenderId(settings.senderId);
      if (settings.primaryProvider) setProvider(settings.primaryProvider);
      if (settings.autoFailover !== undefined) setAutoFailover(settings.autoFailover);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => orderService.saveSMSSettings({
      fasreachApiKey,
      arkeselApiKey,
      mnotifyApiKey,
      senderId,
      provider,
      autoFailover,
    }),
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Multi-Gateway SMS settings saved!');
      queryClient.invalidateQueries({ queryKey: ['admin-sms-settings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    },
  });

  const sendTestMutation = useMutation({
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="bg-gray-950 border border-gold-500/30 w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden text-white space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-black">
          <div className="flex items-center gap-2">
            <FiSliders className="text-gold-500" size={18} />
            <div>
              <h2 className="font-display font-bold text-lg text-white">Multi-Gateway SMS Settings</h2>
              <p className="text-xs text-gold-500 font-mono">FasReach • Arkesel • mNotify Multi-API Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Settings Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="skeleton h-32 rounded bg-gray-900" />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-gold-400 mb-1.5">
                      Primary SMS Gateway
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full bg-black border border-gray-800 rounded px-3 py-2.5 text-sm font-mono text-white focus:border-gold-500 outline-none transition-colors"
                    >
                      <option value="fasreach">FasReach (fasreach.com)</option>
                      <option value="arkesel">Arkesel (arkesel.com)</option>
                      <option value="mnotify">mNotify (mnotify.com)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-gold-400 mb-1.5">
                      Approved Sender ID *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={senderId}
                      onChange={(e) => setSenderId(e.target.value)}
                      placeholder="e.g. JNJVINTAGE"
                      className="w-full bg-black border border-gray-800 rounded px-3 py-2.5 text-sm font-mono text-white focus:border-gold-500 outline-none transition-colors"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Ghana Approved Sender ID (e.g. JNJVINTAGE)
                    </p>
                  </div>
                </div>

                {/* API Keys */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono uppercase text-gray-400 border-b border-gray-800 pb-1 flex items-center gap-1">
                    <FiKey size={12} /> Gateway API Keys (Multi-API Configuration)
                  </h4>

                  <div>
                    <label className="block text-xs text-gold-400 font-mono mb-1">1. FasReach API Key</label>
                    <input
                      type="text"
                      value={fasreachApiKey}
                      onChange={(e) => setFasreachApiKey(e.target.value)}
                      placeholder="bms_live_..."
                      className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm font-mono text-white focus:border-gold-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gold-400 font-mono mb-1">2. Arkesel API Key (Optional / Failover)</label>
                    <input
                      type="text"
                      value={arkeselApiKey}
                      onChange={(e) => setArkeselApiKey(e.target.value)}
                      placeholder="Enter Arkesel API Key..."
                      className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm font-mono text-white focus:border-gold-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gold-400 font-mono mb-1">3. mNotify API Key (Optional / Failover)</label>
                    <input
                      type="text"
                      value={mnotifyApiKey}
                      onChange={(e) => setMnotifyApiKey(e.target.value)}
                      placeholder="Enter mNotify API Key..."
                      className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm font-mono text-white focus:border-gold-500 outline-none"
                    />
                  </div>
                </div>

                {/* Failover Toggle */}
                <div className="bg-gray-900/60 p-3 rounded border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiShield className="text-gold-500" size={16} />
                    <div>
                      <p className="text-xs font-bold text-white">Enable Real-Time Gateway Failover</p>
                      <p className="text-[11px] text-gray-400">If Primary fails or runs out of credits, automatically send via backup provider</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoFailover}
                    onChange={(e) => setAutoFailover(e.target.checked)}
                    className="w-4 h-4 accent-gold-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded flex items-center gap-2 transition-colors shadow-lg"
                  >
                    <FiCheck size={14} /> {saveMutation.isPending ? 'Saving...' : 'Save Multi-Gateway Settings'}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Test SMS Section */}
          <div className="border-t border-gray-800 pt-5 space-y-4">
            <h3 className="font-display font-bold text-sm text-gold-400 flex items-center gap-2">
              <FiMessageSquare size={15} /> Send Live Test SMS
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Recipient Phone Number</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="024XXXXXXX or 054XXXXXXX"
                  className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Test Message</label>
                <textarea
                  rows={2}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-gold-500 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => sendTestMutation.mutate()}
                disabled={sendTestMutation.isPending || !testPhone}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded flex items-center gap-2 transition-colors shadow-md"
              >
                <FiSend size={14} /> {sendTestMutation.isPending ? 'Sending Test SMS...' : 'Send Live Test SMS'}
              </button>
            </div>

            {/* Diagnostic Log */}
            {testLog && (
              <div className={`p-3 rounded text-xs font-mono border ${testLog.isError ? 'bg-red-950/50 border-red-500/50 text-red-300' : 'bg-green-950/50 border-green-500/50 text-green-300'}`}>
                <div className="flex items-center justify-between font-bold mb-1 border-b border-white/10 pb-1">
                  <span>📡 Gateway Response ({testLog.time})</span>
                  <span>{testLog.isError ? '⚠️ ERROR' : '✅ DELIVERED'}</span>
                </div>
                <p className="text-white font-sans text-xs mt-1">{testLog.message}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SMSSettingsModal;
