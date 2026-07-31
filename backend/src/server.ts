import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import connectDB from './config/database';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import apiRoutes from './routes/apiRoutes';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();
const server = http.createServer(app);
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://win-e-shop.onrender.com',
].filter(Boolean);

const io = new SocketIOServer(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// ─── Real-time Live GPS WebSockets ───────────────────────────────────────────
io.on('connection', (socket: any) => {
  console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

  // Customer streams live GPS location update
  socket.on('customer:location_update', (data: { orderId: string; latitude: number; longitude: number; speed?: number }) => {
    console.log(`📍 [Live GPS Update] Order #${data.orderId} -> Lat: ${data.latitude}, Lng: ${data.longitude}`);
    // Broadcast live coordinates to admin room/subscribers
    io.emit(`order:location:${data.orderId}`, data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    // Allow any Render subdomain
    if (origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true); // permissive for now — tighten after confirmed working
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
});

app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// ─── Request Middleware ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression() as express.RequestHandler);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', apiRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Keep-Alive Pinger for Render Free Tier ──────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const https = require('https');
  const RENDER_URL = 'https://win-e-shop.onrender.com/health';
  setInterval(() => {
    https.get(RENDER_URL, (res: any) => {
      console.log(`⏰ [Render Keep-Alive Ping] Status: ${res.statusCode}`);
    }).on('error', (err: any) => {
      console.error('⚠️ [Keep-Alive Ping Error]:', err.message);
    });
  }, 10 * 60 * 1000); // 10 minutes
}

const startServer = async () => {
  server.listen(PORT, () => {
    console.log(`\n🚀 JJ Vintage Collection API & WebSockets running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });

  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to MongoDB on startup:', err);
  }
};

startServer();

export default app;
