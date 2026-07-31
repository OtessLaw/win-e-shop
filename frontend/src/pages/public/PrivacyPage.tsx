import React from 'react';
import { Helmet } from 'react-helmet-async';

export const PrivacyPage: React.FC = () => (
  <>
    <Helmet><title>Privacy Policy | JJ Vintage Collection</title></Helmet>
    <div className="bg-black text-white py-16 text-center">
      <h1 className="font-display font-bold text-4xl">Privacy Policy</h1>
    </div>
    <div className="container-brand py-16 max-w-3xl prose text-gray-700 font-sans leading-relaxed">
      <p className="text-sm text-gray-400">Last updated: January 2026</p>
      <h2>1. Information We Collect</h2>
      <p>We collect personal information that you provide when creating an account, placing an order, subscribing to our newsletter, or contacting customer support. This includes your name, email address, phone number, delivery address, and payment information.</p>

      <h2>2. How We Use Your Information</h2>
      <p>Your information is used strictly to process orders, manage accounts, provide customer support, and send promotional updates if opted in. We do not sell your personal data to third parties.</p>

      <h2>3. Payment Security</h2>
      <p>All payments are processed securely via Paystack with end-to-end 256-bit SSL encryption. We do not store credit card or mobile money PIN information on our servers.</p>

      <h2>4. Cookies & Analytics</h2>
      <p>We use essential cookies to maintain your shopping cart session and preferences. Anonymous analytics data is used to improve our website experience.</p>
    </div>
  </>
);

export const TermsPage: React.FC = () => (
  <>
    <Helmet><title>Terms & Conditions | JJ Vintage Collection</title></Helmet>
    <div className="bg-black text-white py-16 text-center">
      <h1 className="font-display font-bold text-4xl">Terms & Conditions</h1>
    </div>
    <div className="container-brand py-16 max-w-3xl prose text-gray-700 font-sans leading-relaxed">
      <p className="text-sm text-gray-400">Last updated: January 2026</p>
      <h2>1. Introduction</h2>
      <p>Welcome to JJ Vintage Collection. By using our website and services in Ghana, you agree to comply with and be bound by these Terms & Conditions.</p>

      <h2>2. Products & Pricing</h2>
      <p>All prices are listed in Ghana Cedis (GHS) and include applicable taxes. We reserve the right to modify prices and availability without notice.</p>

      <h2>3. Orders & Delivery</h2>
      <p>Orders are processed once payment is confirmed or validated for Cash on Delivery. Delivery times are estimates and may vary based on location within Ghana.</p>
    </div>
  </>
);

export const ReturnsPage: React.FC = () => (
  <>
    <Helmet><title>Returns & Refunds | JJ Vintage Collection</title></Helmet>
    <div className="bg-black text-white py-16 text-center">
      <h1 className="font-display font-bold text-4xl">Returns & Refunds Policy</h1>
    </div>
    <div className="container-brand py-16 max-w-3xl prose text-gray-700 font-sans leading-relaxed">
      <p className="text-sm text-gray-400">Last updated: January 2026</p>
      <h2>1. 30-Day Return Window</h2>
      <p>You may return items within 30 days of delivery. Items must be unworn, unwashed, with all original tags and packaging intact.</p>

      <h2>2. Non-Returnable Items</h2>
      <p>For hygiene reasons, swimwear, undergarments, and clearance sale items cannot be returned unless defective.</p>

      <h2>3. Refund Process</h2>
      <p>Once returned items are inspected, refunds are issued via the original payment method (Mobile Money or Bank/Card) within 5–7 business days.</p>
    </div>
  </>
);

export default PrivacyPage;
