const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🧪 Starting Browser UI Login Verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  async function clearAndType(selector, text) {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, text, { delay: 20 });
  }

  try {
    // 1. Test Admin Login UI
    console.log('\nTesting Admin Login via UI (http://localhost:3000/admin/login)...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());

    await clearAndType('input[type="email"]', 'admin@nayyar.com');
    await clearAndType('input[type="password"]', 'admin!#$123@');
    await page.click('button[type="submit"]');

    await page.waitForFunction(
      () => window.location.pathname.includes('/admin/dashboard') || window.location.pathname === '/admin',
      { timeout: 10000 }
    );
    console.log(`✅ Admin UI login succeeded! Current URL: ${page.url()}`);

    // Check that admin dashboard rendered
    await sleep(1000);
    const adminToken = await page.evaluate(() => localStorage.getItem('token'));
    console.log(`Admin token in localStorage: ${Boolean(adminToken)}`);

    // 2. Test Support Login UI
    console.log('\nTesting Support Login via UI (http://localhost:3000/support/login)...');
    await page.goto('http://localhost:3000/support/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());

    await clearAndType('input[type="email"]', 'support1@nayyar.com');
    await clearAndType('input[type="password"]', 'nayyar123@#$');
    await page.click('button[type="submit"]');

    await page.waitForFunction(
      () => window.location.pathname.includes('/support/dashboard') || window.location.pathname === '/support',
      { timeout: 10000 }
    );
    console.log(`✅ Support UI login succeeded! Current URL: ${page.url()}`);

    await sleep(1000);
    const supportToken = await page.evaluate(() => localStorage.getItem('token'));
    console.log(`Support token in localStorage: ${Boolean(supportToken)}`);

    // 3. Test Seller Login UI
    console.log('\nTesting Seller Login via UI (http://localhost:3000/seller/login)...');
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());

    await clearAndType('input[type="email"]', 'official@nexus.com');
    await clearAndType('input[type="password"]', 'SellerPass123!');
    await page.click('button[type="submit"]');

    await page.waitForFunction(
      () => window.location.pathname.includes('/seller/dashboard') || window.location.pathname === '/seller',
      { timeout: 10000 }
    );
    console.log(`✅ Seller UI login succeeded! Current URL: ${page.url()}`);

    await sleep(1000);
    const sellerToken = await page.evaluate(() => localStorage.getItem('token'));
    console.log(`Seller token in localStorage: ${Boolean(sellerToken)}`);

    console.log('\n🎉 ALL 3 UI LOGIN FLOWS VERIFIED AND SUCCEEDED!');
  } catch (err) {
    console.error('❌ UI Login Test Error:', err.message);
    const currentUrl = page.url();
    console.error('URL at failure:', currentUrl);
    const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
    console.error('Page text snippet:', bodyText.slice(0, 300));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
