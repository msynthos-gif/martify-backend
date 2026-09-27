const puppeteer = require('puppeteer-core');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\f2b3fcde-4c35-4722-a439-ba2c154185f6';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('📸 Starting Calm Business Dashboard Capture...');

  // Ensure known passwords for demo users
  const salt = await bcrypt.genSalt(10);
  const sellerHash = await bcrypt.hash('SellerPass123!', salt);
  const adminHash = await bcrypt.hash('admin!#$123@', salt);
  const supportHash = await bcrypt.hash('nayyar123@#$', salt);

  await prisma.user.updateMany({
    where: { email: 'admin@nayyar.com' },
    data: { passwordHash: adminHash },
  });

  await prisma.user.updateMany({
    where: { email: 'support1@nayyar.com' },
    data: { passwordHash: supportHash },
  });

  await prisma.user.updateMany({
    where: { email: 'techzone@demo.com' },
    data: { passwordHash: sellerHash, sellerStatus: 'APPROVED', kycStatus: 'APPROVED' },
  });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  try {
    const page = await browser.newPage();

    // Helper to safely clear and type in React controlled inputs
    async function clearAndType(selector, text) {
      await page.waitForSelector(selector);
      await page.click(selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(selector, text);
    }

    // 1. ADMIN DASHBOARD
    console.log('\n--- 1. Capturing Admin Dashboard ---');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    await clearAndType('input[type="email"]', 'admin@nayyar.com');
    await clearAndType('input[type="password"]', 'admin!#$123@');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await sleep(2500);

    const adminPath = path.join(ARTIFACTS_DIR, 'admin_dashboard.png');
    await page.screenshot({ path: adminPath, fullPage: false });
    console.log('Saved Admin Dashboard screenshot:', adminPath);

    // 2. SELLER DASHBOARD
    console.log('\n--- 2. Capturing Seller Dashboard ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    await clearAndType('input[type="email"]', 'techzone@demo.com');
    await clearAndType('input[type="password"]', 'SellerPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await sleep(2500);

    const sellerPath = path.join(ARTIFACTS_DIR, 'seller_dashboard.png');
    await page.screenshot({ path: sellerPath, fullPage: false });
    console.log('Saved Seller Dashboard screenshot:', sellerPath);

    // 3. SUPPORT DASHBOARD
    console.log('\n--- 3. Capturing Support Dashboard ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/support/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    await clearAndType('input[type="email"]', 'support1@nayyar.com');
    await clearAndType('input[type="password"]', 'nayyar123@#$');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await sleep(2500);

    const supportPath = path.join(ARTIFACTS_DIR, 'support_dashboard.png');
    await page.screenshot({ path: supportPath, fullPage: false });
    console.log('Saved Support Dashboard screenshot:', supportPath);

    console.log('\n✅ All three dashboard screenshots successfully captured!');
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Failed to capture calm dashboards:', err);
  process.exit(1);
});
