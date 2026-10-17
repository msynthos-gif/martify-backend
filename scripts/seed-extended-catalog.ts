import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const EXTENDED_PRODUCTS = [
  // Electronics
  {
    categorySlug: 'electronics',
    title: 'Wireless Noise-Canceling Earbuds Pro',
    description: 'Active hybrid noise cancellation, transparency audio mode, IPX5 water resistance, and 32-hour playback case.',
    price: 99.99,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'electronics',
    title: 'Magnetic 15W Qi Wireless Power Bank',
    description: '10,000mAh capacity with strong magnetic lock, USB-C Power Delivery 20W bidirectional fast charge, and kickstand.',
    price: 39.5,
    stock: 65,
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'electronics',
    title: 'Studio Monitor USB-C Condenser Microphone',
    description: 'Cardioid polar pattern, zero-latency headphone monitoring, tap-to-mute sensor, and built-in pop filter.',
    price: 79.0,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'electronics',
    title: '4K Ultra-HD 60FPS Streaming Webcam',
    description: 'Sony STARVIS CMOS sensor, AI auto-focus, dual omnidirectional noise-reducing mics, and privacy shutter.',
    price: 89.0,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'electronics',
    title: 'Smart LED Screen Ambient Lightbar',
    description: 'Asymmetric optical design illuminates workspace with zero screen glare, touch dimmer, and wireless puck controller.',
    price: 54.95,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'electronics',
    title: 'Compact Aluminum Laptop Riser Stand',
    description: 'Ergonomic CNC-machined anodized aluminum stand with cable management port and silicone anti-slip cushioning.',
    price: 34.0,
    stock: 75,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'electronics',
    title: 'Braided Thunderbolt 4 High-Speed Cable',
    description: '40Gbps data bandwidth, 100W Power Delivery charging, and 8K display support encased in military-grade braided nylon.',
    price: 26.5,
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'electronics',
    title: 'Minimalist Bluetooth Desk Speaker',
    description: 'Precision dual 10W drivers, passive bass radiator, 16-hour rechargeable battery, and matte slate finish.',
    price: 68.0,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
  },

  // Fashion & Apparel
  {
    categorySlug: 'fashion-apparel',
    title: 'Heavyweight Boxy Graphic Tee (280 GSM)',
    description: 'Pre-shrunk 100% carded organic cotton, dropped shoulder cut, dense ribbed collar, and archival screen print.',
    price: 45.0,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    attributes: { size: ['S', 'M', 'L', 'XL', 'XXL'], color: ['Washed Black', 'Vintage White', 'Sage Green'] },
  },
  {
    categorySlug: 'fashion-apparel',
    title: 'Technical Water-Repellent Cargo Pants',
    description: 'DWR-coated stretch ripstop fabric, articulated knee darts, waterproof zip cargo pockets, and adjustable hems.',
    price: 95.0,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    attributes: { size: ['S', 'M', 'L', 'XL'], color: ['Matte Black', 'Olive Drab', 'Dark Charcoal'] },
  },
  {
    categorySlug: 'fashion-apparel',
    title: 'Relaxed Fit French Terry Crewneck',
    description: 'Dense 450 GSM diagonal-loop French terry fleece with flatlock stitching and relaxed dropped shoulder silhouette.',
    price: 70.0,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
    attributes: { size: ['S', 'M', 'L', 'XL'], color: ['Heather Grey', 'Obsidian', 'Bone'] },
  },
  {
    categorySlug: 'fashion-apparel',
    title: 'Structured Ripstop Utility Overshirt',
    description: 'Heavy duty tactical cotton ripstop with concealed snap placket, dual chest gear pockets, and boxy straight hem.',
    price: 88.0,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    attributes: { size: ['S', 'M', 'L', 'XL'], color: ['Military Olive', 'Navy', 'Sand'] },
  },
  {
    categorySlug: 'fashion-apparel',
    title: 'Merino Wool Ribbed Beanie',
    description: '100% extra-fine Australian Merino wool. Naturally temperature regulating, odor resistant, and ultra soft.',
    price: 32.0,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80',
    attributes: { color: ['Charcoal', 'Caramel', 'Black', 'Forest Green'] },
  },
  {
    categorySlug: 'fashion-apparel',
    title: 'Double-Breasted Wool Oversized Coat',
    description: 'Tailored heavy virgin wool blend with structured shoulder silhouette, horn button closures, and satin lining.',
    price: 220.0,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    attributes: { size: ['S', 'M', 'L', 'XL'], color: ['Camel', 'Midnight Black'] },
  },
  {
    categorySlug: 'fashion-apparel',
    title: 'Vintage Washed Loose Denim Jeans',
    description: '14oz non-stretch Japanese selvedge denim with natural fading, button fly, and relaxed wide-leg profile.',
    price: 110.0,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    attributes: { size: ['30', '32', '34', '36'], color: ['Vintage Indigo', 'Faded Grey'] },
  },
  {
    categorySlug: 'fashion-apparel',
    title: 'Weather-Shield Zip Windbreaker',
    description: 'Lightweight packable shell with waterproof taped seams, bungee cinch hood, and reflective minimalist graphics.',
    price: 85.0,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80',
    attributes: { size: ['S', 'M', 'L', 'XL'], color: ['Triple Black', 'Glacier Grey'] },
  },

  // Home & Kitchen
  {
    categorySlug: 'home-kitchen',
    title: 'Precision Ceramic Burr Coffee Grinder',
    description: '40 micro-step grind adjustments, conical ceramic burrs, aircraft-grade aluminum casing, and quiet crank.',
    price: 58.0,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'home-kitchen',
    title: 'Minimalist Matte Ceramic Dinner Set',
    description: 'Handcrafted stoneware featuring raw unglazed rims, satin matte glaze, microwave and dishwasher safe.',
    price: 74.0,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'home-kitchen',
    title: 'Damascus Steel 8-Inch Chef Knife',
    description: '67 layers of forged high-carbon VG-10 Japanese steel with balanced ergonomic Pakkawood handle.',
    price: 95.0,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'home-kitchen',
    title: 'Organic Linen Table Runner & Napkins',
    description: 'Stone-washed 100% French flax linen. Natural textured weave that softens with each wash.',
    price: 42.0,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'home-kitchen',
    title: 'Aromatherapy Ultrasonic Essential Oil Diffuser',
    description: 'Natural ceramic stone cover with ambient warm LED light, 300ml water capacity, and whisper-quiet operation.',
    price: 46.0,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'home-kitchen',
    title: 'Acacia Wood End-Grain Cutting Board',
    description: 'Thick butcher block construction that preserves knife blade sharpness. Integrated juice groove and recessed side handles.',
    price: 52.0,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'home-kitchen',
    title: 'Vacuum Insulated Stainless French Press',
    description: 'Double-wall thermal insulation keeps coffee piping hot for hours. 4-level filtration system prevents grounds sediment.',
    price: 44.0,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'home-kitchen',
    title: 'Amber Glass Kitchen Storage Jars (Set of 4)',
    description: 'UV-blocking heavy amber glass with airtight natural acacia wood lids for coffee, spices, and grains.',
    price: 36.0,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
  },

  // Beauty & Personal Care
  {
    categorySlug: 'beauty-personal-care',
    title: 'Exfoliating 2% BHA Salicylic Acid Toner',
    description: 'Gently clears clogged pores, reduces redness, and smooths skin texture with calming green tea leaf extract.',
    price: 31.0,
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    attributes: { volume: ['100ml', '200ml'] },
  },
  {
    categorySlug: 'beauty-personal-care',
    title: 'Nourishing Peptide Eye Recovery Cream',
    description: 'Multi-peptide complex formulated with caffeine and squalane to reduce puffiness and visibly firm under-eye contours.',
    price: 38.0,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    attributes: { volume: ['15ml', '30ml'] },
  },
  {
    categorySlug: 'beauty-personal-care',
    title: 'Broad-Spectrum SPF 50 Mineral Sunscreen',
    description: 'Invisible zinc oxide non-nano formula that blends effortlessly with zero white cast and velvety satin matte finish.',
    price: 28.0,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    attributes: { volume: ['50ml', '100ml'] },
  },
  {
    categorySlug: 'beauty-personal-care',
    title: 'Restorative Botanical Overnight Hair Mask',
    description: 'Cold-pressed argan and marula oils deeply hydrate split ends and strengthen damaged heat-treated hair follicles.',
    price: 34.0,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    attributes: { volume: ['150ml', '250ml'] },
  },
  {
    categorySlug: 'beauty-personal-care',
    title: 'Ultra-Rich Shea Butter Hand Balm',
    description: '25% organic unrefined shea butter, sweet almond oil, and vitamin E for instant soothing of dry, cracked hands.',
    price: 18.0,
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-577717be8a11?auto=format&fit=crop&w=800&q=80',
    attributes: { volume: ['75ml'] },
  },
  {
    categorySlug: 'beauty-personal-care',
    title: 'Purifying Moroccan Clay Detox Mask',
    description: 'Mineral-rich Rhassoul clay infused with charcoal and witch hazel to absorb excess sebum and clarify pores.',
    price: 26.5,
    stock: 65,
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    attributes: { volume: ['100ml'] },
  },
  {
    categorySlug: 'beauty-personal-care',
    title: 'Soothing Centella Asiatica Relief Gel',
    description: 'Lightweight oil-free cooling gel moisturiser with 85% Cica extract for sensitive, irritated, or acne-prone skin.',
    price: 24.0,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80',
    attributes: { volume: ['100ml'] },
  },

  // Sports & Outdoors
  {
    categorySlug: 'sports-outdoors',
    title: 'High-Density Non-Slip Yoga & Fitness Mat',
    description: '6mm eco-friendly TPE foam with laser-engraved alignment guides, dual-textured traction, and carry strap.',
    price: 45.0,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    attributes: { color: ['Slate Grey', 'Forest Green', 'Navy Blue'] },
  },
  {
    categorySlug: 'sports-outdoors',
    title: 'Adjustable Quick-Select Dumbbell Set',
    description: 'Single-hand dial adjustment from 5 to 52.5 lbs per dumbbell with heavy-duty interlocking steel weight plates.',
    price: 199.0,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'sports-outdoors',
    title: 'Waterproof Roll-Top Trail Backpack (30L)',
    description: 'Tough 500D PVC tarpaulin with welded watertight seams, ergonomic padded shoulder straps, and chest buckle.',
    price: 68.0,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    attributes: { color: ['Matte Black', 'High-Vis Orange', 'Storm Grey'] },
  },
  {
    categorySlug: 'sports-outdoors',
    title: 'Ultralight Packable Camping Hammock',
    description: 'Tear-resistant 210T parachute nylon supporting up to 500 lbs. Includes tree straps and aluminum wiregate carabiners.',
    price: 36.0,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'sports-outdoors',
    title: 'Thermal Compression Running Tights',
    description: 'Brushed interior for cold-weather warmth, 4-way stretch fabric, deep side phone pocket, and reflective ankle trim.',
    price: 48.0,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    attributes: { size: ['S', 'M', 'L', 'XL'], color: ['Black', 'Navy'] },
  },
  {
    categorySlug: 'sports-outdoors',
    title: 'Resistance Bands Workout Loop Set',
    description: 'Set of 5 natural latex loop bands ranging from X-Light to X-Heavy with breathable mesh travel pouch.',
    price: 16.5,
    stock: 85,
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'sports-outdoors',
    title: 'Hydration Pack Bladder Backpack (2L)',
    description: 'BPA-free leakproof water reservoir with high-flow bite valve, insulated hose sleeve, and lightweight daypack storage.',
    price: 38.0,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  },

  // Books & Stationery
  {
    categorySlug: 'books-stationery',
    title: 'Brass Precision Mechanical Drafting Pencil',
    description: 'Solid brass hexagonal barrel with knurled grip, lead grade indicator window, and replaceable brass clutch mechanism.',
    price: 28.0,
    stock: 65,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'books-stationery',
    title: 'Fountain Pen with 24K Gold-Plated Nib',
    description: 'Balanced resin body with stainless steel fine nib, piston converter included, and smooth ink flow technology.',
    price: 49.0,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'books-stationery',
    title: 'Architectural Grid Sketchbook (Hardbound)',
    description: 'Heavy 180 GSM acid-free mixed-media paper with 5mm isometric and dot grids, lay-flat thread binding, and pen loop.',
    price: 24.5,
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'books-stationery',
    title: 'Solid Walnut Minimalist Desk Organizer',
    description: 'Crafted from sustainable American walnut with magnetic paperclip recess, pen grooves, and phone charging dock.',
    price: 38.0,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'books-stationery',
    title: 'Archival Quality Waterproof Pigment Fineliners',
    description: 'Set of 8 calibrated needle-point pens (0.05mm to 1.0mm and brush tip) with waterproof lightfast pigment ink.',
    price: 18.5,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'books-stationery',
    title: 'Genuine Leather Notebook Travel Cover',
    description: 'Vegetable-tanned full-grain leather cover that patinas with use. Features dual elastic cords and brass charm.',
    price: 34.0,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    categorySlug: 'books-stationery',
    title: 'Heavy Brass Desk Paperweight & Pen Rest',
    description: 'Machined solid brass bar with micro-beveled chamfers and dual pen rest grooves. Heavy 450g heft.',
    price: 29.0,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
  },
];

async function seedExtended() {
  console.log('📦 Starting Extended Catalog Seeding...');

  // Get official store user
  const officialStore = await prisma.user.findFirst({
    where: { email: 'official.store@martifycollection.com' },
  });

  if (!officialStore) {
    throw new Error('Official store account not found.');
  }

  // Get categories
  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  let added = 0;
  for (const item of EXTENDED_PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { title: item.title },
    });

    if (existing) {
      continue;
    }

    const categoryId = catMap.get(item.categorySlug);
    if (!categoryId) {
      console.warn(`Category not found: ${item.categorySlug}`);
      continue;
    }

    await prisma.product.create({
      data: {
        title: item.title,
        description: item.description,
        price: new Prisma.Decimal(item.price),
        imageUrl: item.imageUrl,
        stock: item.stock,
        isActive: true,
        sellerId: officialStore.id,
        categoryId,
        attributes: (item as any).attributes ?? Prisma.DbNull,
        images: {
          create: [
            { url: item.imageUrl, sortOrder: 0 },
          ],
        },
      },
    });
    added++;
  }

  const total = await prisma.product.count();
  console.log(`✅ Added ${added} new catalog items.`);
  console.log(`🎉 Total active catalog products in database: ${total}`);
  await prisma.$disconnect();
}

seedExtended().catch((e) => {
  console.error(e);
  process.exit(1);
});
