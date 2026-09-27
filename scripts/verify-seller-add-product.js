const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_PATH = path.resolve('C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\1a3e58ed-faaf-4ea3-b369-eaa0ae164992\\seller_products_new_saved.png');

async function main() {
  console.log('🚀 Starting Verification: Save Product in Seller Dashboard...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  let alertMessage = null;
  page.on('dialog', async (dialog) => {
    alertMessage = dialog.message();
    console.log(`⚠️ Browser dialog caught: "${alertMessage}"`);
    await dialog.dismiss();
  });

  page.on('request', (req) => {
    if (req.url().includes('/api/seller/products') && req.method() === 'POST') {
      console.log(`➡️ [POST Request] ${req.url()}`);
      console.log('Authorization Header:', req.headers()['authorization']);
      console.log('Payload:', req.postData());
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/api/seller/products') && res.request().method() === 'POST') {
      console.log(`⬅️ [POST Response Status]: ${res.status()}`);
      try {
        const json = await res.json();
        console.log('Response JSON:', JSON.stringify(json, null, 2));
      } catch (e) {}
    }
  });

  // 1. Go to Login Page
  console.log('Navigating to /seller/login...');
  await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle2' });

  // Clear any existing session in browser
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle2' });

  console.log('Logging in as official@nexus.com...');
  await page.type('input[type="email"]', 'official@nexus.com');
  await page.type('input[type="password"]', 'SellerPass123!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Current URL after login:', page.url());

  // Verify we are on /seller/dashboard
  if (!page.url().includes('/seller/dashboard')) {
    throw new Error(`Expected to be on /seller/dashboard, but was on ${page.url()}`);
  }

  // Check token in localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  console.log('Token stored in localStorage:', token ? `${token.substring(0, 30)}...` : 'MISSING');

  // 2. Ensure "My Products" tab is selected
  console.log('Ensuring Products tab is active...');
  const tabButtons = await page.$$('button');
  for (const b of tabButtons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('My Products') || text.includes('Products')) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1000));

  // 3. Click "Add product" button
  console.log('Clicking Add product button...');
  const addBtn = await page.waitForSelector('button ::-p-text(Add product)', { timeout: 5000 }).catch(() => null);
  if (addBtn) {
    await addBtn.click();
  } else {
    // fallback search
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Add product')) {
        await b.click();
        break;
      }
    }
  }
  await new Promise((r) => setTimeout(r, 1000));

  // 4. Fill in Product Form details
  const uniqueTitle = `Nexus Precision Pro Keyboard ${Date.now().toString().slice(-4)}`;
  console.log(`Filling product form with title: "${uniqueTitle}"...`);

  await page.type('input[placeholder="e.g. Mechanical Keyboard"]', uniqueTitle);
  await page.type(
    'textarea[placeholder="Product specifications and features"]',
    'Custom tactile switches with sound dampening foam, per-key RGB backlighting, and braided USB-C connectivity.'
  );
  await page.type('input[placeholder="49.99"]', '129.99');

  // Stock input
  const stockInput = await page.$('input[placeholder="10"]');
  if (stockInput) {
    await stockInput.click({ clickCount: 3 });
    await stockInput.type('25');
  }

  // 5. Submit Form
  console.log('Submitting Product Form...');
  const saveBtn = await page.waitForSelector('button ::-p-text(Save product)', { timeout: 5000 });
  await saveBtn.click();

  // Wait for save operation and dashboard refresh
  await new Promise((r) => setTimeout(r, 3000));

  if (alertMessage) {
    throw new Error(`Product save triggered alert error: "${alertMessage}"`);
  }

  // 6. Verify the product appears in the list
  const pageContent = await page.content();
  if (pageContent.includes(uniqueTitle)) {
    console.log(`✅ SUCCESS: Found "${uniqueTitle}" in My Products list!`);
  } else {
    console.warn(`⚠️ Warning: "${uniqueTitle}" not immediately detected in page HTML.`);
  }

  // 7. Capture screenshot of "My Products"
  console.log(`Capturing screenshot to: ${SCREENSHOT_PATH}...`);
  await page.screenshot({
    path: SCREENSHOT_PATH,
    fullPage: false,
  });

  console.log('📸 Screenshot saved successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
