import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Curated high-resolution professional e-commerce product photography from Unsplash
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'Active Noise Cancelling Wireless Headphones':
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'Ultra-Slim 100W GaN Fast Charger':
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
  'Ergonomic Mechanical Keyboard (RGB)':
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  'Water-Resistant Commuter City Parka':
    'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80',
  'Tailored Linen Relaxed Fit Chinos':
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
  'Precision Temperature Pour-Over Electric Kettle':
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
  'Enamelled Cast Iron Dutch Oven (5.5 Quart)':
    'https://images.unsplash.com/photo-1584990347449-399066e40994?auto=format&fit=crop&w=800&q=80',
  'Cold Brew Stainless Steel Infusion Pitcher':
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
  'Antioxidant Vitamin C & E Face Serum':
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  'Deep Hydrating Botanical Barrier Cream':
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
  'Gentle Amino Acid Foaming Cleanser':
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
  'Insulated Double-Wall Vacuum Sports Bottle (1L)':
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  'Pro Speed Weighted Jump Rope & Cable Set':
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  'Organic Heavyweight Cotton Oversized Hoodie':
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  'Hardcover Dot-Grid Bullet Journal (160 GSM)':
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  'Reclaimed Stock Keyboard Cable':
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
  'Custom Mechanical Macro Pad':
    'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
};

// Fallback images per category if title does not directly match
const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'fashion-apparel': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  'home-kitchen': 'https://images.unsplash.com/photo-1584990347449-399066e40994?auto=format&fit=crop&w=800&q=80',
  'beauty-personal-care': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  'sports-outdoors': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  'books-stationery': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
};

async function updateImages() {
  console.log('🔄 Updating database product images with authentic photography...');

  const products = await prisma.product.findMany({
    include: { category: true },
  });

  let updated = 0;

  for (const product of products) {
    const directMatch = PRODUCT_IMAGE_MAP[product.title];
    const categoryMatch = product.category?.slug
      ? CATEGORY_DEFAULT_IMAGES[product.category.slug]
      : undefined;

    const newImageUrl = directMatch || categoryMatch || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: newImageUrl },
    });
    updated++;
    console.log(`✅ [${product.category?.name || 'Item'}] "${product.title}" -> ${newImageUrl.substring(0, 50)}...`);
  }

  console.log(`🎉 Successfully updated all ${updated} product images in database!`);
}

updateImages()
  .catch((err) => {
    console.error('Error updating images:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
