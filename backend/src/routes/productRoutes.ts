import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  uploadProductImages, getFeaturedProducts, getBestSellers, getNewArrivals,
  getFlashSaleProducts, getRelatedProducts,
} from '../controllers/productController';
import { protect, requirePermission, optionalAuth } from '../middleware/auth';

const router = Router();

// Ensure uploads folder exists with proper file extensions
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadsDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ext || ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic'].includes(ext) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/flash-sale', getFlashSaleProducts);
router.get('/:id/related', getRelatedProducts);
router.get('/:slug', optionalAuth, getProduct);
router.get('/', optionalAuth, getProducts);

// Protected admin routes
router.post('/', protect, requirePermission('products:create'), createProduct);
router.patch('/:id', protect, requirePermission('products:update'), updateProduct);
router.delete('/:id', protect, requirePermission('products:delete'), deleteProduct);
router.post('/upload-images', protect, upload.array('images', 10), uploadProductImages);

export default router;
