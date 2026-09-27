const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testWithLogin(loginUrl, email, password) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const errors = [];
  const requests = [];

  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('localhost:5000/api')) {
      requests.push(req.method() + ' ' + u);
    }
  });

  page.on('response', (res) => {
    const u = res.url();
    if (u.includes('localhost:5000/api') && res.status() >= 400) {
      errors.push(`HTTP ${res.status()} ${u}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });

  console.log(`\n=== Logging in via ${loginUrl} as ${email} ===`);
  await page.goto(loginUrl, { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Now visiting public homepage:');
  requests.length = 0;
  errors.length = 0;
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Homepage Requests:', requests);
  console.log('Homepage Errors:', errors);

  console.log('Now visiting seller storefront:');
  requests.length = 0;
  errors.length = 0;
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  await page.goto(`http://localhost:3000/sellers/${seller.id}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Storefront Requests:', requests);
  console.log('Storefront Errors:', errors);

  await prisma.$disconnect();
  await browser.close();
}

async function main() {
  await testWithLogin('http://localhost:3000/seller/login', 'official@nexus.com', 'seller!#$123@');
}

main().catch(console.error);
