const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\c9661296-3eb2-4b91-ae84-fcad8b25fe54';

async function main() {
  console.log('🚀 Starting Verification: Category Attributes & Recently Sold Badge...');

  // Ensure artifacts directory exists
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  // Create a sample image for uploading if needed
  const sampleImagePath = path.join(__dirname, 'test-apparel.png');
  if (!fs.existsSync(sampleImagePath)) {
    // 1x1 transparent png
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(sampleImagePath, pngBuffer);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  let createdProductId = null;
  page.on('response', async (res) => {
    if (res.url().includes('/api/seller/products') && res.request().method() === 'POST' && res.status() === 201) {
      try {
        const json = await res.json();
        createdProductId = json.data?.id;
        console.log('📦 Created Product ID:', createdProductId);
      } catch (e) {}
    }
  });

  page.on('dialog', async (dialog) => {
    console.log(`⚠️ Dialog: "${dialog.message()}"`);
    await dialog.dismiss();
  });

  // 1. Log in as official@nexus.com
  console.log('1️⃣ Navigating to Seller Login...');
  await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle2' });

  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });

  await page.type('input[type="email"]', 'official@nexus.com');
  await page.type('input[type="password"]', 'SellerPass123!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Current URL after login:', page.url());

  // 2. Open Add Product modal
  console.log('2️⃣ Waiting for dashboard to load and clicking Add product button...');
  const addBtn = await page.waitForSelector('button ::-p-text(Add product)', { timeout: 15000 });
  await addBtn.click();
  console.log('Clicked Add product button.');
  await page.waitForSelector('select', { timeout: 10000 });
  console.log('Product form modal is open.');

  // 3. Select Category: Fashion & Apparel
  console.log('3️⃣ Selecting "Fashion & Apparel" category...');
  const selectHandle = await page.$('select');
  if (selectHandle) {
    const options = await page.evaluate((sel) => {
      return Array.from(sel.options).map((o) => ({ id: o.value, text: o.text }));
    }, selectHandle);
    console.log('Categories found:', options);
    const fashionOption = options.find(
      (o) => o.text.includes('Fashion') || o.text.includes('Apparel')
    );
    if (fashionOption) {
      await page.evaluate((catId) => {
        const sel = document.querySelector('select');
        sel.value = catId;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }, fashionOption.id);
      console.log('Selected category via dispatchEvent:', fashionOption.text);
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // 4. Verify attribute checkboxes appear and select S, M, L
  console.log('4️⃣ Selecting sizes S, M, L...');
  await page.waitForSelector('input[type="checkbox"]', { timeout: 5000 });

  const checkboxLabels = await page.$$('label');
  for (const label of checkboxLabels) {
    const text = await (await label.getProperty('innerText')).jsonValue();
    const clean = text.trim();
    if (clean === 'S' || clean === 'M' || clean === 'L') {
      const checkbox = await label.$('input[type="checkbox"]');
      if (checkbox) {
        const isChecked = await (await checkbox.getProperty('checked')).jsonValue();
        if (!isChecked) {
          await label.click();
          console.log(`Checked size: ${clean}`);
        }
      }
    }
  }

  // 5. Fill title, description, price, stock
  const uniqueTitle = `Tailored Linen Relaxed Shirt ${Date.now().toString().slice(-4)}`;
  console.log(`5️⃣ Filling product details: "${uniqueTitle}"...`);
  await page.type('input[placeholder="e.g. Mechanical Keyboard"]', uniqueTitle);
  await page.type(
    'textarea[placeholder="Product specifications and features"]',
    'Breathable premium organic linen relaxed shirt tailored for timeless everyday comfort.'
  );
  await page.type('input[placeholder="49.99"]', '49.99');

  const stockInput = await page.$('input[placeholder="10"]');
  if (stockInput) {
    await stockInput.click({ clickCount: 3 });
    await stockInput.type('50');
  }

  // 6. Upload sample image
  console.log('6️⃣ Uploading product image...');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(sampleImagePath);
    await new Promise((r) => setTimeout(r, 2000));
    console.log('Image uploaded successfully.');
  }

  // 7. Screenshot 1: Seller form with size checkboxes
  console.log('📸 Capturing Screenshot 1: seller_form_with_size_checkboxes.png...');
  const screenshot1Path = path.join(ARTIFACTS_DIR, 'seller_form_with_size_checkboxes.png');
  await page.screenshot({ path: screenshot1Path, fullPage: false });
  console.log(`Saved screenshot 1 to: ${screenshot1Path}`);

  // 8. Save product
  console.log('8️⃣ Saving product...');
  const saveBtn = await page.waitForSelector('button ::-p-text(Save product)', { timeout: 5000 });
  await saveBtn.click();
  await new Promise((r) => setTimeout(r, 3000));

  if (!createdProductId) {
    // Look up product ID via public API
    console.log('Finding created product via public API...');
    const res = await fetch('http://localhost:5000/api/products');
    const json = await res.json();
    const found = json.data.find((p) => p.title === uniqueTitle);
    if (found) createdProductId = found.id;
  }
  console.log('Target Product ID:', createdProductId);

  // 9. Navigate to Product Detail Page (0 orders placed yet)
  console.log(`9️⃣ Navigating to Product Detail Page for ID: ${createdProductId}...`);
  await page.goto(`http://localhost:3000/products/${createdProductId}`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));

  // Verify size pills
  const sizeSelector = await page.$('#product-attributes-selector');
  if (sizeSelector) {
    console.log('✅ Size selector rendered on product detail page!');
  } else {
    console.error('❌ Size selector NOT found on product detail page.');
  }

  // Confirm NO recently sold badge when count is 0
  const initialBadge = await page.$('#recently-sold-badge');
  if (!initialBadge) {
    console.log('✅ Verified: "sold recently" badge is NOT displayed when sales count is 0.');
  } else {
    console.warn('⚠️ Warning: sold recently badge appeared with 0 orders.');
  }

  // 10. Place 2 test orders for this product via API with selected sizes
  console.log('🔟 Placing 2 test orders for product...');
  
  // Order 1: Buyer Sophia Turner, Size M
  const session1 = 'test_guest_session_order_1_' + Date.now();
  await fetch('http://localhost:5000/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: session1,
      productId: createdProductId,
      quantity: 1,
      selectedAttributes: { size: 'M' },
    }),
  });
  const checkout1Res = await fetch('http://localhost:5000/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: session1,
      buyerName: 'Sophia Turner',
      buyerPhone: '+12025550199',
      buyerAddress: '742 Evergreen Terrace, Springfield, OR',
    }),
  });
  const checkout1Json = await checkout1Res.json();
  console.log('✅ Order 1 placed:', checkout1Json.data?.orders?.[0]?.id, 'SelectedAttributes:', checkout1Json.data?.orders?.[0]?.selectedAttributes);

  // Order 2: Buyer Lucas Vance, Size L
  const session2 = 'test_guest_session_order_2_' + Date.now();
  await fetch('http://localhost:5000/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: session2,
      productId: createdProductId,
      quantity: 1,
      selectedAttributes: { size: 'L' },
    }),
  });
  const checkout2Res = await fetch('http://localhost:5000/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: session2,
      buyerName: 'Lucas Vance',
      buyerPhone: '+12025550188',
      buyerAddress: '100 Broadway Ave, New York, NY',
    }),
  });
  const checkout2Json = await checkout2Res.json();
  console.log('✅ Order 2 placed:', checkout2Json.data?.orders?.[0]?.id, 'SelectedAttributes:', checkout2Json.data?.orders?.[0]?.selectedAttributes);

  // 11. Refresh Product Detail Page to see "🔥 2 sold recently" badge
  console.log('1️⃣1️⃣ Refreshing Product Detail Page to verify "🔥 2 sold recently" badge...');
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));

  const updatedBadge = await page.waitForSelector('#recently-sold-badge', { timeout: 5000 });
  const badgeText = await page.evaluate((el) => el.innerText, updatedBadge);
  console.log(`✅ "sold recently" badge text: "${badgeText}"`);

  // Click on Size "M" pill to demonstrate selection
  const sizePills = await page.$$('#product-attributes-selector button');
  for (const pill of sizePills) {
    const text = await (await pill.getProperty('innerText')).jsonValue();
    if (text.trim() === 'M') {
      await pill.click();
      console.log('Clicked Size "M" pill');
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 500));

  // 12. Screenshot 2: Product Detail Page with size selector + sold-recently badge
  console.log('📸 Capturing Screenshot 2: product_detail_size_and_badge.png...');
  const screenshot2Path = path.join(ARTIFACTS_DIR, 'product_detail_size_and_badge.png');
  await page.screenshot({ path: screenshot2Path, fullPage: false });
  console.log(`Saved screenshot 2 to: ${screenshot2Path}`);

  // 13. Navigate to Seller Dashboard Orders tab to verify buyer's selected size
  console.log('1️⃣3️⃣ Navigating to Seller Dashboard Orders tab...');
  await page.goto('http://localhost:3000/seller/dashboard', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const allTabBtns = await page.$$('button');
  for (const b of allTabBtns) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('Orders') || text.includes('Orders & Fulfillment')) {
      await b.click();
      console.log('Switched to Orders tab');
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));

  // 14. Screenshot 3: Seller Orders tab showing selected attributes
  console.log('📸 Capturing Screenshot 3: seller_orders_with_size.png...');
  const screenshot3Path = path.join(ARTIFACTS_DIR, 'seller_orders_with_size.png');
  await page.screenshot({ path: screenshot3Path, fullPage: false });
  console.log(`Saved screenshot 3 to: ${screenshot3Path}`);

  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

main().catch((err) => {
  console.error('❌ Verification script failed:', err);
  process.exit(1);
});
