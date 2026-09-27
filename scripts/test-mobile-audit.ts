import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORTS = [
  { name: 'Mobile Small (360px)', width: 360, height: 740 },
  { name: 'iPhone SE (375px)', width: 375, height: 667 },
  { name: 'iPhone XR (414px)', width: 414, height: 896 },
  { name: 'Tablet / iPad (768px)', width: 768, height: 1024 },
];

const PAGES_TO_TEST = [
  { name: 'HomePage', path: '/' },
  { name: 'ProductListing', path: '/categories/all' },
  { name: 'CartPage', path: '/cart' },
  { name: 'CheckoutPage', path: '/checkout' },
];

async function runAudit() {
  console.log('🚀 Starting Automated Mobile Responsiveness Audit...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let allPassed = true;

  try {
    const page = await browser.newPage();

    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);
      await page.setViewport({ width: vp.width, height: vp.height });

      for (const p of PAGES_TO_TEST) {
        const url = `http://localhost:3000${p.path}`;
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
        // Wait a small moment for render
        await new Promise((r) => setTimeout(r, 600));

        // 1. Check Scroll Width vs Client Width
        const overflowCheck = await page.evaluate(() => {
          const docScrollWidth = document.documentElement.scrollWidth;
          const bodyScrollWidth = document.body.scrollWidth;
          const innerWidth = window.innerWidth;
          const hasHorizontalOverflow = docScrollWidth > innerWidth || bodyScrollWidth > innerWidth;

          // Check for any offending elements overflowing horizontally
          const allEls = document.querySelectorAll('*');
          const overflowingElements: string[] = [];
          allEls.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.right > innerWidth + 1) {
              overflowingElements.push(
                `${el.tagName.toLowerCase()}.${Array.from(el.classList).slice(0, 3).join('.')}`
              );
            }
          });

          return {
            docScrollWidth,
            bodyScrollWidth,
            innerWidth,
            hasHorizontalOverflow,
            offenders: overflowingElements.slice(0, 5),
          };
        });

        if (overflowCheck.hasHorizontalOverflow) {
          console.error(`❌ [OVERFLOW BLEED] ${p.name} on ${vp.name}:`);
          console.error(`   Scroll: ${overflowCheck.docScrollWidth}px vs Window: ${overflowCheck.innerWidth}px`);
          console.error(`   Offenders: ${overflowCheck.offenders.join(', ')}`);
          allPassed = false;
        } else {
          console.log(`  ✅ [Zero Bleed] ${p.name}: scrollWidth (${overflowCheck.docScrollWidth}px) <= innerWidth (${overflowCheck.innerWidth}px)`);
        }
      }

      // Check Navbar on HomePage at this viewport
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
      const navbarAudit = await page.evaluate(() => {
        const brand = document.querySelector('header a[href="/"]');
        const searchBtn = document.querySelector('header button[aria-label="Search catalog"]');
        const cartBtn = document.querySelector('header a[aria-label="Shopping Bag"]');
        const menuBtn = document.querySelector('header button[aria-label="Toggle navigation menu"]');

        const brandRect = brand?.getBoundingClientRect();
        const searchRect = searchBtn?.getBoundingClientRect();
        const cartRect = cartBtn?.getBoundingClientRect();
        const menuRect = menuBtn?.getBoundingClientRect();

        return {
          hasBrand: !!brand,
          hasSearch: !!searchBtn,
          hasCart: !!cartBtn,
          hasMenu: !!menuBtn,
          brandWidth: brandRect?.width,
          brandText: brand?.textContent?.trim().replace(/\s+/g, ' '),
          searchTouch: searchRect ? `${searchRect.width}x${searchRect.height}` : null,
          cartTouch: cartRect ? `${cartRect.width}x${cartRect.height}` : null,
          menuTouch: menuRect ? `${menuRect.width}x${menuRect.height}` : null,
        };
      });

      console.log(`  🔍 Navbar Elements:`, navbarAudit);

      // Test Mobile Drawer Interaction on viewports < 768px
      if (vp.width < 768) {
        const menuBtn = await page.$('header button[aria-label="Toggle navigation menu"]');
        if (menuBtn) {
          await menuBtn.click();
          await new Promise((r) => setTimeout(r, 400));

          const drawerCheck = await page.evaluate(() => {
            const drawer = document.querySelector('.fixed.inset-y-0.left-0');
            const drawerRect = drawer?.getBoundingClientRect();
            const drawerText = drawer?.textContent || '';
            const hasAllProds = drawerText.includes('ALL PRODUCTS');
            const hasNewArrivals = drawerText.includes('NEW ARRIVALS');
            const hasBrand = drawerText.includes('MARTIFY COLLECTION.');
            const hasSeller = drawerText.includes('Become a Seller');

            return {
              isOpen: !!drawer,
              width: drawerRect?.width,
              height: drawerRect?.height,
              hasAllProds,
              hasNewArrivals,
              hasBrand,
              hasSeller,
            };
          });

          console.log(`  📂 Mobile Drawer Check:`, drawerCheck);
          if (!drawerCheck.isOpen || !drawerCheck.hasBrand || !drawerCheck.hasAllProds) {
            console.error('❌ Drawer content check failed!');
            allPassed = false;
          } else {
            console.log('  ✅ Mobile Drawer open & content verified!');
          }

          // Close drawer
          const closeBtn = await page.$('button[aria-label="Close menu"]');
          if (closeBtn) {
            await closeBtn.click();
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      }
    }

    console.log(`\n========================================`);
    if (allPassed) {
      console.log('🎉 AUDIT RESULT: ALL MOBILE VIEWPORTS PASSED WITH ZERO OVERFLOW!');
    } else {
      console.log('⚠️ AUDIT RESULT: Some viewports flagged issues.');
    }
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Audit run error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
