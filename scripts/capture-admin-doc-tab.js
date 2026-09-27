const puppeteer = require('puppeteer-core');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'admin@nayyar.com');
  await page.type('input[type="password"]', 'admin!#$123@');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);

  // Find all buttons and click the one that has "Document Verification"
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.textContent && b.textContent.includes('Document Verification'));
  });

  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent && b.textContent.includes('Document Verification'));
    if (target) {
      target.click();
      return true;
    }
    return false;
  });
  console.log('Document verification tab clicked:', clicked);

  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join('C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\dad78bb3-72ea-423d-9072-ef06b37069ca', 'admin_doc_verification_active_tab.png'),
    fullPage: false
  });
  await browser.close();
  console.log('Saved admin_doc_verification_active_tab.png');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
