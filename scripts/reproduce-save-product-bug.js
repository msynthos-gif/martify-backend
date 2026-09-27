const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('🔍 Running Reproduction Test for Seller Add Product...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // Monitor all network requests and responses
  page.on('request', (req) => {
    if (req.url().includes('/api/seller/products')) {
      console.log(`\n➡️ [REQUEST] ${req.method()} ${req.url()}`);
      console.log('Headers:', req.headers());
      console.log('PostData:', req.postData());
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/api/seller/products')) {
      console.log(`\n⬅️ [RESPONSE] ${res.status()} ${res.url()}`);
      try {
        const body = await res.text();
        console.log('Response Body:', body);
      } catch (e) {
        console.log('Could not read body:', e.message);
      }
    }
  });

  page.on('dialog', async (dialog) => {
    console.log(`\n⚠️ [BROWSER ALERT]: "${dialog.message()}"`);
    await dialog.dismiss();
  });

  // 1. Go to Seller Login
  console.log('Navigating to Seller Login...');
  await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'official@nexus.com');
  await page.type('input[type="password"]', 'SellerPass123!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Current URL:', page.url());

  // Check localStorage token in browser
  const tokenInStorage = await page.evaluate(() => localStorage.getItem('token'));
  console.log('Token in localStorage:', tokenInStorage ? `${tokenInStorage.substring(0, 25)}...` : 'NONE');

  const userInStorage = await page.evaluate(() => localStorage.getItem('user'));
  console.log('User in localStorage:', userInStorage);

  // Click Add Product
  console.log('Clicking Add Product button...');
  const addBtn = await page.waitForSelector('button ::-p-text(Add product)', { timeout: 5000 }).catch(() => null);
  if (addBtn) {
    await addBtn.click();
  } else {
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

  // Fill in Form
  console.log('Filling in product form...');
  await page.type('input[placeholder="e.g. Mechanical Keyboard"]', 'Nexus Live Test Keyboard');
  await page.type('textarea[placeholder="Product specifications and features"]', 'High quality mechanical keyboard with RGB');
  await page.type('input[placeholder="49.99"]', '89.99');

  // Submit product
  console.log('Clicking Save product button...');
  const saveBtn = await page.waitForSelector('button ::-p-text(Save product)', { timeout: 5000 }).catch(() => null);
  if (saveBtn) {
    await saveBtn.click();
  } else {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Save product')) {
        await b.click();
        break;
      }
    }
  }

  await new Promise((r) => setTimeout(r, 3000));

  await browser.close();
  console.log('Reproduction run completed.');
}

main().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
