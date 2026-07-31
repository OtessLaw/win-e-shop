# 🛍️ JJ Vintage Collection — Luxury E-Commerce Platform

A production-ready, full-stack luxury fashion e-commerce web application tailored for **JJ Vintage Collection (Ghana)**.

---

## 🌟 Key Features Built

- 🎨 **Luxury Dark Mode & Aesthetics**: Pure Black (`#000000`) and Warm Gold (`#C9A227`) design system.
- 🎟️ **Promo & Discount Coupon Engine**: Percentage (%) and fixed GHS discount code validation in Cart & Checkout.
- 📱 **Automated SMS & WhatsApp Order Receipts**: Instant 1-click WhatsApp customer receipts and automated SMS dispatches upon order placement and status updates.
- 🖼️ **Dynamic Hero Banner Manager**: Upload and publish promotional hero slides directly from the admin panel.
- 👥 **Roles & Permissions Control**: Role-based access control (`super_admin`, `admin`, `product_manager`, `order_manager`, `customer`).
- 🛒 **Multi-step Ghana Checkout**: Paystack Mobile Money (MTN MoMo, Telecel Cash), Paystack Card, and Cash on Delivery.
- 📌 **Global Navigation Scroll Reset**: Page transitions automatically scroll to top.

---

## 🚀 Deployment Instructions

### 1. Backend Deployment (Render / Railway / Heroku / AWS)
- **Environment**: Node.js
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  ```env
  PORT=5000
  NODE_ENV=production
  MONGODB_URI=your_mongodb_atlas_connection_string
  JWT_SECRET=your_jwt_secret
  JWT_REFRESH_SECRET=your_jwt_refresh_secret
  CLIENT_URL=https://your-frontend-domain.vercel.app
  PAYSTACK_SECRET_KEY=your_paystack_secret_key
  CLOUDINARY_CLOUD_NAME=your_cloudinary_name
  CLOUDINARY_API_KEY=your_cloudinary_key
  CLOUDINARY_API_SECRET=your_cloudinary_secret
  ```

### 2. Frontend Deployment (Vercel / Netlify)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  ```env
  VITE_API_URL=https://your-backend-api.onrender.com/api
  VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
  ```

---

## 💻 Local Execution

1. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open **http://localhost:5173** in your browser.
