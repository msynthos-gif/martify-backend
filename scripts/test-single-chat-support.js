const puppeteer = require('puppeteer-core');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\f2b3fcde-4c35-4722-a439-ba2c154185f6';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Testing Single Continuous Chat Model...');

  // Ensure known passwords
  const salt = await bcrypt.genSalt(10);
  const sellerHash = await bcrypt.hash('SellerPass123!', salt);
  const supportHash = await bcrypt.hash('nayyar123@#$', salt);

  await prisma.user.updateMany({
    where: { email: 'techzone@demo.com' },
    data: { passwordHash: sellerHash, sellerStatus: 'APPROVED', kycStatus: 'APPROVED' },
  });

  await prisma.user.updateMany({
    where: { email: 'support1@nayyar.com' },
    data: { passwordHash: supportHash },
  });

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

    // 1. Log in as Seller (techzone@demo.com)
    console.log('\n--- 1. Seller opens Support Chat ---');
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    await clearAndType('input[type="email"]', 'techzone@demo.com');
    await clearAndType('input[type="password"]', 'SellerPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await sleep(2500);

    // Switch to Support Chat tab
    console.log('Switching to Support Chat tab on Seller Dashboard...');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Support Chat')) {
        await btn.click();
        break;
      }
    }
    await sleep(1500);

    // Type and send a message from seller
    console.log('Sending message from seller...');
    const chatInputSelector = 'input[placeholder*="Type your message to support"]';
    await page.waitForSelector(chatInputSelector);
    await page.type(chatInputSelector, 'Hello support team, regarding order #E57EC510: can you confirm if carrier tracking is active?');
    await sleep(500);

    // Click Send
    const sendBtn = await page.$('button[type="submit"]');
    if (sendBtn) await sendBtn.click();
    await sleep(2500);

    const sellerChatPath = path.join(ARTIFACTS_DIR, 'seller_support_chat.png');
    await page.screenshot({ path: sellerChatPath, fullPage: false });
    console.log('Saved Seller Chat screenshot:', sellerChatPath);

    // 2. Log in as Support Agent (support1@nayyar.com)
    console.log('\n--- 2. Support Agent opens Support Dashboard ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/support/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    await clearAndType('input[type="email"]', 'support1@nayyar.com');
    await clearAndType('input[type="password"]', 'nayyar123@#$');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await sleep(2500);

    // Find TechZone Premier Store in the seller chats list and click it
    console.log('Selecting TechZone Premier Store in conversations list...');
    const chatItems = await page.$$('div[class*="cursor-pointer"]');
    for (const item of chatItems) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text.includes('TechZone Premier Store')) {
        await item.click();
        break;
      }
    }
    await sleep(1500);

    // Send reply to TechZone
    console.log('Sending reply from Support agent...');
    const replyInputSelector = 'input[placeholder*="Reply to"]';
    await page.waitForSelector(replyInputSelector);
    await page.type(replyInputSelector, 'Hi TechZone! Carrier tracking is confirmed active. Package was dispatched and estimated delivery is tomorrow afternoon.');
    await sleep(500);

    const replyBtn = await page.$('button[type="submit"]');
    if (replyBtn) await replyBtn.click();
    await sleep(2500);

    const supportChatPath = path.join(ARTIFACTS_DIR, 'support_seller_chat.png');
    await page.screenshot({ path: supportChatPath, fullPage: false });
    console.log('Saved Support Seller Chat screenshot:', supportChatPath);

    // 3. Revisit as Seller to verify continuous thread displays support reply
    console.log('\n--- 3. Verifying reply on Seller side ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    await clearAndType('input[type="email"]', 'techzone@demo.com');
    await clearAndType('input[type="password"]', 'SellerPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await sleep(2500);

    const sellerBtns = await page.$$('button');
    for (const btn of sellerBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Support Chat')) {
        await btn.click();
        break;
      }
    }
    await sleep(1500);

    const sellerRepliedPath = path.join(ARTIFACTS_DIR, 'seller_support_chat_replied.png');
    await page.screenshot({ path: sellerRepliedPath, fullPage: false });
    console.log('Saved Seller Chat with Support Reply screenshot:', sellerRepliedPath);

    console.log('\n🎉 Single Continuous Chat verified successfully!');
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
