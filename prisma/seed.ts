import { PrismaClient, Role, SellerStatus, KycStatus, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const PRODUCT_REAL_IMAGES: Record<string, string> = {
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
    'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80',
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
};

const PRODUCT_GALLERY_IMAGES: Record<string, string[]> = {
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

function getProductImage(title: string): string {
  return PRODUCT_REAL_IMAGES[title] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
}

function getProductImages(title: string): string[] {
  if (PRODUCT_GALLERY_IMAGES[title]) {
    return PRODUCT_GALLERY_IMAGES[title];
  }
  return [getProductImage(title)];
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data in reverse order of foreign keys
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.stockRequest.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash('Mrtf!98_Adm#K9x$2026', 10);
  const supportPasswordHash = await bcrypt.hash('Spprt#74@Mrtf_Tx9!26', 10);
  const officialStorePasswordHash = await bcrypt.hash('MrtfVndr$88#Store_2026!', 10);

  // 3. Seed Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin.core@martifycollection.com',
      passwordHash: adminPasswordHash,
      phone: '+12025550100',
      role: Role.ADMIN,
      sellerStatus: SellerStatus.APPROVED,
      kycStatus: KycStatus.APPROVED,
      availableStock: 10000,
      isDemoAccount: false,
    },
  });
  console.log(`✅ Seeded Admin: ${admin.email}`);

  // 4. Seed Single Dedicated Support Agent
  const support1 = await prisma.user.create({
    data: {
      name: 'Customer Support Lead',
      email: 'support.lead@martifycollection.com',
      passwordHash: supportPasswordHash,
      phone: '+12025550101',
      role: Role.SUPPORT,
      kycStatus: KycStatus.APPROVED,
    },
  });
  console.log(`✅ Seeded Support Agent: ${support1.email}`);

  // 5. Seed 6 Categories
  const categoriesData = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion & Apparel', slug: 'fashion-apparel' },
    { name: 'Home & Kitchen', slug: 'home-kitchen' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
    { name: 'Books & Stationery', slug: 'books-stationery' },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) =>
      prisma.category.create({
        data: cat,
      })
    )
  );
  console.log(`✅ Seeded ${categories.length} Categories.`);

  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  // 6. Seed ONE Single Company-Owned Official Store (Martify Collection Official Store)
  const officialStore = await prisma.user.create({
    data: {
      name: 'Martify Collection Official Store',
      email: 'official.store@martifycollection.com',
      passwordHash: officialStorePasswordHash,
      phone: '+12025550111',
      role: Role.SELLER,
      sellerStatus: SellerStatus.APPROVED,
      kycStatus: KycStatus.APPROVED,
      availableStock: 10000,
      balanceOnHold: new Prisma.Decimal(0),
      balanceAvailable: new Prisma.Decimal(0),
      isDemoAccount: true,
      storeName: 'Martify Collection Official Store',
      storeDescription: 'The primary platform-curated catalog store. Guaranteed authentic inventory and direct platform fulfillment.',
    },
  });
  console.log(`✅ Seeded Official Company Store: ${officialStore.name} (${officialStore.email}) with isDemoAccount=true.`);

  // 7. Seed 15 realistic base catalog products assigned to the single company store
  const productsToSeed = [
    // Electronics
    {
      categorySlug: 'electronics',
      title: 'Active Noise Cancelling Wireless Headphones',
      description: 'High-fidelity audio with hybrid 40mm drivers, ambient sound mode, and up to 45 hours battery life.',
      price: 149.99,
      stock: 45,
      imageFile: 'anc-headphones.svg',
    },
    {
      categorySlug: 'electronics',
      title: 'Ultra-Slim 100W GaN Fast Charger',
      description: 'Compact 4-port fast desktop charging station compatible with laptops, tablets, and smartphones.',
      price: 49.5,
      stock: 60,
      imageFile: 'gan-charger.svg',
    },
    {
      categorySlug: 'electronics',
      title: 'Ergonomic Mechanical Keyboard (RGB)',
      description: 'Hot-swappable mechanical switches, gasket-mount design, programmable macros, and wireless Bluetooth 5.2.',
      price: 99.0,
      stock: 35,
      imageFile: 'mechanical-keyboard.svg',
    },

    // Fashion & Apparel
    {
      categorySlug: 'fashion-apparel',
      title: 'Organic Heavyweight Cotton Oversized Hoodie',
      description: 'Crafted from 100% sustainable combed organic cotton. Ribbed cuffs, kangaroo pocket, and brushed fleece interior.',
      price: 65.0,
      stock: 40,
      imageFile: 'cotton-hoodie.svg',
    },
    {
      categorySlug: 'fashion-apparel',
      title: 'Water-Resistant Commuter City Parka',
      description: 'Minimalist all-weather performance jacket with breathable membrane, taped seams, and hidden hood.',
      price: 129.0,
      stock: 30,
      imageFile: 'commuter-parka.svg',
    },
    {
      categorySlug: 'fashion-apparel',
      title: 'Tailored Linen Relaxed Fit Chinos',
      description: 'Breathable linen-cotton blend designed for comfort, durability, and effortless everyday elegance.',
      price: 55.0,
      stock: 50,
      imageFile: 'linen-chinos.svg',
    },

    // Home & Kitchen
    {
      categorySlug: 'home-kitchen',
      title: 'Precision Temperature Pour-Over Electric Kettle',
      description: 'Gooseneck spout for controlled water flow, real-time LCD temperature readout, and 60-minute heat hold.',
      price: 89.95,
      stock: 40,
      imageFile: 'electric-kettle.svg',
    },
    {
      categorySlug: 'home-kitchen',
      title: 'Enamelled Cast Iron Dutch Oven (5.5 Quart)',
      description: 'Superior heat distribution and heat retention for searing, braising, baking artisan breads, and slow stews.',
      price: 119.5,
      stock: 25,
      imageFile: 'dutch-oven.svg',
    },
    {
      categorySlug: 'home-kitchen',
      title: 'Cold Brew Stainless Steel Infusion Pitcher',
      description: 'Borosilicate glass carafe with laser-cut fine mesh stainless steel core for ultra-smooth cold brewing.',
      price: 34.0,
      stock: 55,
      imageFile: 'cold-brew-pitcher.svg',
    },

    // Beauty & Personal Care
    {
      categorySlug: 'beauty-personal-care',
      title: 'Antioxidant Vitamin C & E Face Serum',
      description: 'Targeted brightening formula with 15% pure L-Ascorbic Acid, Ferulic Acid, and Hyaluronic Acid hydration.',
      price: 38.0,
      stock: 65,
      imageFile: 'vit-c-serum.svg',
    },
    {
      categorySlug: 'beauty-personal-care',
      title: 'Deep Hydrating Botanical Barrier Cream',
      description: 'Replenishing ceramides, squalane, and centella asiatica to soothe and reinforce skin barrier.',
      price: 42.0,
      stock: 50,
      imageFile: 'barrier-cream.svg',
    },
    {
      categorySlug: 'beauty-personal-care',
      title: 'Gentle Amino Acid Foaming Cleanser',
      description: 'pH-balanced daily facial wash that lifts impurities without stripping essential protective oils.',
      price: 24.5,
      stock: 70,
      imageFile: 'amino-cleanser.svg',
    },

    // Sports & Outdoors
    {
      categorySlug: 'sports-outdoors',
      title: 'Insulated Double-Wall Vacuum Sports Bottle (1L)',
      description: 'Keeps drinks ice-cold for 24 hours or piping-hot for 12 hours. Sweat-proof powder-coated grip.',
      price: 29.99,
      stock: 60,
      imageFile: 'vacuum-bottle.svg',
    },
    {
      categorySlug: 'sports-outdoors',
      title: 'Pro Speed Weighted Jump Rope & Cable Set',
      description: 'Dual ball-bearing handles with interchangeable speed and power cables for endurance training.',
      price: 22.5,
      stock: 50,
      imageFile: 'jump-rope.svg',
    },

    // Books & Stationery
    {
      categorySlug: 'books-stationery',
      title: 'Hardcover Dot-Grid Bullet Journal (160 GSM)',
      description: 'Bleed-resistant ultra-thick bamboo paper, numbered pages, dual ribbon markers, and expandable back pocket.',
      price: 19.95,
      stock: 80,
      imageFile: 'bullet-journal.svg',
    },
  ];

  for (const item of productsToSeed) {
    const categoryId = catMap.get(item.categorySlug);

    if (!categoryId) {
      throw new Error(`Category not found: ${item.categorySlug}`);
    }

    const images = getProductImages(item.title);
    const imageUrl = images[0];

    const isFashion = item.categorySlug === 'fashion-apparel';
    const isSports = item.categorySlug === 'sports-outdoors';
    const isBeauty = item.categorySlug === 'beauty-personal-care';

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

    await prisma.product.create({
      data: {
        title: item.title,
        description: item.description,
        price: new Prisma.Decimal(item.price),
        imageUrl,
        stock: item.stock,
        isActive: true,
        sellerId: officialStore.id,
        categoryId,
        attributes: attributes ?? Prisma.DbNull,
        images: {
          create: images.map((url, index) => ({
            url,
            sortOrder: index,
          })),
        },
      },
    });
  }

  console.log(`✅ Seeded ${productsToSeed.length} catalog products attributed to ${officialStore.name}.`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
