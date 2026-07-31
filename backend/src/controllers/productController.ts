import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendPaginatedSuccess, getPaginationParams, buildPaginationResult, slugify } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';
import { cloudinary } from '../config/cloudinary';

// ─── Get All Products (with filters) ──────────────────────────────────────────
export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const {
      search, category, brand, gender, minPrice, maxPrice,
      color, size, rating, discount, sort, featured,
      bestSeller, newArrival, flashSale, isActive,
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (!req.user || !['super_admin', 'admin', 'product_manager'].includes(req.user.role)) {
      filter.isActive = true;
    } else if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Search by name or description (regex, case-insensitive)
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Category resolution (supports both ObjectId and category slug like 'men', 'shoes', etc.)
    if (category) {
      const catStr = String(category).trim().toLowerCase();
      if (catStr.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = catStr;
      } else {
        const catDoc = await Category.findOne({ slug: catStr });
        if (catDoc) {
          filter.category = catDoc._id;
        } else if (['men', 'women', 'unisex', 'kids'].includes(catStr)) {
          filter.gender = catStr;
        } else {
          // Attempt name regex match for category
          const matchedCat = await Category.findOne({ name: new RegExp(catStr, 'i') });
          if (matchedCat) filter.category = matchedCat._id;
        }
      }
    }

    if (brand) {
      if (String(brand).match(/^[0-9a-fA-F]{24}$/)) {
        filter.brand = brand;
      }
    }

    if (gender) filter.gender = String(gender).toLowerCase();
    if (featured === 'true') filter.isFeatured = true;
    if (bestSeller === 'true') filter.isBestSeller = true;
    if (newArrival === 'true') filter.isNewArrival = true;
    if (flashSale === 'true') filter.isFlashSale = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = Number(maxPrice);
    }
    if (color) filter['variants.color'] = color;
    if (size) filter['variants.sizes.size'] = size;
    if (rating) filter.ratingsAverage = { $gte: Number(rating) };

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price-desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { ratingsAverage: -1 };
    else if (sort === 'popular') sortOption = { soldCount: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const result = buildPaginationResult(products, total, page, limit);
    sendPaginatedSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Product ────────────────────────────────────────────────────────
export const getProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slugStr = String(req.params.slug);
    const isId = slugStr.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: slugStr } : { slug: slugStr };

    const product = await Product.findOne(query)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .populate({
        path: 'reviews',
        match: { isApproved: true },
        populate: { path: 'user', select: 'name avatar' },
      });

    if (!product) {
      return next(new AppError('Product not found.', 404));
    }

    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
};

// ─── Create Product ────────────────────────────────────────────────────────────
export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;

    // Guaranteed Fallbacks for All Required Schema Fields
    if (!data.name) {
      data.name = 'JJ Vintage Luxury Item';
    }

    if (!data.description) {
      data.description = data.shortDescription || data.name || 'JJ Vintage luxury collection item.';
    }

    if (!data.gender) {
      data.gender = 'unisex';
    }

    if (!data.price || Number(data.price) <= 0) {
      data.price = 100;
    }

    if (!data.category) {
      let firstCat = await Category.findOne({});
      if (!firstCat) {
        firstCat = await Category.create({
          name: 'General',
          slug: 'general',
          description: 'General store items',
        });
      }
      data.category = firstCat._id;
    }

    if (!data.slug) {
      data.slug = slugify(data.name) + '-' + Date.now().toString().slice(-4);
    }

    const existingSlug = await Product.findOne({ slug: data.slug });
    if (existingSlug) {
      data.slug = `${data.slug}-${Date.now().toString().slice(-4)}`;
    }

    if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
      data.variants = [
        {
          color: 'Default',
          colorHex: '#000000',
          sizes: [{ size: 'M', stock: 10, sku: `SKU-${Date.now()}` }],
          images: [],
        },
      ];
    } else {
      data.variants = data.variants.map((v: any, vi: number) => ({
        color: v.color || 'Default',
        colorHex: v.colorHex || '#000000',
        sizes: (v.sizes && v.sizes.length > 0)
          ? v.sizes.map((s: any, si: number) => ({
              size: s.size || 'M',
              stock: Number(s.stock) || 0,
              sku: s.sku || `SKU-${Date.now()}-${vi}-${si}`,
            }))
          : [{ size: 'M', stock: 10, sku: `SKU-${Date.now()}-${vi}` }],
        images: v.images || [],
      }));
    }

    if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
      data.images = [
        {
          url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
          publicId: 'default-placeholder',
        },
      ];
    }

    // Calculate total stock from all variants and sizes
    let computedStock = 0;
    if (Array.isArray(data.variants)) {
      data.variants.forEach((v: any) => {
        if (Array.isArray(v.sizes)) {
          v.sizes.forEach((s: any) => {
            computedStock += Number(s.stock) || 0;
          });
        }
      });
    }
    data.totalStock = computedStock;

    const product = await Product.create(data);

    if (product.category) await Category.findByIdAndUpdate(product.category, { $inc: { productCount: 1 } });
    if (product.brand) await Brand.findByIdAndUpdate(product.brand, { $inc: { productCount: 1 } });

    sendSuccess(res, product, 'Product created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Update Product ────────────────────────────────────────────────────────────
export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.name && !data.slug) {
      data.slug = slugify(data.name);
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('category brand');

    if (!product) return next(new AppError('Product not found.', 404));
    sendSuccess(res, product, 'Product updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── Delete Product ────────────────────────────────────────────────────────────
export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return next(new AppError('Product not found.', 404));

    await Product.findByIdAndDelete(id);
    if (product.category) await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    if (product.brand) await Brand.findByIdAndUpdate(product.brand, { $inc: { productCount: -1 } });

    sendSuccess(res, null, 'Product deleted successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── Upload Product Images ─────────────────────────────────────────────────────
export const uploadProductImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next(new AppError('No files uploaded.', 400));
    }

    const files = req.files as Express.Multer.File[];
    const isCloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'demo' &&
      process.env.CLOUDINARY_API_KEY
    );

    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        // Option 1: Cloudinary
        if (isCloudinaryConfigured) {
          try {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: 'jjvintage/products',
              transformation: [{ quality: 'auto:good', fetch_format: 'auto', width: 1200 }],
            });
            fs.unlink(file.path, () => {});
            return { url: result.secure_url, publicId: result.public_id };
          } catch {
            // Fallback if Cloudinary fails
          }
        }

        // Option 2: Automatic Free Image Host Cloud (tmpfiles.org)
        try {
          const form = new FormData();
          form.append('file', fs.createReadStream(file.path), file.originalname);
          const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders(),
          });
          if (response.data?.data?.url) {
            // Convert tmpfiles view URL to direct image download URL
            const rawUrl = response.data.data.url as string;
            const directUrl = rawUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            return { url: directUrl, publicId: `cloud-${Date.now()}` };
          }
        } catch {
          // Fallback to local
        }

        // Option 3: Local Server URL
        const fileName = path.basename(file.path);
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        const url = `${protocol}://${host}/uploads/${fileName}`;

        return { url, publicId: fileName };
      })
    );

    sendSuccess(res, uploadedImages, 'Images uploaded successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── Get Featured Products ──────────────────────────────────────────────────────
export const getFeaturedProducts = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .limit(12)
      .lean();
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
};

// ─── Get Best Sellers ──────────────────────────────────────────────────────────
export const getBestSellers = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .populate('category', 'name slug')
      .limit(12)
      .lean();
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
};

// ─── Get New Arrivals ──────────────────────────────────────────────────────────
export const getNewArrivals = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({ isNewArrival: true, isActive: true })
      .sort({ createdAt: -1 })
      .populate('category', 'name slug')
      .limit(12)
      .lean();
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
};

// ─── Get Flash Sale Products ───────────────────────────────────────────────────
export const getFlashSaleProducts = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({
      isFlashSale: true,
      isActive: true,
      flashSaleEndsAt: { $gt: new Date() },
    })
      .populate('category', 'name slug')
      .limit(20)
      .lean();
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
};

// ─── Get Related Products ──────────────────────────────────────────────────────
export const getRelatedProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return next(new AppError('Product not found.', 404));

    const related = await Product.find({
      _id: { $ne: id },
      category: product.category,
      isActive: true,
    })
      .limit(8)
      .lean();

    sendSuccess(res, related);
  } catch (err) {
    next(err);
  }
};
