const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\dad78bb3-72ea-423d-9072-ef06b37069ca';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 860 });

  // 1. Seller Registration Page (Multi-doc upload & No KYC)
  console.log('1. Capturing Seller Register page...');
  await page.goto('http://localhost:3000/seller/register', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.screenshot({ path: path.join(artifactDir, 'seller_registration_multi_doc.png'), fullPage: false });
  console.log('Saved seller_registration_multi_doc.png');

  // 2. Home Page Search bar live dropdown
  console.log('2. Capturing Home Page store live search dropdown...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 15000 });
  // Type into the hero search bar
  const searchInputSelector = 'input[placeholder*="Search products"]';
  await page.waitForSelector(searchInputSelector, { timeout: 5000 });
  await page.type(searchInputSelector, 'mubashir', { delay: 100 });
  // Wait 600ms for debounce
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, 'homepage_store_search_dropdown.png'), fullPage: false });
  console.log('Saved homepage_store_search_dropdown.png');

  // 3. Search Results Page (/search?q=mubashir)
  console.log('3. Capturing Search Results page with store match...');
  await page.goto('http://localhost:3000/search?q=mubashir', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.screenshot({ path: path.join(artifactDir, 'search_results_store_found.png'), fullPage: false });
  console.log('Saved search_results_store_found.png');

  // 4. Seller Dashboard -> Customer Support tab
  console.log('4. Logging in as Seller to capture Customer Support tab...');
  await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.type('input[type="email"]', 'freshtest@test.com', { delay: 50 });
  await page.type('input[type="password"]', 'SellerPass123!', { delay: 50 });
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

  // Click on Customer Support tab
  console.log('Clicking Customer Support tab...');
  const supportButton = await page.waitForSelector('button:has-text("Customer Support")', { timeout: 5000 })
    .catch(() => null);
  if (supportButton) {
    await supportButton.click();
  } else {
    // evaluate click by text
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Customer Support'));
      if (btn) btn.click();
    });
  }
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(artifactDir, 'seller_customer_support_clean.png'), fullPage: false });
  console.log('Saved seller_customer_support_clean.png');

  // 5. Admin Dashboard -> Document Verification tab
  console.log('5. Logging in as Admin to capture Document Verification tab...');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.type('input[type="email"]', 'admin@nayyar.com', { delay: 50 });
  await page.type('input[type="password"]', 'admin!#$123@', { delay: 50 });
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

  // Click Document Verification tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Document Verification'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(artifactDir, 'admin_document_verification_tab.png'), fullPage: false });
  console.log('Saved admin_document_verification_tab.png');

  await browser.close();
  console.log('All verification captures completed successfully!');
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
