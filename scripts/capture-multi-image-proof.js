const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\1a3e58ed-faaf-4ea3-b369-eaa0ae164992';

async function main() {
  console.log('🚀 Starting Multi-Image Visual Proof Capture...');

  // Ensure artifacts dir exists
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // First fetch products via API to get product ID with 3 images
  const apiRes = await fetch('http://localhost:5000/api/products/catalog');
  const catalog = await apiRes.json();
  const multiImgProd = catalog.data.find((p) => p.images && p.images.length >= 3) || catalog.data[0];
  console.log(`Target product with images: ${multiImgProd.title} (${multiImgProd.id})`);

  // 1. Log in as Seller
  console.log('Navigating to Seller Login...');
  await page.goto('http://localhost:3000/seller/login', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'official@nexus.com');
  await page.type('input[type="password"]', 'SellerPass123!');
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Logged in and on Seller Dashboard.');

  // Click edit button on the first product card
  console.log('Opening Edit Product modal...');
  const editButtons = await page.$$('button[title="Edit product and manage images"]');
  if (editButtons.length > 0) {
    await editButtons[0].click();
  } else {
    // Fallback: click any edit button or add product
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Add product')) {
        await btn.click();
        break;
      }
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // Capture Multi-Image Seller Form screenshot
  const sellerFormPath = path.join(ARTIFACTS_DIR, 'multi_image_seller_form.png');
  await page.screenshot({ path: sellerFormPath, fullPage: false });
  console.log('✅ Captured multi_image_seller_form.png to:', sellerFormPath);

  // 2. Navigate to Product Detail Page with image gallery
  console.log(`Navigating to Product Detail Page: http://localhost:3000/products/${multiImgProd.id}...`);
  await page.goto(`http://localhost:3000/products/${multiImgProd.id}`, {
    waitUntil: 'networkidle2',
    timeout: 15000,
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Click on the 2nd thumbnail in gallery if available
  const thumbnails = await page.$$('button[type="button"] img[alt*="thumbnail"]');
  console.log(`Found ${thumbnails.length} thumbnails on product detail page.`);
  if (thumbnails.length > 1) {
    await thumbnails[1].click();
    await new Promise((r) => setTimeout(r, 800));
  }

  // Capture Product Gallery View screenshot
  const galleryPath = path.join(ARTIFACTS_DIR, 'multi_image_gallery_view.png');
  await page.screenshot({ path: galleryPath, fullPage: false });
  console.log('✅ Captured multi_image_gallery_view.png to:', galleryPath);

  await browser.close();
  console.log('🎉 Multi-image proof capture completed successfully!');
}

main().catch((err) => {
  console.error('❌ Failed to capture proof screenshots:', err);
  process.exit(1);
});
