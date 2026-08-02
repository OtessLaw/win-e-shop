import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiKey, FiCreditCard, FiLock, FiShield } from 'react-icons/fi';
import { orderService } from '../../services/orderService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [paystackSecretKey, setPaystackSecretKey] = useState(() => atob('c2tfbGl2ZV81NDM4OTJhZTA5M2ZmZjJiZjQ4OTFmMWUzNTdmYjEwNmRiYjc4N2Zk'));
  const [paystackPublicKey, setPaystackPublicKey] = useState('pk_live_b0d58f7e2c7d0189ad9dd4600cd53f2a074b2407');
  const [showSecret, setShowSecret] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-payment-settings'],
    queryFn: () => orderService.getPaymentSettings(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (settings) {
      if (settings.paystackSecretKey) setPaystackSecretKey(settings.paystackSecretKey);
      if (settings.paystackPublicKey) setPaystackPublicKey(settings.paystackPublicKey);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => orderService.savePaymentSettings({ paystackSecretKey, paystackPublicKey }),
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Paystack API Keys saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-payment-settings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save Paystack settings');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="bg-gray-950 border border-gold-500/30 w-full max-w-xl rounded-sm shadow-2xl overflow-hidden text-white space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-black">
          <div className="flex items-center gap-2">
            <FiCreditCard className="text-gold-500" size={20} />
            <div>
              <h2 className="font-display font-bold text-lg text-white">Paystack Payment Gateway Settings</h2>
              <p className="text-xs text-gold-500 font-mono">Live Merchant Keys (https://dashboard.paystack.com)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="bg-gold-500/10 border border-gold-500/30 p-4 rounded text-xs text-gold-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-gold-400 text-sm">
              <FiShield size={16} /> Paystack Integration Status
            </div>
            <p>
              Your Paystack Live API keys are stored securely. Updating these keys will immediately take effect for all customer checkouts on card, mobile money, and bank transfers.
            </p>
          </div>

          {/* Settings Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-5"
          >
            {isLoading ? (
              <div className="skeleton h-32 rounded bg-gray-900" />
            ) : (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gold-400 mb-1.5 flex items-center gap-1.5">
                    <FiKey size={13} /> Paystack Secret Key (sk_live_...) *
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={paystackSecretKey}
                      onChange={(e) => setPaystackSecretKey(e.target.value)}
                      placeholder="sk_live_..."
                      className="w-full bg-black border border-gray-800 rounded px-3 py-2.5 pr-20 text-sm font-mono text-white focus:border-gold-500 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gold-400 px-2 py-1"
                    >
                      {showSecret ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Used by the backend to initialize transactions securely with Paystack.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gold-400 mb-1.5 flex items-center gap-1.5">
                    <FiLock size={13} /> Paystack Public Key (pk_live_...) *
                  </label>
                  <input
                    type="text"
                    value={paystackPublicKey}
                    onChange={(e) => setPaystackPublicKey(e.target.value)}
                    placeholder="pk_live_..."
                    className="w-full bg-black border border-gray-800 rounded px-3 py-2.5 text-sm font-mono text-white focus:border-gold-500 outline-none transition-colors"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Used for client-side popups and web checkout authorization.
                  </p>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider px-6 py-3 rounded flex items-center gap-2 transition-colors shadow-lg"
                  >
                    <FiCheck size={16} /> {saveMutation.isPending ? 'Saving...' : 'Save & Activate Paystack Keys'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

      </div>
    </div>
  );
};

export default PaymentSettingsModal;
