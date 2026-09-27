import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\1a3e58ed-faaf-4ea3-b369-eaa0ae164992';

async function run() {
  console.log('🚀 Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // 1. Seller Login
    console.log('1️⃣ Navigating to Seller Login...');
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    
    // Fill credentials
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'techzone@demo.com');
    await page.type('input[type="password"]', 'SellerPass123!');
    
    // Submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]'),
    ]);

    console.log('2️⃣ Current URL after login:', page.url());
    await new Promise(r => setTimeout(r, 2000));

    // Look for Support tab button
    console.log('Clicking Support tab button...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const supportBtn = buttons.find(b => b.textContent && b.textContent.includes('Support'));
      if (supportBtn) {
        supportBtn.click();
        return true;
      }
      return false;
    });
    console.log('Support tab clicked:', clicked);

    await new Promise(r => setTimeout(r, 2000));

    // Send message in chat
    const inputSelector = 'input[placeholder*="Regarding order"]';
    console.log('Checking for chat input selector:', inputSelector);
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.focus(inputSelector);
    await page.type(inputSelector, 'Regarding order #ORD-7749: Could you confirm if the courier has dispatched the pickup vehicle today?');
    await page.keyboard.press('Enter');
    
    console.log('Message submitted. Waiting for bubble render...');
    await new Promise(r => setTimeout(r, 2500));

    // Scroll window smoothly so the full chat card is visible
    await page.evaluate(() => {
      window.scrollTo({ top: 320, behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 800));

    const sellerScreenshotPath = path.join(ARTIFACTS_DIR, 'seller_chat_view.png');
    await page.screenshot({ path: sellerScreenshotPath, fullPage: false });
    console.log(`✅ Saved seller chat screenshot to: ${sellerScreenshotPath}`);

    // 2. Support Login
    console.log('3️⃣ Navigating to Support Login...');
    await page.goto('http://localhost:3000/support/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'support1@nayyar.com');
    await page.type('input[type="password"]', 'nayyar123@#$');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]'),
    ]);

    console.log('4️⃣ Logged in to Support Dashboard. Viewing Seller Chats...');
    await new Promise(r => setTimeout(r, 2000));

    // Select TechZone from list
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div'));
      const techZoneCard = cards.find(c => c.textContent && c.textContent.includes('TechZone Premier Store'));
      if (techZoneCard) techZoneCard.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Send a reply in support chat
    const replyInputSelector = 'input[placeholder*="Reply to"]';
    const replyInput = await page.$(replyInputSelector);
    if (replyInput) {
      await replyInput.focus();
      await replyInput.type('Hello TechZone! Yes, courier pickup vehicle #8 is in transit and will arrive between 2:00 PM - 3:30 PM.');
      await page.keyboard.press('Enter');
      console.log('Support reply sent via Enter. Waiting for bubble render...');
      await new Promise(r => setTimeout(r, 2500));
    }

    // Scroll window slightly so the support console layout is framed well
    await page.evaluate(() => {
      window.scrollTo({ top: 240, behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 800));

    const supportScreenshotPath = path.join(ARTIFACTS_DIR, 'support_chat_view.png');
    await page.screenshot({ path: supportScreenshotPath, fullPage: false });
    console.log(`✅ Saved support dashboard screenshot to: ${supportScreenshotPath}`);

  } catch (err) {
    console.error('❌ Error capturing screenshots:', err);
  } finally {
    await browser.close();
    console.log('🏁 Finished screenshot capture.');
  }
}

run();
