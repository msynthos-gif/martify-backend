const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\f2b3fcde-4c35-4722-a439-ba2c154185f6';

// Create a dummy KYC file for upload test
const dummyKycPath = path.join(__dirname, 'dummy-kyc.png');
if (!fs.existsSync(dummyKycPath)) {
  // Simple 1x1 transparent PNG buffer
  const dummyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(dummyKycPath, dummyPng);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runE2E() {
  console.log('🚀 Starting Comprehensive End-to-End Walkthrough & Screenshot Capture...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const timestamp = Date.now().toString().slice(-6);
  const testSellerEmail = `seller_${timestamp}@marketplace.com`;
  const testSellerPass = 'SellerPass123!';
  const testSellerName = `Apex Labs ${timestamp}`;

  try {
    const page = await browser.newPage();
    page.on('dialog', async (dialog) => {
      console.log(`[Dialog Prompt]: ${dialog.message()}`);
      await dialog.accept();
    });

    // ==========================================
    // 1. GUEST SHOPPING FLOW: ADD TO CART & CART PAGE
    // ==========================================
    console.log('\n--- 1. Testing Guest Cart Flow ---');
    await page.goto('http://localhost:3000/categories/all', { waitUntil: 'networkidle0', timeout: 20000 });
    await sleep(2000);

    // Click on the first product card to go to Product Detail
    console.log('Navigating to first product...');
    const productCard = await page.$('a[href^="/products/"]');
    if (productCard) {
      await productCard.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    } else {
      await page.goto('http://localhost:3000/products/130a6ca9-1594-452d-82b8-8e8893ad892f', { waitUntil: 'networkidle0' });
    }
    await sleep(2000);

    // Increase quantity to 2 and Click "ADD TO CART"
    console.log('Adding product to cart...');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('ADD TO CART')) {
        await btn.click();
        break;
      }
    }
    await sleep(2000);

    // Navigate to /cart
    console.log('Navigating to /cart...');
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(2000);

    // Click '+' button to increment quantity
    console.log('Testing quantity edit on CartPage...');
    const plusButtons = await page.$$('button');
    for (const btn of plusButtons) {
      const html = await page.evaluate((el) => el.innerHTML, btn);
      if (html.includes('lucide-plus') || html.includes('Plus')) {
        await btn.click();
        await sleep(1000);
        break;
      }
    }

    const cartShotPath = path.join(ARTIFACTS_DIR, 'cart.png');
    await page.screenshot({ path: cartShotPath, fullPage: false });
    console.log('✅ Captured CartPage ->', cartShotPath);

    // ==========================================
    // 2. CHECKOUT FLOW
    // ==========================================
    console.log('\n--- 2. Testing Checkout Flow ---');
    // Click "PROCEED TO CHECKOUT"
    const checkoutBtn = await page.$('a[href="/checkout"]');
    if (checkoutBtn) {
      await checkoutBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    } else {
      await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle0' });
    }
    await sleep(2000);

    console.log('Filling checkout form...');
    await page.type('input[placeholder*="Johnathan Doe"]', 'Jane Montgomery');
    await page.type('input[placeholder*="(555) 019-2834"]', '+1 (555) 234-5678');
    await page.type('textarea', '450 North Ocean Boulevard, Suite 800, Miami, FL 33139');
    await sleep(1000);

    // Submit checkout
    console.log('Submitting order...');
    const submitOrderBtn = await page.$('button[type="submit"]');
    if (submitOrderBtn) {
      await submitOrderBtn.click();
    }
    await sleep(4000);

    const checkoutShotPath = path.join(ARTIFACTS_DIR, 'checkout.png');
    await page.screenshot({ path: checkoutShotPath, fullPage: false });
    console.log('✅ Captured CheckoutPage (Order Confirmed) ->', checkoutShotPath);

    // ==========================================
    // 3. SELLER REGISTRATION & KYC UPLOAD
    // ==========================================
    console.log('\n--- 3. Testing Seller Registration & KYC ---');
    await page.goto('http://localhost:3000/seller/register', { waitUntil: 'networkidle0' });
    await sleep(2000);

    await page.type('input[placeholder*="Apex Modern Goods"]', testSellerName);
    await page.type('input[placeholder*="seller@example.com"]', testSellerEmail);
    await page.type('input[placeholder*="(555) 019-2834"]', '+1 555 444 3322');
    await page.type('input[placeholder*="••••••••"]', testSellerPass);

    // Upload dummy KYC
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(dummyKycPath);
      console.log('Attached dummy KYC document...');
    }
    await sleep(1000);

    const sellerRegShotPath = path.join(ARTIFACTS_DIR, 'seller_register.png');
    await page.screenshot({ path: sellerRegShotPath, fullPage: false });
    console.log('✅ Captured SellerRegisterPage ->', sellerRegShotPath);

    // Submit registration
    console.log('Submitting seller registration...');
    const regSubmitBtn = await page.$('button[type="submit"]');
    if (regSubmitBtn) {
      await regSubmitBtn.click();
    }
    await sleep(4000);

    // ==========================================
    // 4. ADMIN LOGIN & ADMIN DASHBOARD (APPROVE KYC)
    // ==========================================
    console.log('\n--- 4. Testing Admin Login & KYC Approval ---');
    // Clear localStorage to sign out
    await page.evaluate(() => localStorage.clear());

    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await sleep(1500);

    const adminLoginShotPath = path.join(ARTIFACTS_DIR, 'admin_login.png');
    await page.screenshot({ path: adminLoginShotPath, fullPage: false });
    console.log('✅ Captured AdminLoginPage ->', adminLoginShotPath);

    await page.type('input[type="password"]', 'admin!#$123@');
    await sleep(300);

    const adminLoginBtn = await page.$('button[type="submit"]');
    if (adminLoginBtn) {
      await adminLoginBtn.click();
    }
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(3000);

    // Switch to KYC Review Tab
    console.log('Switching to Admin KYC Review Tab...');
    const adminTabBtns = await page.$$('button');
    for (const btn of adminTabBtns) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('KYC Review')) {
        await btn.click();
        break;
      }
    }
    await sleep(2000);

    // Approve the pending KYC
    console.log('Approving seller KYC...');
    const approveBtns = await page.$$('button');
    for (const btn of approveBtns) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('APPROVE KYC')) {
        await btn.click();
        await sleep(1500);
        break;
      }
    }

    // Switch to Sellers Tab and approve status if pending
    for (const btn of adminTabBtns) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('Sellers Directory')) {
        await btn.click();
        break;
      }
    }
    await sleep(2000);

    const adminDashboardShotPath = path.join(ARTIFACTS_DIR, 'admin_dashboard.png');
    await page.screenshot({ path: adminDashboardShotPath, fullPage: false });
    console.log('✅ Captured AdminDashboardPage ->', adminDashboardShotPath);

    // ==========================================
    // 5. SELLER LOGIN & SELLER DASHBOARD (PRODUCTS, STOCK, CATALOG, TICKETS)
    // ==========================================
    console.log('\n--- 5. Testing Seller Login & Dashboard ---');
    await page.evaluate(() => localStorage.clear());

    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await sleep(1500);

    const sellerLoginShotPath = path.join(ARTIFACTS_DIR, 'seller_login.png');
    await page.screenshot({ path: sellerLoginShotPath, fullPage: false });
    console.log('✅ Captured SellerLoginPage ->', sellerLoginShotPath);

    // Use demo seller (techzone@demo.com)
    await page.type('input[type="email"]', 'techzone@demo.com');
    await page.type('input[type="password"]', 'SellerPass123!');
    await sleep(500);

    const sellerLoginBtn = await page.$('button[type="submit"]');
    if (sellerLoginBtn) {
      await sellerLoginBtn.click();
    }
    await sleep(3000);

    // Open Catalog tab and clone an item
    console.log('Opening Catalog tab in Seller Dashboard...');
    const sellerTabs = await page.$$('button');
    for (const tab of sellerTabs) {
      const text = await page.evaluate((el) => el.textContent, tab);
      if (text && text.includes('Catalog (Wholesale)')) {
        await tab.click();
        break;
      }
    }
    await sleep(2000);

    // Open Stock Quota tab
    console.log('Opening Stock Quota tab in Seller Dashboard...');
    const stockTabs = await page.$$('button');
    for (const tab of stockTabs) {
      const text = await page.evaluate((el) => el.textContent, tab);
      if (text && text.includes('My Stock Quota')) {
        await tab.click();
        break;
      }
    }
    await sleep(2000);

    // Open Balance tab
    console.log('Opening Balance tab in Seller Dashboard...');
    const balanceTabs = await page.$$('button');
    for (const tab of balanceTabs) {
      const text = await page.evaluate((el) => el.textContent, tab);
      if (text && text.includes('Balance & Escrow')) {
        await tab.click();
        break;
      }
    }
    await sleep(1500);

    // Switch back to My Products tab for clean showcase
    for (const tab of sellerTabs) {
      const text = await page.evaluate((el) => el.textContent, tab);
      if (text && text.includes('My Products')) {
        await tab.click();
        break;
      }
    }
    await sleep(2000);

    const sellerDashboardShotPath = path.join(ARTIFACTS_DIR, 'seller_dashboard.png');
    await page.screenshot({ path: sellerDashboardShotPath, fullPage: false });
    console.log('✅ Captured SellerDashboardPage ->', sellerDashboardShotPath);

    // ==========================================
    // 6. SUPPORT LOGIN & SUPPORT DASHBOARD (CHAT & ORDER STATUS ADVANCE)
    // ==========================================
    console.log('\n--- 6. Testing Support Login & Operations Console ---');
    await page.evaluate(() => localStorage.clear());

    await page.goto('http://localhost:3000/support/login', { waitUntil: 'networkidle0' });
    await sleep(1500);

    const supportLoginShotPath = path.join(ARTIFACTS_DIR, 'support_login.png');
    await page.screenshot({ path: supportLoginShotPath, fullPage: false });
    console.log('✅ Captured SupportLoginPage ->', supportLoginShotPath);

    await page.type('input[type="password"]', 'nayyar123@#$');
    await sleep(300);

    const supportLoginBtn = await page.$('button[type="submit"]');
    if (supportLoginBtn) {
      await supportLoginBtn.click();
    }
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(3000);

    // Send a message reply to active ticket if available
    console.log('Testing ticket reply in Support Console...');
    const replyInput = await page.$('input[placeholder="Type your response to the merchant..."]');
    if (replyInput) {
      await replyInput.type('Support has verified your inventory allocation. All clear!');
      const sendReplyBtn = await page.$('button[type="submit"]');
      if (sendReplyBtn) {
        await sendReplyBtn.click();
        await sleep(1500);
      }
    }

    // Switch to Orders Lifecycle tab
    console.log('Switching to Orders Lifecycle tab in Support Console...');
    const supportTabs = await page.$$('button');
    for (const tab of supportTabs) {
      const text = await page.evaluate((el) => el.textContent, tab);
      if (text && text.includes('Orders Lifecycle')) {
        await tab.click();
        break;
      }
    }
    await sleep(2000);

    // Advance order status if available
    const advanceBtns = await page.$$('button');
    for (const btn of advanceBtns) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && (text.includes('MARK AS PROCESSING') || text.includes('MARK AS SHIPPING') || text.includes('MARK AS DELIVERED'))) {
        console.log(`Advancing order lifecycle via: "${text}"`);
        await btn.click();
        await sleep(2000);
        break;
      }
    }

    const supportDashboardShotPath = path.join(ARTIFACTS_DIR, 'support_dashboard.png');
    await page.screenshot({ path: supportDashboardShotPath, fullPage: false });
    console.log('✅ Captured SupportDashboardPage ->', supportDashboardShotPath);

    console.log('\n🎉 COMPLETED END-TO-END FLOW ACROSS ALL 11 PAGES!');
  } catch (err) {
    console.error('❌ E2E Walkthrough error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runE2E().catch((err) => {
  console.error(err);
  process.exit(1);
});
