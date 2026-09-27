import { prisma } from '../src/config/prisma';

const PRODUCT_GALLERY: Record<string, string[]> = {
  'Active Noise Cancelling Wireless Headphones': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80',
  ],
  'Ultra-Slim 100W GaN Fast Charger': [
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=800&q=80',
  ],
  'Ergonomic Mechanical Keyboard (RGB)': [
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541140532154-b024d705b909?auto=format&fit=crop&w=800&q=80',
  ],
  'Organic Heavyweight Cotton Oversized Hoodie': [
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  ],
  'Water-Resistant Commuter City Parka': [
    'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
  ],
  'Tailored Linen Relaxed Fit Chinos': [
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  ],
  'Enamelled Cast Iron Dutch Oven (5.5 Quart)': [
    'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  ],
  'Precision Temperature Pour-Over Electric Kettle': [
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
  ],
  'Cold Brew Stainless Steel Infusion Pitcher': [
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80',
  ],
  'Antioxidant Vitamin C & E Face Serum': [
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1608248597359-577717be8a11?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
  ],
  'Deep Hydrating Botanical Barrier Cream': [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1608248597359-577717be8a11?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
  ],
  'Gentle Amino Acid Foaming Cleanser': [
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
  ],
  'Insulated Double-Wall Vacuum Sports Bottle (1L)': [
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80',
  ],
  'Pro Speed Weighted Jump Rope & Cable Set': [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
  ],
  'Hardcover Dot-Grid Bullet Journal (160 GSM)': [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
  ],
};

async function run() {
  try {
    console.log('Attaching 4-5 images per product and setting attributes (Size & Color)...');

    // 1. Ensure Official Store is renamed to Martify Collection Official Store
    await prisma.user.updateMany({
      where: {
        OR: [
          { name: { contains: 'Nexus Official', mode: 'insensitive' } },
          { email: 'official@nexus.com' },
          { isDemoAccount: true },
        ],
      },
      data: {
        name: 'Martify Collection Official Store',
        email: 'official@martifycollection.com',
        storeName: 'Martify Collection Official Store',
        storeDescription: 'The primary platform-curated catalog store. Guaranteed authentic inventory and direct platform fulfillment.',
      },
    });

    const officialStore = await prisma.user.findFirst({
      where: { isDemoAccount: true },
    });

    if (!officialStore) {
      console.log('No official store found.');
      return;
    }

    console.log(`Found Official Store: ${officialStore.name} (${officialStore.id})`);

    // Fetch official store products
    const products = await prisma.product.findMany({
      where: { sellerId: officialStore.id },
      include: { category: true },
    });

    console.log(`Found ${products.length} base catalog products.`);

    for (const prod of products) {
      const gallery = PRODUCT_GALLERY[prod.title];
      if (!gallery || gallery.length < 4) {
        console.log(`⚠️ Missing gallery for: ${prod.title}`);
        continue;
      }

      // Clear existing product images
      await prisma.productImage.deleteMany({
        where: { productId: prod.id },
      });

      // Insert 4-5 images
      await prisma.productImage.createMany({
        data: gallery.map((url, sortOrder) => ({
          productId: prod.id,
          url,
          sortOrder,
        })),
      });

      // Update primary image on product
      const primaryUrl = gallery[0];
      const isFashion = prod.category?.slug === 'fashion-apparel';
      const isSports = prod.category?.slug === 'sports-outdoors';
      const isBeauty = prod.category?.slug === 'beauty-personal-care';

      let attributes: any = null;
      if (isFashion) {
        attributes = {
          size: ['S', 'M', 'L', 'XL', 'XXL'],
          color: ['Black', 'White', 'Navy', 'Red', 'Green', 'Blue'],
        };
      } else if (isSports) {
        attributes = {
          size: ['S', 'M', 'L', 'XL'],
        };
      } else if (isBeauty) {
        attributes = {
          volume: ['50ml', '100ml', '200ml'],
        };
      }

      await prisma.product.update({
        where: { id: prod.id },
        data: {
          imageUrl: primaryUrl,
          ...(attributes ? { attributes } : {}),
        },
      });

      console.log(`✅ Updated ${prod.title}: ${gallery.length} images attached${isFashion ? ' + Size & Color attributes' : ''}`);
    }

    console.log('🎉 Successfully attached 4-5 real images to all official catalog products and configured attributes!');
  } catch (err) {
    console.error('Error updating images & attributes:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
