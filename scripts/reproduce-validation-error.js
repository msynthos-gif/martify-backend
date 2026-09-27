const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SCREENSHOT_PATH = path.resolve(
  'C:/Users/SAIFULLAH/.gemini/antigravity-ide/brain/1a3e58ed-faaf-4ea3-b369-eaa0ae164992/seller_product_validation_error.png'
);

async function main() {
  console.log('🔍 Reproducing validation error for (Description: "fdsf", Price: 3, Stock: 10)...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  let capturedAlert = null;
  page.on('dialog', async (dialog) => {
    capturedAlert = dialog.message();
    console.log(`⚠️ [Dialog Alert]:\n"${capturedAlert}"`);
    await dialog.dismiss();
  });

  page.on('response', async (res) => {
    if (res.url().includes('/api/seller/products') && res.request().method() === 'POST') {
      console.log(`\n⬅️ [POST /api/seller/products Status]: ${res.status()}`);
      try {
        const body = await res.json();
        console.log('Response body:', JSON.stringify(body, null, 2));
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
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', 'official@nexus.com');
  await page.type('input[type="password"]', 'SellerPass123!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));

  // Click Add Product
  console.log('Opening Add Product modal...');
  const addBtn = await page.waitForSelector('button ::-p-text(Add product)', { timeout: 5000 });
  await addBtn.click();
  await new Promise((r) => setTimeout(r, 1000));

  // Fill in exact user case
  console.log('Entering: Title="fdsf", Description="fdsf", Price="3", Stock="10"...');
  await page.type('input[placeholder="e.g. Mechanical Keyboard"]', 'fdsf');
  await page.type('textarea[placeholder="Product specifications and features"]', 'fdsf');

  const priceInput = await page.$('input[placeholder="49.99"]');
  await priceInput.click({ clickCount: 3 });
  await priceInput.type('3');

  const stockInput = await page.$('input[type="number"]:not([placeholder="49.99"])');
  if (stockInput) {
    await stockInput.click({ clickCount: 3 });
    await stockInput.type('10');
  }

  // Select Beauty & Personal Care category if available
  const selectElem = await page.$('select');
  if (selectElem) {
    const options = await page.$$eval('select option', (opts) =>
      opts.map((o) => ({ value: o.value, text: o.textContent }))
    );
    const beautyOpt = options.find((o) => o.text && o.text.includes('Beauty'));
    if (beautyOpt) {
      await page.select('select', beautyOpt.value);
    }
  }

  // Submit product
  console.log('Clicking Save product...');
  const saveBtn = await page.waitForSelector('button ::-p-text(Save product)', { timeout: 5000 });
  await saveBtn.click();

  // Wait for response and error banner
  await new Promise((r) => setTimeout(r, 2500));

  const errorBanner = await page.$('#product-form-error-banner');
  if (errorBanner) {
    const errorText = await page.evaluate((el) => el.textContent, errorBanner);
    console.log(`\n✅ Surfaced Error Banner in UI:\n"${errorText.trim()}"`);
  } else {
    console.log('No error banner found in DOM.');
  }

  console.log(`Saving validation error screenshot to: ${SCREENSHOT_PATH}...`);
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
  console.log('📸 Screenshot captured.');

  await browser.close();
  console.log('Completed reproduction run.');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
