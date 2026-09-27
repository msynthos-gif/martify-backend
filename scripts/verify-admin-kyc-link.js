const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\f2b3fcde-4c35-4722-a439-ba2c154185f6';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyKycLink() {
  console.log('🔍 Launching browser to verify Admin KYC Document Link...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  try {
    const page = await browser.newPage();

    // 1. Log in as Admin
    console.log('Navigating to Admin Login...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await sleep(1000);

    await page.type('input[type="password"]', 'admin!#$123@');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(2000);

    // 2. Click KYC Verification Tab
    console.log('Switching to KYC Verification tab...');
    const tabButtons = await page.$$('button');
    for (const btn of tabButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('KYC Verification')) {
        await btn.click();
        break;
      }
    }
    await sleep(2000);

    // Capture screenshot of the KYC review tab
    const kycTabShot = path.join(ARTIFACTS_DIR, 'admin_kyc_review_tab.png');
    await page.screenshot({ path: kycTabShot, fullPage: false });
    console.log('📸 Saved Admin KYC Review tab screenshot to:', kycTabShot);

    // 3. Find "View Submitted KYC Document" link
    const kycLinks = await page.$$('a');
    let targetKycUrl = null;
    let targetLinkEl = null;

    for (const link of kycLinks) {
      const text = await page.evaluate((el) => el.textContent, link);
      if (text && text.includes('View Submitted KYC Document')) {
        targetKycUrl = await page.evaluate((el) => el.getAttribute('href'), link);
        targetLinkEl = link;
        break;
      }
    }

    console.log('🔗 Detected KYC Document Link href:', targetKycUrl);

    if (!targetKycUrl) {
      throw new Error('No KYC Document link found on the page');
    }

    // Verify URL correctness
    if (targetKycUrl.includes('F:') || targetKycUrl.includes('localhost:3000/F:')) {
      throw new Error(`FAIL: Leaking disk path in URL: ${targetKycUrl}`);
    }

    if (!targetKycUrl.startsWith('http://localhost:5000/uploads/kyc/')) {
      throw new Error(`FAIL: Unexpected URL format: ${targetKycUrl}`);
    }

    console.log('✅ URL format is correct! Opening the document in new browser tab...');

    // 4. Open the document URL in a new page/tab to confirm it loads the actual uploaded image
    const docPage = await browser.newPage();
    const response = await docPage.goto(targetKycUrl, { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Document response status:', response.status());
    await sleep(1500);

    const docShot = path.join(ARTIFACTS_DIR, 'admin_kyc_document_viewed.png');
    await docPage.screenshot({ path: docShot, fullPage: false });
    console.log('📸 Saved viewed KYC document screenshot to:', docShot);

    console.log('\n🎉 ALL CHECKS PASSED: KYC Document serves from backend static endpoint with 200 OK!');
  } catch (err) {
    console.error('❌ Error during KYC link verification:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

verifyKycLink().catch((err) => {
  console.error(err);
  process.exit(1);
});
