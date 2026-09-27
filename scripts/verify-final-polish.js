const puppeteer = require('puppeteer-core');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\227ac56f-f385-4070-98da-7570e503727b';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Starting Verification for 4 Final Polish Items...');

  // Setup a test seller for Item 3 (KYC Approved, Store PENDING)
  const salt = await bcrypt.genSalt(10);
  const testSellerHash = await bcrypt.hash('TestSeller123!', salt);
  await prisma.user.upsert({
    where: { email: 'kyc.test.seller@testmarket.com' },
    update: {
      passwordHash: testSellerHash,
      role: 'SELLER',
      sellerStatus: 'PENDING',
      kycStatus: 'APPROVED',
      name: 'KYC Test Merchant',
      phone: '+15551234567',
    },
    create: {
      email: 'kyc.test.seller@testmarket.com',
      passwordHash: testSellerHash,
      role: 'SELLER',
      sellerStatus: 'PENDING',
      kycStatus: 'APPROVED',
      name: 'KYC Test Merchant',
      phone: '+15551234567',
    },
  });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  async function clearAndType(selector, text) {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, text, { delay: 15 });
  }

  try {
    // =========================================================================
    // ITEM 1: CRITICAL: Global scroll-to-top on EVERY route navigation
    // =========================================================================
    console.log('\n======================================================');
    console.log('ITEM 1: Testing Global Scroll-to-Top across 6 Navigations');
    console.log('======================================================');

    // 1.1 Start at Home page, scroll down 1200px, click a product card link
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => window.scrollTo(0, 1200));
    let initialScroll = await page.evaluate(() => window.scrollY);
    console.log(`1.1 On Home, scrolled down to scrollY: ${initialScroll}`);

    // Click first product card link
    await page.waitForSelector('a[href^="/products/"]', { timeout: 8000 });
    const productLink = await page.$('a[href^="/products/"]');
    await productLink.click();
    await page.waitForFunction(() => window.location.pathname.startsWith('/products/'), { timeout: 8000 });
    await sleep(400);

    let scrollY1 = await page.evaluate(() => window.scrollY);
    console.log(`Navigation 1 -> Product Detail Page: scrollY = ${scrollY1} (Target: 0)`);
    if (scrollY1 !== 0) throw new Error(`FAIL 1.1: scrollY is ${scrollY1}, expected 0`);

    // 1.2 On Product Detail, scroll down 800px, click Footer "Admin Portal Login" link
    await page.evaluate(() => window.scrollTo(0, 800));
    console.log(`1.2 On Product Detail, scrolled down to scrollY: ${await page.evaluate(() => window.scrollY)}`);
    const adminFooterLink = await page.waitForSelector('footer a[href="/admin/login"]', { timeout: 8000 });
    await adminFooterLink.click();
    await page.waitForFunction(() => window.location.pathname === '/admin/login', { timeout: 8000 });
    await sleep(400);

    let scrollY2 = await page.evaluate(() => window.scrollY);
    console.log(`Navigation 2 -> Admin Login Page: scrollY = ${scrollY2} (Target: 0)`);
    if (scrollY2 !== 0) throw new Error(`FAIL 1.2: scrollY is ${scrollY2}, expected 0`);

    // 1.3 On Admin Login, scroll down 400px, click Footer "Register as Vendor" link
    await page.evaluate(() => window.scrollTo(0, 400));
    console.log(`1.3 On Admin Login, scrolled down to scrollY: ${await page.evaluate(() => window.scrollY)}`);
    const vendorFooterLink = await page.waitForSelector('footer a[href="/seller/register"]', { timeout: 8000 });
    await vendorFooterLink.click();
    await page.waitForFunction(() => window.location.pathname === '/seller/register', { timeout: 8000 });
    await sleep(400);

    let scrollY3 = await page.evaluate(() => window.scrollY);
    console.log(`Navigation 3 -> Seller Register Page: scrollY = ${scrollY3} (Target: 0)`);
    if (scrollY3 !== 0) throw new Error(`FAIL 1.3: scrollY is ${scrollY3}, expected 0`);

    // 1.4 On Seller Register, scroll down 600px, click Footer "Support Desk Login" link
    await page.evaluate(() => window.scrollTo(0, 600));
    console.log(`1.4 On Seller Register, scrolled down to scrollY: ${await page.evaluate(() => window.scrollY)}`);
    const supportFooterLink = await page.waitForSelector('footer a[href="/support/login"]', { timeout: 8000 });
    await supportFooterLink.click();
    await page.waitForFunction(() => window.location.pathname === '/support/login', { timeout: 8000 });
    await sleep(400);

    let scrollY4 = await page.evaluate(() => window.scrollY);
    console.log(`Navigation 4 -> Support Login Page: scrollY = ${scrollY4} (Target: 0)`);
    if (scrollY4 !== 0) throw new Error(`FAIL 1.4: scrollY is ${scrollY4}, expected 0`);

    // 1.5 On Support Login, scroll down 300px, click Header Cart link
    await page.evaluate(() => window.scrollTo(0, 300));
    console.log(`1.5 On Support Login, scrolled down to scrollY: ${await page.evaluate(() => window.scrollY)}`);
    const cartLink = await page.waitForSelector('header a[href="/cart"]', { timeout: 8000 });
    await cartLink.click();
    await page.waitForFunction(() => window.location.pathname === '/cart', { timeout: 8000 });
    await sleep(400);

    let scrollY5 = await page.evaluate(() => window.scrollY);
    console.log(`Navigation 5 -> Cart Page: scrollY = ${scrollY5} (Target: 0)`);
    if (scrollY5 !== 0) throw new Error(`FAIL 1.5: scrollY is ${scrollY5}, expected 0`);

    // 1.6 On Cart Page, scroll down, click "Continue Shopping" or "Start Shopping" button
    await page.evaluate(() => window.scrollTo(0, 300));
    const shoppingBtn = await page.waitForSelector('a[href="/products"], a[href="/"]', { timeout: 8000 });
    await shoppingBtn.click();
    await page.waitForFunction(() => window.location.pathname === '/products' || window.location.pathname === '/', { timeout: 8000 });
    await sleep(400);

    let scrollY6 = await page.evaluate(() => window.scrollY);
    console.log(`Navigation 6 -> Storefront Catalog: scrollY = ${scrollY6} (Target: 0)`);
    if (scrollY6 !== 0) throw new Error(`FAIL 1.6: scrollY is ${scrollY6}, expected 0`);

    console.log('✅ ITEM 1 PASSED: All 6 route navigations landed at scrollY === 0 perfectly!');

    // =========================================================================
    // ITEM 2: Seller Dashboard header cards (3 cards, Total Inventory removed, Escrow merged)
    // =========================================================================
    console.log('\n======================================================');
    console.log('ITEM 2: Testing Seller Dashboard Header Cards');
    console.log('======================================================');

    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await clearAndType('input[type="email"]', 'official@nexus.com');
    await clearAndType('input[type="password"]', 'SellerPass123!');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.includes('/seller/dashboard'), { timeout: 10000 });
    await sleep(1500);

    const dashboardHtml = await page.content();

    // Check Total Inventory is removed
    const hasTotalInventory = dashboardHtml.includes('Total Inventory');
    console.log(`Contains 'Total Inventory'? ${hasTotalInventory} (Target: false)`);
    if (hasTotalInventory) throw new Error('FAIL: Header still contains "Total Inventory" card!');

    // Check Escrow on Hold separate card title is removed
    // (Note: "(On Hold: $...)" inside Available Balance is allowed and required, but separate card is removed)
    const hasSeparateEscrowCard = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      return spans.some((s) => s.textContent.trim() === 'Escrow on Hold');
    });
    console.log(`Contains separate 'Escrow on Hold' card? ${hasSeparateEscrowCard} (Target: false)`);
    if (hasSeparateEscrowCard) throw new Error('FAIL: Separate "Escrow on Hold" card still exists!');

    // Check Available Balance card has merged On Hold line
    const hasAvailableBalanceCard = dashboardHtml.includes('Available Balance');
    const hasOnHoldText = dashboardHtml.includes('(On Hold: $');
    console.log(`Contains 'Available Balance'? ${hasAvailableBalanceCard} (Target: true)`);
    console.log(`Contains '(On Hold: $'? ${hasOnHoldText} (Target: true)`);
    if (!hasAvailableBalanceCard || !hasOnHoldText) {
      throw new Error('FAIL: Available Balance card missing or missing (On Hold: $...) merged line!');
    }

    const sellerCardsScreenshot = path.join(ARTIFACTS_DIR, 'seller_dashboard_3cards.png');
    await page.screenshot({ path: sellerCardsScreenshot, fullPage: false });
    console.log(`📸 Saved screenshot: ${sellerCardsScreenshot}`);
    console.log('✅ ITEM 2 PASSED: Header stat cards updated to 3 cards with merged Available Balance + On Hold!');

    // =========================================================================
    // ITEM 3: "KYC Approved — Awaiting Store Activation" banner shows only once
    // =========================================================================
    console.log('\n======================================================');
    console.log('ITEM 3: Testing "KYC Approved" Banner Shows Only Once');
    console.log('======================================================');

    // Login as KYC Test Seller
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await clearAndType('input[type="email"]', 'kyc.test.seller@testmarket.com');
    await clearAndType('input[type="password"]', 'TestSeller123!');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.includes('/seller/dashboard'), { timeout: 10000 });
    await sleep(1500);

    // Visit 1: Banner SHOULD be visible
    const bannerFirstVisit = await page.evaluate(() => {
      return document.body.innerText.includes('KYC Approved — Awaiting Store Activation');
    });
    console.log(`Visit 1 (First Time): Banner visible? ${bannerFirstVisit} (Target: true)`);
    if (!bannerFirstVisit) throw new Error('FAIL: KYC Approved banner was NOT visible on first visit!');

    const kycBannerFirstVisitScreenshot = path.join(ARTIFACTS_DIR, 'kyc_banner_first_visit.png');
    await page.screenshot({ path: kycBannerFirstVisitScreenshot, fullPage: false });
    console.log(`📸 Saved Visit 1 screenshot: ${kycBannerFirstVisitScreenshot}`);

    // Visit 2: Reload dashboard page
    console.log('Reloading Seller Dashboard for Visit 2...');
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(1500);

    // Banner SHOULD NOT be visible
    const bannerSecondVisit = await page.evaluate(() => {
      return document.body.innerText.includes('KYC Approved — Awaiting Store Activation');
    });
    console.log(`Visit 2 (Subsequent Visit): Banner visible? ${bannerSecondVisit} (Target: false)`);
    if (bannerSecondVisit) throw new Error('FAIL: KYC Approved banner is STILL visible on subsequent visit!');

    const kycBannerSecondVisitScreenshot = path.join(ARTIFACTS_DIR, 'kyc_banner_subsequent_visit.png');
    await page.screenshot({ path: kycBannerSecondVisitScreenshot, fullPage: false });
    console.log(`📸 Saved Visit 2 screenshot: ${kycBannerSecondVisitScreenshot}`);
    console.log('✅ ITEM 3 PASSED: KYC Approved banner rendered on first visit and stayed hidden on reload!');

    // =========================================================================
    // ITEM 4: Add a search bar to Support Dashboard's "Order Lifecycle" tab
    // =========================================================================
    console.log('\n======================================================');
    console.log('ITEM 4: Testing Support Dashboard Order Lifecycle Search');
    console.log('======================================================');

    await page.goto('http://localhost:3000/support/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await clearAndType('input[type="email"]', 'support1@nayyar.com');
    await clearAndType('input[type="password"]', 'nayyar123@#$');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.includes('/support'), { timeout: 10000 });
    await sleep(1500);

    // Switch to Orders tab
    const ordersTabBtn = await page.waitForSelector('button ::-p-text(Order Lifecycle)', { timeout: 8000 });
    await ordersTabBtn.click();
    await sleep(1000);

    // Check search input exists
    const searchInput = await page.waitForSelector('input[placeholder*="Search order"]', { timeout: 5000 });
    console.log('Search input found on Order Lifecycle tab!');

    // Get initial row count
    const initialRowsCount = await page.$$eval('tbody tr', (rows) => rows.length);
    console.log(`Initial total orders rendered: ${initialRowsCount}`);

    // Read first order code
    const firstOrderCode = await page.$eval('tbody tr td:first-child', (el) => el.textContent.trim().replace('#', ''));
    console.log(`Testing search for order code prefix: "${firstOrderCode.slice(0, 4)}"`);

    // Type partial code into search bar
    await searchInput.type(firstOrderCode.slice(0, 4), { delay: 30 });
    await sleep(600);

    const filteredRowsCount = await page.$$eval('tbody tr', (rows) => rows.length);
    console.log(`Filtered orders rendered: ${filteredRowsCount}`);
    if (filteredRowsCount === 0 || filteredRowsCount > initialRowsCount) {
      throw new Error('FAIL: Order search did not filter results properly!');
    }

    const searchFilteredScreenshot = path.join(ARTIFACTS_DIR, 'support_order_search_filtered.png');
    await page.screenshot({ path: searchFilteredScreenshot, fullPage: false });
    console.log(`📸 Saved filtered screenshot: ${searchFilteredScreenshot}`);

    // Click clear button
    const clearBtn = await page.$('button[title="Clear search"]');
    if (clearBtn) {
      await clearBtn.click();
      await sleep(500);
    } else {
      await page.click('input[placeholder*="Search order"]', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await sleep(500);
    }

    const restoredRowsCount = await page.$$eval('tbody tr', (rows) => rows.length);
    console.log(`Restored orders count after clearing search: ${restoredRowsCount}`);
    if (restoredRowsCount !== initialRowsCount) {
      throw new Error(`FAIL: Expected ${initialRowsCount} rows after clearing search, got ${restoredRowsCount}`);
    }

    const searchClearedScreenshot = path.join(ARTIFACTS_DIR, 'support_order_search_cleared.png');
    await page.screenshot({ path: searchClearedScreenshot, fullPage: false });
    console.log(`📸 Saved restored search screenshot: ${searchClearedScreenshot}`);
    console.log('✅ ITEM 4 PASSED: Support Dashboard real-time order search and clearing work flawlessly!');

    console.log('\n🎉 ALL 4 FINAL POLISH ITEMS VERIFIED AND PASSED WITH FLYING COLORS!');
  } catch (err) {
    console.error('❌ Verification Error:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch(console.error);
