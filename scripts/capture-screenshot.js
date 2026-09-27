const puppeteer = require('puppeteer-core');
const path = require('path');

async function capture() {
  console.log('Launching installed Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 15000 });

  const artifactDir = 'C:\\Users\\SAIFULLAH\\.gemini\\antigravity-ide\\brain\\5395f377-a2ac-4bf6-a527-5faae70a2ad8';
  const outPath = path.join(artifactDir, 'homepage_desktop.png');

  await page.screenshot({ path: outPath, fullPage: false });
  console.log('✅ Captured desktop screenshot to:', outPath);

  // Full page screenshot
  const fullPagePath = path.join(artifactDir, 'homepage_fullpage.png');
  await page.screenshot({ path: fullPagePath, fullPage: true });
  console.log('✅ Captured full page screenshot to:', fullPagePath);

  // Mobile viewport screenshot (375px)
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  const mobilePath = path.join(artifactDir, 'homepage_mobile.png');
  await page.screenshot({ path: mobilePath, fullPage: false });
  console.log('✅ Captured mobile screenshot to:', mobilePath);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
