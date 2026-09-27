import puppeteer from 'puppeteer-core';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\dad78bb3-72ea-423d-9072-ef06b37069ca';

async function captureAll() {
  console.log('🔍 Querying DB for official store and sample products...');
  const officialStore = await prisma.user.findFirst({
    where: { isDemoAccount: true },
  });

  if (!officialStore) {
    throw new Error('Official store not found in DB');
  }

  // Find a fashion & apparel product that has color attributes
  const fashionProduct = await prisma.product.findFirst({
    where: {
      category: { slug: 'fashion-apparel' },
    },
    include: { images: true, category: true },
  });

  console.log(`Official store: ${officialStore.name} (${officialStore.id})`);
  console.log(`Fashion product: ${fashionProduct?.title} (${fashionProduct?.id})`);

  console.log('🚀 Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 950, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // -------------------------------------------------------------
    // 1. Rebranded Header & Hero Search Bar
    // -------------------------------------------------------------
    console.log('📸 1. Capturing Rebranded Header & Hero...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'rebranded_header_hero.png'),
    });

    // -------------------------------------------------------------
    // 2. Rebranded Footer (No Artificial Badges)
    // -------------------------------------------------------------
    console.log('📸 2. Capturing Rebranded Footer...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'rebranded_footer.png'),
    });

    // -------------------------------------------------------------
    // 3. Search Results Page (Stores + Products)
    // -------------------------------------------------------------
    console.log('📸 3. Capturing Search Results (/search?q=Tee)...');
    await page.goto('http://localhost:3000/search?q=Tee', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'search_results_stores_products.png'),
    });

    // Also search for "Martify" to show store match prominently
    console.log('📸 3b. Capturing Search Results (/search?q=Martify)...');
    await page.goto('http://localhost:3000/search?q=Martify', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'search_results_store_match.png'),
    });

    // -------------------------------------------------------------
    // 3c. Search Results with BOTH Store and Product Matches
    // -------------------------------------------------------------
    console.log('📸 3c. Capturing Search Results with both stores and products (/search?q=martify)...');
    await page.goto('http://localhost:3000/search?q=martify', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'search_results_stores_products.png'),
    });

    // -------------------------------------------------------------
    // 4. Fashion Product Detail with Color Selector & 4-5 Images
    // -------------------------------------------------------------
    const targetFashion = await prisma.product.findFirst({
      where: {
        title: { contains: 'Parka' },
      },
      include: { images: true, category: true },
    }) || fashionProduct;

    if (targetFashion) {
      console.log(`📸 4. Capturing Product Detail with Color Selector (/products/${targetFashion.id})...`);
      await page.goto(`http://localhost:3000/products/${targetFashion.id}`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'fashion_color_selector_product_detail.png'),
      });

      // -------------------------------------------------------------
      // 5. Add to Cart & Checkout Form Redesign
      // -------------------------------------------------------------
      console.log('🛒 Adding product to cart and navigating to checkout...');
      // Click a color pill if available
      try {
        const colorButtons = await page.$$('button');
        for (const btn of colorButtons) {
          const text = await (await btn.getProperty('textContent')).jsonValue();
          if (text === 'Navy' || text === 'Black' || text === 'Blue') {
            await btn.click();
            break;
          }
        }
      } catch (e) {
        console.log('Color button click note:', e);
      }

      // Click "ADD TO CART"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find((b) => b.textContent?.includes('ADD TO CART') || b.textContent?.includes('Add to Cart'));
        if (addBtn) addBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1500));

      // Navigate to /checkout
      console.log('📸 5. Capturing Redesigned Checkout Form (/checkout)...');
      await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'checkout_form_redesign.png'),
      });
    }

    // -------------------------------------------------------------
    // 6. Seller Login & Dashboard (No Balance Tab, Stat Card Preserved)
    // -------------------------------------------------------------
    console.log('🔐 Logging in to Seller Portal...');
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'official@martifycollection.com');
    await page.type('input[type="password"]', 'SellerPass123!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));

    console.log('📸 6. Capturing Seller Dashboard without Balance & Escrow Tab...');
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'seller_dashboard_no_balance_tab.png'),
    });

    // -------------------------------------------------------------
    // 7. Seller Products Tab (Single "Add from Official Store" Button)
    // -------------------------------------------------------------
    console.log('📸 7. Capturing Products Tab with Single Solid Navy Button...');
    // Click "Products" tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const prodTab = tabs.find((t) => t.textContent?.includes('Products'));
      if (prodTab) prodTab.click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'seller_products_tab_single_button.png'),
    });

    // -------------------------------------------------------------
    // 8. Seller Store Profile Editing UI Modal
    // -------------------------------------------------------------
    console.log('📸 8. Opening and Capturing Edit Store Profile UI...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find((b) => b.textContent?.includes('Edit Store Profile') || b.textContent?.includes('Edit Profile'));
      if (editBtn) editBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'seller_profile_edit_modal.png'),
    });

    // -------------------------------------------------------------
    // 9. Seller Public Storefront Page
    // -------------------------------------------------------------
    console.log(`📸 9. Capturing Seller Storefront (/sellers/${officialStore.id})...`);
    await page.goto(`http://localhost:3000/sellers/${officialStore.id}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'seller_storefront_clean.png'),
    });

    // -------------------------------------------------------------
    // 10. Homepage Featured Row (No Artificial Badges)
    // -------------------------------------------------------------
    console.log('📸 10. Capturing Homepage Featured Row (Badge-Free)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      window.scrollTo(0, 600);
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'homepage_featured_clean_row.png'),
    });

    console.log('🎉 All verification screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot capture error:', err);
    throw err;
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

captureAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
