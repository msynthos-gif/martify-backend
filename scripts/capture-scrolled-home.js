const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\f2b3fcde-4c35-4722-a439-ba2c154185f6';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // 1. Homepage Scrolled (Featured Row & Category Tiles)
  console.log('Navigating to Homepage and scrolling to featured & category tiles...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.evaluate(() => window.scrollBy(0, 750));
  await new Promise((r) => setTimeout(r, 1500));
  const featuredPath = path.join(ARTIFACTS_DIR, 'homepage_featured_and_categories.png');
  await page.screenshot({ path: featuredPath, fullPage: false });
  console.log('Saved homepage featured section to:', featuredPath);

  // Full page homepage screenshot
  const fullHomePath = path.join(ARTIFACTS_DIR, 'homepage_full.png');
  await page.screenshot({ path: fullHomePath, fullPage: true });
  console.log('Saved homepage full page screenshot to:', fullHomePath);

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
