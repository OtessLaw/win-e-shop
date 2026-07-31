import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import connectDB from '../config/database';

dotenv.config();

// Test product image (free placeholder from picsum)
const img = (id: number) => ({
  url: `https://picsum.photos/seed/${id}/600/800`,
  publicId: `test-${id}`,
  alt: 'Product image',
});

const makeVariant = (color: string, hex: string, stock: number) => ({
  color,
  colorHex: hex,
  sizes: [
    { size: 'S',  stock: Math.ceil(stock * 0.2), sku: `TEST-${color.toUpperCase()}-S-${Date.now()}` },
    { size: 'M',  stock: Math.ceil(stock * 0.4), sku: `TEST-${color.toUpperCase()}-M-${Date.now()}` },
    { size: 'L',  stock: Math.ceil(stock * 0.3), sku: `TEST-${color.toUpperCase()}-L-${Date.now()}` },
    { size: 'XL', stock: Math.ceil(stock * 0.1), sku: `TEST-${color.toUpperCase()}-XL-${Date.now()}` },
  ],
  images: [img(Math.floor(Math.random() * 100))],
});

export const seedTestProducts = async (): Promise<void> => {
  await connectDB();

  // Get or create categories
  const catNames = ['men', 'women', 'shoes', 'accessories'];
  const catMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const slug of catNames) {
    let cat = await Category.findOne({ slug });
    if (!cat) {
      cat = await Category.create({
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        slug,
        isActive: true,
      });
    }
    catMap[slug] = cat._id as mongoose.Types.ObjectId;
  }

  const TEST_PRODUCTS = [
    // ── Men's ─────────────────────────────────────────────────────
    {
      name: 'Classic White Dress Shirt',
      slug: 'test-classic-white-dress-shirt',
      description: 'Crisp white dress shirt perfect for any formal occasion. Premium cotton blend.',
      shortDescription: 'Premium white formal shirt',
      price: 1,
      compareAtPrice: 5,
      category: catMap['men'],
      gender: 'men' as const,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
      tags: ['shirt', 'formal', 'white', 'men'],
      images: [img(10), img(11)],
      variants: [makeVariant('White', '#FFFFFF', 50), makeVariant('Light Blue', '#ADD8E6', 30)],
    },
    {
      name: 'Vintage Kente Trousers',
      slug: 'test-vintage-kente-trousers',
      description: 'Traditional Kente-inspired trousers with vibrant patterns. A true Ghana fashion statement.',
      shortDescription: 'Colourful Kente pattern trousers',
      price: 2,
      compareAtPrice: 8,
      category: catMap['men'],
      gender: 'men' as const,
      isFeatured: true,
      isNewArrival: true,
      tags: ['trousers', 'kente', 'ghana', 'traditional'],
      images: [img(20), img(21)],
      variants: [makeVariant('Kente Gold', '#FFD700', 40)],
    },
    {
      name: 'Slim Fit Suit Jacket',
      slug: 'test-slim-fit-suit-jacket',
      description: 'Modern slim-fit suit jacket in premium fabric. Great for business or events.',
      shortDescription: 'Slim fit formal jacket',
      price: 3,
      compareAtPrice: 12,
      category: catMap['men'],
      gender: 'men' as const,
      isBestSeller: true,
      tags: ['suit', 'jacket', 'formal', 'men'],
      images: [img(30), img(31)],
      variants: [makeVariant('Navy', '#000080', 25), makeVariant('Charcoal', '#36454F', 20)],
    },
    {
      name: "Men's Casual Linen Shirt",
      slug: 'test-mens-casual-linen-shirt',
      description: 'Breathable linen shirt ideal for casual outings. Light and comfortable.',
      shortDescription: 'Casual breathable linen shirt',
      price: 1,
      compareAtPrice: 4,
      category: catMap['men'],
      gender: 'men' as const,
      isFlashSale: true,
      flashSalePrice: 1,
      flashSaleEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['shirt', 'linen', 'casual'],
      images: [img(40), img(41)],
      variants: [makeVariant('Cream', '#FFFDD0', 35), makeVariant('Sky Blue', '#87CEEB', 30)],
    },

    // ── Women's ───────────────────────────────────────────────────
    {
      name: 'Ankara Wrap Dress',
      slug: 'test-ankara-wrap-dress',
      description: 'Beautiful Ankara wrap dress with vibrant African print. Turn heads wherever you go.',
      shortDescription: 'Vibrant Ankara African print dress',
      price: 2,
      compareAtPrice: 10,
      category: catMap['women'],
      gender: 'women' as const,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
      tags: ['dress', 'ankara', 'african', 'women'],
      images: [img(50), img(51)],
      variants: [makeVariant('Ankara Print', '#FF6B35', 45)],
    },
    {
      name: 'Elegant Off-Shoulder Blouse',
      slug: 'test-elegant-off-shoulder-blouse',
      description: 'Sophisticated off-shoulder blouse perfect for evening events and parties.',
      shortDescription: 'Elegant party off-shoulder blouse',
      price: 1,
      compareAtPrice: 6,
      category: catMap['women'],
      gender: 'women' as const,
      isFeatured: true,
      tags: ['blouse', 'off-shoulder', 'elegant', 'women'],
      images: [img(60), img(61)],
      variants: [makeVariant('Black', '#000000', 40), makeVariant('Rose Gold', '#B76E79', 35)],
    },
    {
      name: 'High-Waist Ankara Skirt',
      slug: 'test-high-waist-ankara-skirt',
      description: 'Stunning high-waist skirt with traditional Ankara fabric. Pairs perfectly with any top.',
      shortDescription: 'Stylish high-waist African print skirt',
      price: 2,
      compareAtPrice: 7,
      category: catMap['women'],
      gender: 'women' as const,
      isNewArrival: true,
      tags: ['skirt', 'ankara', 'high-waist', 'women'],
      images: [img(70), img(71)],
      variants: [makeVariant('Ankara Blue', '#1E90FF', 30)],
    },
    {
      name: "Women's Dashiki Top",
      slug: 'test-womens-dashiki-top',
      description: 'Comfortable and stylish Dashiki top with traditional West African embroidery.',
      shortDescription: 'Traditional Dashiki embroidered top',
      price: 1,
      compareAtPrice: 5,
      category: catMap['women'],
      gender: 'women' as const,
      isFlashSale: true,
      flashSalePrice: 1,
      flashSaleEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['top', 'dashiki', 'traditional', 'women'],
      images: [img(80), img(81)],
      variants: [makeVariant('Multicolor', '#FF6347', 50)],
    },

    // ── Shoes ─────────────────────────────────────────────────────
    {
      name: 'Leather Oxford Shoes',
      slug: 'test-leather-oxford-shoes',
      description: 'Classic leather Oxford shoes. Handcrafted for durability and style.',
      shortDescription: 'Classic handcrafted Oxford leather shoes',
      price: 3,
      compareAtPrice: 15,
      category: catMap['shoes'],
      gender: 'men' as const,
      isFeatured: true,
      isBestSeller: true,
      tags: ['shoes', 'leather', 'oxford', 'formal'],
      images: [img(90), img(91)],
      variants: [
        {
          color: 'Brown',
          colorHex: '#964B00',
          sizes: [
            { size: '40', stock: 10, sku: `OXFORD-BRN-40-${Date.now()}` },
            { size: '41', stock: 15, sku: `OXFORD-BRN-41-${Date.now()}` },
            { size: '42', stock: 12, sku: `OXFORD-BRN-42-${Date.now()}` },
            { size: '43', stock: 8,  sku: `OXFORD-BRN-43-${Date.now()}` },
            { size: '44', stock: 5,  sku: `OXFORD-BRN-44-${Date.now()}` },
          ],
          images: [img(92)],
        },
        {
          color: 'Black',
          colorHex: '#000000',
          sizes: [
            { size: '40', stock: 10, sku: `OXFORD-BLK-40-${Date.now()}` },
            { size: '41', stock: 15, sku: `OXFORD-BLK-41-${Date.now()}` },
            { size: '42', stock: 12, sku: `OXFORD-BLK-42-${Date.now()}` },
            { size: '43', stock: 8,  sku: `OXFORD-BLK-43-${Date.now()}` },
          ],
          images: [img(93)],
        },
      ],
    },
    {
      name: "Ladies' Block Heel Sandals",
      slug: 'test-ladies-block-heel-sandals',
      description: 'Trendy block heel sandals. Perfect for both casual and semi-formal occasions.',
      shortDescription: 'Trendy block heel sandals for women',
      price: 2,
      compareAtPrice: 9,
      category: catMap['shoes'],
      gender: 'women' as const,
      isFeatured: true,
      isNewArrival: true,
      tags: ['sandals', 'heels', 'women', 'shoes'],
      images: [img(100), img(101)],
      variants: [
        {
          color: 'Nude',
          colorHex: '#E3BC9A',
          sizes: [
            { size: '37', stock: 12, sku: `SANDAL-NUD-37-${Date.now()}` },
            { size: '38', stock: 15, sku: `SANDAL-NUD-38-${Date.now()}` },
            { size: '39', stock: 10, sku: `SANDAL-NUD-39-${Date.now()}` },
            { size: '40', stock: 8,  sku: `SANDAL-NUD-40-${Date.now()}` },
          ],
          images: [img(102)],
        },
      ],
    },
    {
      name: 'Unisex Canvas Sneakers',
      slug: 'test-unisex-canvas-sneakers',
      description: 'Comfortable canvas sneakers for everyday wear. Available in multiple sizes.',
      shortDescription: 'Comfy everyday canvas sneakers',
      price: 1,
      compareAtPrice: 6,
      category: catMap['shoes'],
      gender: 'unisex' as const,
      isFlashSale: true,
      flashSalePrice: 1,
      flashSaleEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isBestSeller: true,
      tags: ['sneakers', 'canvas', 'unisex', 'casual'],
      images: [img(110), img(111)],
      variants: [
        {
          color: 'White',
          colorHex: '#FFFFFF',
          sizes: [
            { size: '38', stock: 20, sku: `SNEAKER-WHT-38-${Date.now()}` },
            { size: '39', stock: 25, sku: `SNEAKER-WHT-39-${Date.now()}` },
            { size: '40', stock: 20, sku: `SNEAKER-WHT-40-${Date.now()}` },
            { size: '41', stock: 15, sku: `SNEAKER-WHT-41-${Date.now()}` },
            { size: '42', stock: 10, sku: `SNEAKER-WHT-42-${Date.now()}` },
          ],
          images: [img(112)],
        },
      ],
    },

    // ── Accessories ───────────────────────────────────────────────
    {
      name: 'Kente Fabric Tote Bag',
      slug: 'test-kente-fabric-tote-bag',
      description: 'Handwoven Kente fabric tote bag. Practical and stylish with traditional Ghana craft.',
      shortDescription: 'Handwoven Kente tote bag',
      price: 1,
      compareAtPrice: 4,
      category: catMap['accessories'],
      gender: 'unisex' as const,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      tags: ['bag', 'kente', 'handmade', 'ghana'],
      images: [img(120), img(121)],
      variants: [
        {
          color: 'Kente Multicolor',
          colorHex: '#FFD700',
          sizes: [{ size: 'One Size', stock: 60, sku: `KENTE-BAG-OS-${Date.now()}` }],
          images: [img(122)],
        },
      ],
    },
    {
      name: 'Gold Beaded Necklace',
      slug: 'test-gold-beaded-necklace',
      description: 'Elegant gold beaded necklace inspired by traditional Ghanaian jewellery. Lightweight and stunning.',
      shortDescription: 'Traditional Ghanaian beaded necklace',
      price: 1,
      compareAtPrice: 3,
      category: catMap['accessories'],
      gender: 'women' as const,
      isFeatured: true,
      isNewArrival: true,
      tags: ['necklace', 'gold', 'beaded', 'jewellery'],
      images: [img(130), img(131)],
      variants: [
        {
          color: 'Gold',
          colorHex: '#FFD700',
          sizes: [{ size: 'One Size', stock: 80, sku: `NECKLACE-GLD-OS-${Date.now()}` }],
          images: [img(132)],
        },
      ],
    },
    {
      name: 'Leather Wristwatch',
      slug: 'test-leather-wristwatch',
      description: 'Classic leather strap wristwatch with a clean dial. Timeless accessory for any outfit.',
      shortDescription: 'Classic leather strap wristwatch',
      price: 3,
      compareAtPrice: 12,
      category: catMap['accessories'],
      gender: 'unisex' as const,
      isFeatured: true,
      isBestSeller: true,
      tags: ['watch', 'leather', 'classic', 'accessory'],
      images: [img(140), img(141)],
      variants: [
        {
          color: 'Brown',
          colorHex: '#964B00',
          sizes: [{ size: 'One Size', stock: 40, sku: `WATCH-BRN-OS-${Date.now()}` }],
          images: [img(142)],
        },
        {
          color: 'Black',
          colorHex: '#000000',
          sizes: [{ size: 'One Size', stock: 35, sku: `WATCH-BLK-OS-${Date.now()}` }],
          images: [img(143)],
        },
      ],
    },
    {
      name: 'Afrocentric Print Scarf',
      slug: 'test-afrocentric-print-scarf',
      description: 'Beautiful afrocentric print scarf. Versatile accessory — wear as a headwrap, scarf, or belt.',
      shortDescription: 'Versatile afrocentric print scarf',
      price: 1,
      compareAtPrice: 3,
      category: catMap['accessories'],
      gender: 'unisex' as const,
      isFlashSale: true,
      flashSalePrice: 1,
      flashSaleEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isNewArrival: true,
      tags: ['scarf', 'afrocentric', 'headwrap', 'accessory'],
      images: [img(150), img(151)],
      variants: [
        {
          color: 'Afro Print',
          colorHex: '#E25822',
          sizes: [{ size: 'One Size', stock: 100, sku: `SCARF-AFP-OS-${Date.now()}` }],
          images: [img(152)],
        },
      ],
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const prod of TEST_PRODUCTS) {
    const exists = await Product.findOne({ slug: prod.slug });
    if (exists) {
      // Update the price to be sure it's low for testing
      await Product.findOneAndUpdate({ slug: prod.slug }, {
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        isActive: true,
      });
      skipped++;
      continue;
    }

    await Product.create(prod);
    created++;
  }

  console.log(`✅ Test products: ${created} created, ${skipped} already existed (prices updated)`);
};

// Run standalone
if (require.main === module) {
  seedTestProducts().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
