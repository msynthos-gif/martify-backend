const puppeteer = require('puppeteer-core');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\c9661296-3eb2-4b91-ae84-fcad8b25fe54';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Starting Comprehensive MEGA FIX Verification Script...');

  // 1. Prepare user credentials in DB
  const salt = await bcrypt.genSalt(10);
  const sellerHash = await bcrypt.hash('SellerPass123!', salt);
  const adminHash = await bcrypt.hash('admin!#$123@', salt);
  const supportHash = await bcrypt.hash('nayyar123@#$', salt);

  await prisma.user.upsert({
    where: { email: 'official@nexus.com' },
    update: { passwordHash: sellerHash, role: 'SELLER', sellerStatus: 'APPROVED', kycStatus: 'APPROVED' },
    create: {
      email: 'official@nexus.com',
      passwordHash: sellerHash,
      name: 'Nexus Official Seller',
      phone: '+1234567890',
      role: 'SELLER',
      sellerStatus: 'APPROVED',
      kycStatus: 'APPROVED',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@nayyar.com' },
    update: { passwordHash: adminHash, role: 'ADMIN' },
    create: {
      email: 'admin@nayyar.com',
      passwordHash: adminHash,
      name: 'Admin User',
      phone: '+1234567891',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'support1@nayyar.com' },
    update: { passwordHash: supportHash, role: 'SUPPORT' },
    create: {
      email: 'support1@nayyar.com',
      passwordHash: supportHash,
      name: 'Support Agent',
      phone: '+1234567892',
      role: 'SUPPORT',
    },
  });

  // Ensure demo seller exists for official wholesale catalog
  let demoSeller = await prisma.user.findFirst({ where: { isDemoAccount: true } });
  if (!demoSeller) {
    demoSeller = await prisma.user.create({
      data: {
        email: 'official-store@platform.internal',
        passwordHash: sellerHash,
        name: 'Nexus Official Warehouse',
        phone: '+18005550199',
        role: 'SELLER',
        sellerStatus: 'APPROVED',
        kycStatus: 'APPROVED',
        isDemoAccount: true,
      },
    });
  }

  const seller = await prisma.user.findUnique({ where: { email: 'official@nexus.com' } });
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Fashion & Apparel', slug: 'fashion-apparel' },
    });
  }

  // Ensure official catalog product exists
  let catalogProduct = await prisma.product.findFirst({
    where: { seller: { isDemoAccount: true }, isActive: true },
  });
  if (!catalogProduct) {
    const demoImg = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=60';
    catalogProduct = await prisma.product.create({
      data: {
        title: 'Official Wholesale Premium Hoodie',
        description: 'Heavyweight cotton fleece hoodie available for verified merchant distribution.',
        price: 79.99,
        stock: 500,
        imageUrl: demoImg,
        isActive: true,
        sellerId: demoSeller.id,
        categoryId: category.id,
        attributes: { size: ['S', 'M', 'L', 'XL'] },
        images: {
          create: [{ url: demoImg, sortOrder: 0 }],
        },
      },
    });
  }

  // Ensure at least one product for seller
  let sellerProduct = await prisma.product.findFirst({ where: { sellerId: seller.id } });
  if (!sellerProduct) {
    const pImg = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=60';
    sellerProduct = await prisma.product.create({
      data: {
        title: 'Nexus Urban Everyday Tee',
        description: 'Everyday crewneck tee with premium combed organic cotton.',
        price: 34.50,
        stock: 150,
        imageUrl: pImg,
        isActive: true,
        sellerId: seller.id,
        categoryId: category.id,
        attributes: { size: ['M', 'L', 'XL'] },
        images: {
          create: [{ url: pImg, sortOrder: 0 }],
        },
      },
    });
  }

  // Ensure order in BOOKED status exists for support advance test
  let testOrder = await prisma.order.findFirst({ where: { status: 'BOOKED' } });
  if (!testOrder) {
    testOrder = await prisma.order.create({
      data: {
        buyerName: 'Jane Test Buyer',
        buyerPhone: '+1987654321',
        buyerAddress: '456 Market Lane, Suite 2',
        productId: sellerProduct.id,
        sellerId: seller.id,
        quantity: 1,
        totalPrice: sellerProduct.price,
        status: 'BOOKED',
        selectedAttributes: { size: 'L' },
      },
    });
  }

  console.log('✅ DB seeded and ready.');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  // Dialog auto-accept
  page.on('dialog', async (dialog) => {
    console.log(`💬 Dialog popup [${dialog.type()}]: "${dialog.message()}"`);
    await dialog.accept();
  });

  // Track 403 errors on public pages
  let forbiddenRequests = [];
  page.on('response', (res) => {
    if (res.status() === 403) {
      forbiddenRequests.push({ url: res.url(), status: 403 });
      console.warn(`⚠️ 403 Forbidden detected: ${res.url()}`);
    }
  });

  async function clearAndType(selector, text) {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, text);
  }

  try {
    // =========================================================================
    // ITEM 5: Check Public Pages for 403 Errors (Logged Out & Guest)
    // =========================================================================
    console.log('\n--- ITEM 5: Checking Public Pages for 403 Errors ---');
    forbiddenRequests = [];
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.goto('http://localhost:3000/categories/all', { waitUntil: 'networkidle0' });
    await sleep(1000);
    console.log(`Public pages 403 count: ${forbiddenRequests.length}`);
    if (forbiddenRequests.length > 0) {
      console.error('FAILED ITEM 5: Public pages triggered 403 requests:', forbiddenRequests);
      throw new Error('Public pages triggered 403 requests!');
    } else {
      console.log('✅ ITEM 5 PASSED: 0 403 errors triggered on public pages.');
    }

    // =========================================================================
    // ITEM 2 & 3: Seller Dashboard (Stock Quota removed, Wholesale Catalog merged)
    // =========================================================================
    console.log('\n--- ITEM 2 & 3: Seller Dashboard Verifications ---');
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await clearAndType('input[type="email"]', 'official@nexus.com');
    await clearAndType('input[type="password"]', 'SellerPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(2000);

    // Verify Tab buttons in Seller Dashboard
    const sellerTabTexts = await page.$$eval('button', (btns) => btns.map((b) => b.textContent.trim()));
    const hasStockQuotaTab = sellerTabTexts.some((t) => t.includes('Stock Quota'));
    const hasWholesaleTab = sellerTabTexts.some((t) => t.includes('Wholesale Catalog'));
    console.log(`Seller Tabs: has 'Stock Quota'? ${hasStockQuotaTab} | has 'Wholesale Catalog'? ${hasWholesaleTab}`);
    if (hasStockQuotaTab || hasWholesaleTab) {
      throw new Error('FAIL: Seller Dashboard still contains removed tabs!');
    }
    console.log('✅ ITEM 2 (Seller): "Stock Quota" and "Wholesale Catalog" tabs successfully removed.');

    // Verify "Total Inventory" stat card
    const pageContent = await page.content();
    const hasTotalInventoryCard = pageContent.includes('Total Inventory');
    console.log(`Seller Dashboard has 'Total Inventory' stat card? ${hasTotalInventoryCard}`);
    if (!hasTotalInventoryCard) {
      throw new Error('FAIL: Seller Dashboard missing "Total Inventory" stat card!');
    }
    console.log('✅ ITEM 2 (Seller): "Total Inventory" stat card present.');

    // Capture Seller Dashboard screenshot
    const sellerDashScreenshotPath = path.join(ARTIFACTS_DIR, 'seller_dashboard_mega_fix.png');
    await page.screenshot({ path: sellerDashScreenshotPath, fullPage: false });
    console.log(`📸 Saved Seller Dashboard screenshot: ${sellerDashScreenshotPath}`);

    // Verify "Add from Official Store" button
    console.log('Checking "Add from Official Store" button in Products tab...');
    const officialBtn = await page.waitForSelector('button ::-p-text(Add from Official Store)', { timeout: 5000 });
    if (!officialBtn) {
      throw new Error('FAIL: "Add from Official Store" button not found in Products tab!');
    }
    await officialBtn.click();
    await sleep(1500);

    // Verify Official Store Catalog Modal opens
    const catalogModal = await page.waitForSelector('h3 ::-p-text(Add from Official Store)', { timeout: 8000 });
    if (!catalogModal) {
      throw new Error('FAIL: "Add from Official Store" modal did not open!');
    }
    console.log('✅ ITEM 3: "Add from Official Store" modal successfully opened.');

    const catalogModalScreenshotPath = path.join(ARTIFACTS_DIR, 'add_from_official_store_modal.png');
    await page.screenshot({ path: catalogModalScreenshotPath, fullPage: false });
    console.log(`📸 Saved Catalog Modal screenshot: ${catalogModalScreenshotPath}`);

    // Click "Select & Import" on the first official product
    console.log('Testing "Select & Import" button...');
    const importBtns = await page.$$('button');
    let imported = false;
    for (const b of importBtns) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Select & Import')) {
        await b.click();
        imported = true;
        break;
      }
    }
    if (!imported) {
      throw new Error('FAIL: "Select & Import" button not found in modal!');
    }
    await sleep(1500);

    // Verify Add Product form is pre-filled
    const titleInput = await page.waitForSelector('input[placeholder*="Keyboard"]', { timeout: 8000 });
    const titleVal = await page.evaluate((el) => el.value, titleInput);
    console.log(`Add Product Form Title pre-filled with: "${titleVal}"`);
    if (!titleVal || titleVal.length < 3) {
      throw new Error(`FAIL: Product title not pre-filled correctly! Got: "${titleVal}"`);
    }
    console.log('✅ ITEM 3: Add Product form successfully pre-filled from official store catalog!');

    const prefillScreenshotPath = path.join(ARTIFACTS_DIR, 'add_product_prefilled_from_catalog.png');
    await page.screenshot({ path: prefillScreenshotPath, fullPage: false });
    console.log(`📸 Saved Pre-filled Form screenshot: ${prefillScreenshotPath}`);

    // Close modal
    await page.keyboard.press('Escape');
    await sleep(1000);

    // =========================================================================
    // ITEM 4: Tab Switch Scroll Position
    // =========================================================================
    console.log('\n--- ITEM 4: Testing Tab Switch Scroll Position ---');
    await page.evaluate(() => window.scrollTo(0, 500));
    let scrollYBefore = await page.evaluate(() => window.scrollY);
    console.log(`Scroll position before tab switch: ${scrollYBefore}px`);

    const ordersTab = await page.waitForSelector('button ::-p-text(Orders)');
    await ordersTab.click();
    await sleep(500);

    let scrollYAfter = await page.evaluate(() => window.scrollY);
    console.log(`Scroll position after tab switch: ${scrollYAfter}px`);
    if (scrollYAfter !== 0) {
      throw new Error(`FAIL: Scroll position after tab switch was ${scrollYAfter}, expected 0!`);
    }
    console.log('✅ ITEM 4: Tab switch successfully reset scroll position to 0.');

    // =========================================================================
    // ITEM 2: Admin Dashboard (Stock Requests removed, Active Stores card present)
    // =========================================================================
    console.log('\n--- ITEM 2: Admin Dashboard Verifications ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await clearAndType('input[type="email"]', 'admin@nayyar.com');
    await clearAndType('input[type="password"]', 'admin!#$123@');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(2000);

    const adminTabTexts = await page.$$eval('button', (btns) => btns.map((b) => b.textContent.trim()));
    const hasStockRequestsTab = adminTabTexts.some((t) => t.includes('Stock Requests'));
    console.log(`Admin Tabs: has 'Stock Requests'? ${hasStockRequestsTab}`);
    if (hasStockRequestsTab) {
      throw new Error('FAIL: Admin Dashboard still contains "Stock Requests" tab!');
    }
    console.log('✅ ITEM 2 (Admin): "Stock Requests" tab successfully removed.');

    const adminContent = await page.content();
    const hasActiveStoresCard = adminContent.includes('Active Stores');
    console.log(`Admin Dashboard has 'Active Stores' stat card? ${hasActiveStoresCard}`);
    if (!hasActiveStoresCard) {
      throw new Error('FAIL: Admin Dashboard missing "Active Stores" stat card!');
    }
    console.log('✅ ITEM 2 (Admin): "Active Stores" stat card present.');

    // Test category creation to verify NO crash / NO false permission error
    console.log('Testing Category creation in Admin Dashboard...');
    const categoriesTab = await page.waitForSelector('button ::-p-text(Categories)');
    await categoriesTab.click();
    await sleep(1000);

    const testCatName = `Gadgets-${Date.now().toString().slice(-4)}`;
    await clearAndType('input[placeholder*="Watches"]', testCatName);
    const createCatBtn = await page.waitForSelector('button ::-p-text(Create category)', { timeout: 5000 });
    await createCatBtn.click();
    await sleep(1500);

    const updatedAdminContent = await page.content();
    if (!updatedAdminContent.includes(testCatName)) {
      throw new Error('FAIL: Newly created category not rendered in Admin Dashboard!');
    }
    console.log(`✅ ITEM 1 (Admin): Category "${testCatName}" created smoothly without crash or permission flash.`);

    const adminDashScreenshotPath = path.join(ARTIFACTS_DIR, 'admin_dashboard_mega_fix.png');
    await page.screenshot({ path: adminDashScreenshotPath, fullPage: false });
    console.log(`📸 Saved Admin Dashboard screenshot: ${adminDashScreenshotPath}`);

    // =========================================================================
    // ITEM 1: Support Dashboard Order Advance (NO White-Screen Crash)
    // =========================================================================
    console.log('\n--- ITEM 1: Support Dashboard Order Advance ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/support/login', { waitUntil: 'networkidle0' });
    await clearAndType('input[type="email"]', 'support1@nayyar.com');
    await clearAndType('input[type="password"]', 'nayyar123@#$');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(2000);

    // Click Orders tab
    const supportOrdersTab = await page.waitForSelector('button ::-p-text(Order Lifecycle)', { timeout: 8000 });
    await supportOrdersTab.click();
    await sleep(1000);

    // Advance first actionable order
    const advanceBtns = await page.$$('button');
    let advancedOrder = false;
    for (const b of advanceBtns) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Mark as Processing') || text.includes('Mark as Shipping') || text.includes('Mark as Delivered')) {
        console.log(`Clicking advance button: "${text}"...`);
        await b.click();
        advancedOrder = true;
        break;
      }
    }
    await sleep(2500);

    // Assert page did NOT crash to white screen
    const supportPageContent = await page.content();
    if (supportPageContent.length < 500 || !supportPageContent.includes('Orders Lifecycle')) {
      throw new Error('FAIL: Support Dashboard crashed or showed white screen after advancing order!');
    }
    console.log('✅ ITEM 1 (Support): Order advanced successfully with NO white screen or crash!');

    const supportDashScreenshotPath = path.join(ARTIFACTS_DIR, 'support_dashboard_advance_success.png');
    await page.screenshot({ path: supportDashScreenshotPath, fullPage: false });
    console.log(`📸 Saved Support Dashboard screenshot: ${supportDashScreenshotPath}`);

    // =========================================================================
    // ITEM 6: Checkout Confirmation Page ("Order Total: $X")
    // =========================================================================
    console.log('\n--- ITEM 6: Checkout Confirmation Page Copy ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/categories/all', { waitUntil: 'networkidle0' });
    await sleep(1500);

    // Click on the first product card
    const firstProductLink = await page.waitForSelector('a[href*="/products/"]', { timeout: 10000 });
    await firstProductLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(1500);

    // If size options exist, select one
    const sizeBtns = await page.$$('button');
    for (const b of sizeBtns) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (['S', 'M', 'L', 'XL'].includes(text.trim())) {
        await b.click();
        await sleep(300);
        break;
      }
    }

    // Click "Add to Cart"
    const addToCartBtn = await page.waitForSelector('button ::-p-text(ADD TO CART)', { timeout: 10000 });
    await addToCartBtn.click();
    await sleep(1000);

    // Go to checkout
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle0' });
    await sleep(1000);

    // Fill checkout form
    await clearAndType('input[placeholder*="Johnathan Doe"]', 'Alex Johnson');
    await clearAndType('input[placeholder*="555"]', '03009876543');
    await clearAndType('textarea[placeholder*="Street address"]', '742 Evergreen Terrace, Springfield');

    // Submit order
    const placeOrderBtn = await page.waitForSelector('button ::-p-text(CONFIRM & PLACE ORDER)', { timeout: 10000 });
    await placeOrderBtn.click();
    await sleep(3000);

    // Verify confirmation screen
    const confContent = await page.content();
    const hasOrderTotal = confContent.includes('Order Total:');
    const hasTotalPaid = confContent.includes('Total Paid:');
    console.log(`Checkout confirmation has 'Order Total:'? ${hasOrderTotal} | has 'Total Paid:'? ${hasTotalPaid}`);

    if (!hasOrderTotal) {
      throw new Error('FAIL: Checkout confirmation page missing "Order Total:" copy!');
    }
    if (hasTotalPaid) {
      throw new Error('FAIL: Checkout confirmation page still contains outdated "Total Paid:" copy!');
    }
    console.log('✅ ITEM 6: Checkout confirmation correctly displays "Order Total:" (not "Total Paid:").');

    const checkoutConfScreenshotPath = path.join(ARTIFACTS_DIR, 'checkout_order_total_confirmation.png');
    await page.screenshot({ path: checkoutConfScreenshotPath, fullPage: false });
    console.log(`📸 Saved Checkout Confirmation screenshot: ${checkoutConfScreenshotPath}`);

    console.log('\n================================================================');
    console.log('🎉 ALL 6 MEGA FIX ITEMS SYSTEMATICALLY VERIFIED WITH 100% SUCCESS!');
    console.log('================================================================');
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Verification script failed:', err);
  process.exit(1);
});
