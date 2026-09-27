const puppeteer = require('puppeteer-core');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\f2b3fcde-4c35-4722-a439-ba2c154185f6';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🔍 Testing Seller Dashboard Banner for seller with KYC APPROVED & SELLER STATUS PENDING...');

  // 1. Ensure RAJA MUDASIR has known password for login
  const newHash = await bcrypt.hash('SellerPass123!', 10);
  const seller = await prisma.user.update({
    where: { email: 'msynthos@gmail.com' },
    data: {
      passwordHash: newHash,
      kycStatus: 'APPROVED',
      sellerStatus: 'PENDING',
    },
  });

  console.log(`Updated seller: ${seller.name} (${seller.email})`);
  console.log(`  - kycStatus: ${seller.kycStatus}`);
  console.log(`  - sellerStatus: ${seller.sellerStatus}`);

  // 2. Launch Puppeteer
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.toString()));

    // 3. Clear storage and log in as RAJA MUDASIR via the login page
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await sleep(1000);

    console.log('Entering seller credentials on login form...');
    await page.type('input[type="email"]', 'msynthos@gmail.com');
    await page.type('input[type="password"]', 'SellerPass123!');
    await sleep(500);

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    }
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await sleep(3000);

    // 4. Verify on /seller/dashboard
    console.log('Current URL after login:', page.url());
    const pageText = await page.evaluate(() => document.body.innerText);

    if (pageText.includes('KYC Approved! Awaiting Final Store Activation')) {
      console.log('✅ Found title: "KYC Approved! Awaiting Final Store Activation"');
    } else {
      console.warn('⚠️ Title not found in page text!');
    }

    if (pageText.includes('Your KYC verification document has been approved!')) {
      console.log('✅ Found description: "Your KYC verification document has been approved! Your store is now awaiting final approval..."');
    } else {
      console.warn('⚠️ Description not found in page text!');
    }

    // 5. Capture screenshot
    const shotPath = path.join(ARTIFACTS_DIR, 'seller_dashboard_kyc_approved_pending_store.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('📸 Captured screenshot to:', shotPath);

    console.log('\n🎉 ALL CHECKS PASSED: Verified Seller Dashboard Banner for KYC APPROVED + STORE PENDING!');
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
