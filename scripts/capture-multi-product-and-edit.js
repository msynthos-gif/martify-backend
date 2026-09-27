const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\dad78bb3-72ea-423d-9072-ef06b37069ca';

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
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    async function clearAndType(selector, text) {
      await page.waitForSelector(selector);
      await page.click(selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(selector, text);
    }

    console.log('Navigating to seller login...');
    await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0' });
    await clearAndType('input[type="email"]', 'freshtest@test.com');
    await clearAndType('input[type="password"]', 'SellerPass123!');
    await page.click('button[type="submit"]');

    await sleep(2500);

    // Switch to Products tab
    console.log('Switching to Products tab...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Products')) {
        await b.click();
        break;
      }
    }
    await sleep(1500);

    // ==========================================
    // STEP 1: CAPTURE MULTI-SELECT CATALOG MODAL
    // ==========================================
    console.log('Opening "Add from Official Store" modal...');
    const actionButtons = await page.$$('button');
    for (const b of actionButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Add from Official Store')) {
        await b.click();
        break;
      }
    }
    await sleep(2000);

    // Click "Select All"
    console.log('Selecting visible catalog items...');
    const modalButtons = await page.$$('button');
    for (const b of modalButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Select All')) {
        await b.click();
        break;
      }
    }
    await sleep(1000);

    // Capture screenshot of multi-select modal
    const multiSelectScreenshotPath = path.join(ARTIFACTS_DIR, 'official_store_multi_select_modal.png');
    await page.screenshot({ path: multiSelectScreenshotPath, fullPage: false });
    console.log('Saved multi-select modal screenshot:', multiSelectScreenshotPath);

    // Close the catalog modal
    console.log('Closing catalog modal...');
    const closeButtons = await page.$$('button');
    for (const b of closeButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.trim() === 'Close') {
        await b.click();
        break;
      }
    }
    await sleep(1500);

    // ==========================================
    // STEP 2: CAPTURE EDIT PRODUCT MODAL (READ-ONLY GALLERY, NO DROPZONE)
    // ==========================================
    console.log('Locating first product edit button...');
    await page.waitForSelector('button[title*="Edit product"]', { timeout: 8000 });
    const editBtns = await page.$$('button[title*="Edit product"]');
    console.log(`Found ${editBtns.length} edit buttons. Clicking the first one...`);
    await editBtns[0].click();

    // Wait for the modal to be visible
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Edit Product Listing') ||
             document.body.innerText.includes('Official Product Images');
    }, { timeout: 8000 });
    console.log('Edit modal is open! Scrolling to Official Product Images section...');
    await sleep(1000);

    // Scroll inside the edit modal to bottom
    await page.evaluate(() => {
      const modalScrollContainers = document.querySelectorAll('.overflow-y-auto');
      modalScrollContainers.forEach(container => {
        container.scrollTop = container.scrollHeight;
      });
    });
    await sleep(1000);

    // Capture screenshot of edit product modal
    const editModalScreenshotPath = path.join(ARTIFACTS_DIR, 'edit_product_no_upload_zone.png');
    await page.screenshot({ path: editModalScreenshotPath, fullPage: false });
    console.log('Saved edit product modal screenshot:', editModalScreenshotPath);

  } catch (err) {
    console.error('Error in capture script:', err);
  } finally {
    await browser.close();
  }
}

main();
