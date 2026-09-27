const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\f2b3fcde-4c35-4722-a439-ba2c154185f6';

async function capture() {
  console.log('Launching browser with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // 1. Homepage
  console.log('Navigating to Homepage...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 3000));
  const homePath = path.join(ARTIFACTS_DIR, 'homepage.png');
  await page.screenshot({ path: homePath, fullPage: false });
  console.log('Saved homepage screenshot to:', homePath);

  // 2. Product Listing Page
  console.log('Navigating to Product Listing Page...');
  await page.goto('http://localhost:3000/categories/all', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 3000));
  const listingPath = path.join(ARTIFACTS_DIR, 'product_listing.png');
  await page.screenshot({ path: listingPath, fullPage: false });
  console.log('Saved product listing screenshot to:', listingPath);

  // 3. Product Detail Page
  console.log('Navigating to Product Detail Page...');
  await page.goto('http://localhost:3000/products/130a6ca9-1594-452d-82b8-8e8893ad892f', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 3000));
  const detailPath = path.join(ARTIFACTS_DIR, 'product_detail.png');
  await page.screenshot({ path: detailPath, fullPage: false });
  console.log('Saved product detail screenshot to:', detailPath);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
