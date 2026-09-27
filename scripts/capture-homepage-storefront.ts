import puppeteer from 'puppeteer-core';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\1a3e58ed-faaf-4ea3-b369-eaa0ae164992';

async function run() {
  console.log('Fetching official store ID...');
  const officialStore = await prisma.user.findFirst({
    where: { isDemoAccount: true },
  });

  if (!officialStore) {
    throw new Error('Nexus Official Store not found in DB');
  }

  const sampleProduct = await prisma.product.findFirst({
    where: { sellerId: officialStore.id },
  });

  console.log(`Official store ID: ${officialStore.id}`);
  console.log(`Sample product ID: ${sampleProduct?.id}`);

  console.log('🚀 Launching Chrome for screenshot captures...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // 1. Homepage Capture
    console.log('1️⃣ Navigating to Homepage (http://localhost:3000)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h2');
    await page.evaluate(() => {
      window.scrollBy(0, 650);
    });
    await new Promise((r) => setTimeout(r, 1500));

    const homepagePath = path.join(ARTIFACTS_DIR, 'nexus_official_store_homepage.png');
    await page.screenshot({ path: homepagePath });
    console.log(`📸 Saved Homepage screenshot to: ${homepagePath}`);

    // 2. Storefront Capture (/sellers/:id)
    console.log(`2️⃣ Navigating to Storefront (http://localhost:3000/sellers/${officialStore.id})...`);
    await page.goto(`http://localhost:3000/sellers/${officialStore.id}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    await new Promise((r) => setTimeout(r, 1500));

    const storefrontPath = path.join(ARTIFACTS_DIR, 'nexus_official_store_storefront.png');
    await page.screenshot({ path: storefrontPath });
    console.log(`📸 Saved Storefront screenshot to: ${storefrontPath}`);

    // 3. Product Detail Capture
    if (sampleProduct) {
      console.log(`3️⃣ Navigating to Product Detail (http://localhost:3000/products/${sampleProduct.id})...`);
      page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
      await page.goto(`http://localhost:3000/products/${sampleProduct.id}`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 3000));

      const productPath = path.join(ARTIFACTS_DIR, 'nexus_official_store_product_detail.png');
      await page.screenshot({ path: productPath });
      console.log(`📸 Saved Product Detail screenshot to: ${productPath}`);
    }

    console.log('🎉 All screenshots successfully captured!');
  } catch (err) {
    console.error('Error during capture:', err);
    throw err;
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
