const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testPage(url) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const requests = [];
  const consoleMessages = [];

  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('localhost:5000/api')) {
      requests.push(req.method() + ' ' + u);
    }
  });

  page.on('response', (res) => {
    const u = res.url();
    if (u.includes('localhost:5000/api') && res.status() >= 400) {
      consoleMessages.push(`HTTP ${res.status()} ${u}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  console.log(`\n--- Navigating to ${url} ---`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(e => console.log('Navigation timeout/err:', e.message));
  await new Promise((r) => setTimeout(r, 2000));

  console.log('API Requests made:');
  requests.forEach(r => console.log('  ', r));
  console.log('Errors/Warnings:');
  consoleMessages.forEach(m => console.log('  ', m));

  await browser.close();
}

async function main() {
  await testPage('http://localhost:3000/');
  await testPage('http://localhost:3000/products');
  // Get an existing seller id
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  if (seller) {
    await testPage(`http://localhost:3000/sellers/${seller.id}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
