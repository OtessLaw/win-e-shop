import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { authService } from '../../services/authService';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token) {
      authService.verifyEmail(token)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    }
  }, [token]);

  return (
    <>
      <Helmet><title>Verify Email | JJ Vintage Collection</title></Helmet>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-2 border-black border-t-gold-DEFAULT rounded-full animate-spin mx-auto mb-6" />
              <p className="text-gray-500">Verifying your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="text-5xl mb-6">✅</div>
              <h1 className="font-display font-bold text-2xl mb-3">Email Verified!</h1>
              <p className="text-gray-400 text-sm mb-6">Your email has been verified successfully.</p>
              <Link to="/login" className="btn-primary">Login to Your Account</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="text-5xl mb-6">❌</div>
              <h1 className="font-display font-bold text-2xl mb-3">Verification Failed</h1>
              <p className="text-gray-400 text-sm mb-6">The link is invalid or has expired.</p>
              <Link to="/login" className="btn-secondary">Go to Login</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage;
