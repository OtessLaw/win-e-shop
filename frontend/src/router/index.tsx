import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';

// Lazy-loaded pages
const HomePage = lazy(() => import('../pages/public/HomePage'));
const ShopPage = lazy(() => import('../pages/public/ShopPage'));
const ProductPage = lazy(() => import('../pages/public/ProductPage'));
const CartPage = lazy(() => import('../pages/public/CartPage'));
const CheckoutPage = lazy(() => import('../pages/public/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('../pages/public/OrderConfirmationPage'));
const WishlistPage = lazy(() => import('../pages/public/WishlistPage'));
const TrackOrderPage = lazy(() => import('../pages/public/TrackOrderPage'));
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));
const FAQPage = lazy(() => import('../pages/public/FAQPage'));
const PrivacyPage = lazy(() => import('../pages/public/PrivacyPage'));
const TermsPage = lazy(() => import('../pages/public/TermsPage'));
const ReturnsPage = lazy(() => import('../pages/public/ReturnsPage'));
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'));

// Auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));

// Account pages
const AccountDashboard = lazy(() => import('../pages/account/AccountDashboard'));
const OrdersPage = lazy(() => import('../pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/account/OrderDetailPage'));
const ProfilePage = lazy(() => import('../pages/account/ProfilePage'));
const AddressesPage = lazy(() => import('../pages/account/AddressesPage'));
const NotificationsPage = lazy(() => import('../pages/account/NotificationsPage'));
const SecurityPage = lazy(() => import('../pages/account/SecurityPage'));

// Admin pages
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('../pages/admin/AdminProductForm'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('../pages/admin/AdminOrderDetail'));
const AdminCustomers = lazy(() => import('../pages/admin/AdminCustomers'));
const AdminRoles = lazy(() => import('../pages/admin/AdminRoles'));
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons'));
const AdminBanners = lazy(() => import('../pages/admin/AdminBanners'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminContent = lazy(() => import('../pages/admin/AdminContent'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-black border-t-gold-DEFAULT rounded-full animate-spin" />
      <p className="text-sm font-sans text-gray-500 tracking-widest uppercase">Loading</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense> },
      { path: 'shop', element: <Suspense fallback={<PageLoader />}><ShopPage /></Suspense> },
      { path: 'men', element: <Suspense fallback={<PageLoader />}><ShopPage gender="men" /></Suspense> },
      { path: 'women', element: <Suspense fallback={<PageLoader />}><ShopPage gender="women" /></Suspense> },
      { path: 'shoes', element: <Suspense fallback={<PageLoader />}><ShopPage categorySlug="shoes" /></Suspense> },
      { path: 'accessories', element: <Suspense fallback={<PageLoader />}><ShopPage categorySlug="accessories" /></Suspense> },
      { path: 'new-arrivals', element: <Suspense fallback={<PageLoader />}><ShopPage newArrival /></Suspense> },
      { path: 'best-sellers', element: <Suspense fallback={<PageLoader />}><ShopPage bestSeller /></Suspense> },
      { path: 'flash-sale', element: <Suspense fallback={<PageLoader />}><ShopPage flashSale /></Suspense> },
      { path: 'product/:slug', element: <Suspense fallback={<PageLoader />}><ProductPage /></Suspense> },
      { path: 'cart', element: <Suspense fallback={<PageLoader />}><CartPage /></Suspense> },
      { path: 'wishlist', element: <Suspense fallback={<PageLoader />}><WishlistPage /></Suspense> },
      { path: 'track-order', element: <Suspense fallback={<PageLoader />}><TrackOrderPage /></Suspense> },
      { path: 'about', element: <Suspense fallback={<PageLoader />}><AboutPage /></Suspense> },
      { path: 'contact', element: <Suspense fallback={<PageLoader />}><ContactPage /></Suspense> },
      { path: 'faq', element: <Suspense fallback={<PageLoader />}><FAQPage /></Suspense> },
      { path: 'privacy', element: <Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense> },
      { path: 'terms', element: <Suspense fallback={<PageLoader />}><TermsPage /></Suspense> },
      { path: 'returns', element: <Suspense fallback={<PageLoader />}><ReturnsPage /></Suspense> },

      // Checkout
      { path: 'checkout', element: <Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense> },
      { path: 'order-confirmation/:orderId', element: <Suspense fallback={<PageLoader />}><OrderConfirmationPage /></Suspense> },

      // Auth
      { path: 'login', element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
      { path: 'register', element: <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense> },
      { path: 'forgot-password', element: <Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense> },
      { path: 'reset-password/:token', element: <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense> },
      { path: 'verify-email/:token', element: <Suspense fallback={<PageLoader />}><VerifyEmailPage /></Suspense> },

      // Account (protected)
      {
        path: 'account',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><AccountDashboard /></Suspense></ProtectedRoute>,
      },
      {
        path: 'account/orders',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><OrdersPage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'account/orders/:id',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><OrderDetailPage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'account/profile',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'account/addresses',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><AddressesPage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'account/notifications',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'account/security',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><SecurityPage /></Suspense></ProtectedRoute>,
      },

      // 404
      { path: '*', element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense> },
    ],
  },

  // Admin (separate layout, protected)
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
      { path: 'products', element: <Suspense fallback={<PageLoader />}><AdminProducts /></Suspense> },
      { path: 'products/new', element: <Suspense fallback={<PageLoader />}><AdminProductForm /></Suspense> },
      { path: 'products/:id/edit', element: <Suspense fallback={<PageLoader />}><AdminProductForm /></Suspense> },
      { path: 'orders', element: <Suspense fallback={<PageLoader />}><AdminOrders /></Suspense> },
      { path: 'orders/:id', element: <Suspense fallback={<PageLoader />}><AdminOrderDetail /></Suspense> },
      { path: 'customers', element: <Suspense fallback={<PageLoader />}><AdminCustomers /></Suspense> },
      { path: 'roles', element: <Suspense fallback={<PageLoader />}><AdminRoles /></Suspense> },
      { path: 'coupons', element: <Suspense fallback={<PageLoader />}><AdminCoupons /></Suspense> },
      { path: 'banners', element: <Suspense fallback={<PageLoader />}><AdminBanners /></Suspense> },
      { path: 'analytics', element: <Suspense fallback={<PageLoader />}><AdminAnalytics /></Suspense> },
      { path: 'content', element: <Suspense fallback={<PageLoader />}><AdminContent /></Suspense> },
    ],
  },
]);

const AppRouter: React.FC = () => <RouterProvider router={router} />;
export default AppRouter;
