const puppeteer = require('puppeteer-core');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\f2b3fcde-4c35-4722-a439-ba2c154185f6';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  try {
    const page = await browser.newPage();

    async function clearAndType(selector, text) {
      await page.waitForSelector(selector);
      await page.click(selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(selector, text);
    }

    // 1. Admin KYC Tab
    console.log('Capturing Admin KYC tab...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await clearAndType('input[type="email"]', 'admin@nayyar.com');
    await clearAndType('input[type="password"]', 'admin!#$123@');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await sleep(2000);

    // Click KYC tab
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('KYC Review')) {
        await tab.click();
        break;
      }
    }
    await sleep(1000);
    const adminKycPath = path.join(ARTIFACTS_DIR, 'admin_kyc_tab.png');
    await page.screenshot({ path: adminKycPath, fullPage: false });
    console.log('Saved Admin KYC screenshot:', adminKycPath);

    // 2. Support Orders Tab
    console.log('Capturing Support Orders tab...');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/support/login', { waitUntil: 'networkidle0' });
    await clearAndType('input[type="email"]', 'support1@nayyar.com');
    await clearAndType('input[type="password"]', 'nayyar123@#$');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await sleep(2000);

    // Click Order Lifecycle tab
    const supportTabs = await page.$$('button');
    for (const tab of supportTabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('Order Lifecycle')) {
        await tab.click();
        break;
      }
    }
    await sleep(1000);
    const supportOrdersPath = path.join(ARTIFACTS_DIR, 'support_orders_tab.png');
    await page.screenshot({ path: supportOrdersPath, fullPage: false });
    console.log('Saved Support Orders screenshot:', supportOrdersPath);

  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
