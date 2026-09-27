import { prisma } from '../src/config/prisma';
import { authService } from '../src/services/auth.service';
import { supportService } from '../src/services/support.service';
import { orderService } from '../src/services/order.service';
import { Role, OrderStatus, SellerStatus, KycStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    if (detail) console.log(`     └─ ${detail}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) console.error(`     └─ ${detail}`);
    failCount++;
  }
}

async function runAudit() {
  console.log('\n======================================================');
  console.log('   STARTING COMPREHENSIVE PRE-DEPLOYMENT AUDIT SUITE  ');
  console.log('======================================================\n');

  // --- 1. ROLE GUARDS & PORTAL AUTHENTICATION ---
  console.log('--- TEST GROUP 1: Role-Guards & Portal Authentication ---');
  try {
    let adminBlocked = false;
    try {
      await authService.login({
        email: 'admin.core@martifycollection.com',
        password: 'Mrtf!98_Adm#K9x$2026',
        expectedRole: Role.SELLER,
      });
    } catch (err: any) {
      if (err.statusCode === 403 && err.message.includes('Access denied')) {
        adminBlocked = true;
      }
    }
    assert(adminBlocked, '1.1 Admin Blocked from /seller/login', 'Admin role rejected with 403 and clear portal redirect message');
  } catch (e: any) {
    assert(false, '1.1 Admin Blocked from /seller/login', e.message);
  }

  try {
    let supportBlocked = false;
    try {
      await authService.login({
        email: 'support.lead@martifycollection.com',
        password: 'Spprt#74@Mrtf_Tx9!26',
        expectedRole: Role.SELLER,
      });
    } catch (err: any) {
      if (err.statusCode === 403 && err.message.includes('Access denied')) {
        supportBlocked = true;
      }
    }
    assert(supportBlocked, '1.2 Support Blocked from /seller/login', 'Support role rejected with 403 and clear portal redirect message');
  } catch (e: any) {
    assert(false, '1.2 Support Blocked from /seller/login', e.message);
  }

  try {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin.core@martifycollection.com' } });
    if (adminUser) {
      const me = await authService.getMe(adminUser.id);
      assert(me.id === adminUser.id && me.role === Role.ADMIN, '1.3 Token Verification GET /api/auth/me', 'Returns fresh database identity for multi-tab sync');
    }
  } catch (e: any) {
    assert(false, '1.3 Token Verification GET /api/auth/me', e.message);
  }

  // --- 2. STORE IDENTITY & CATALOG INVARIANTS ---
  console.log('\n--- TEST GROUP 2: Store Identity & Catalog Invariants ---');
  try {
    const officialStore = await prisma.user.findFirst({
      where: { role: Role.SELLER, isDemoAccount: true },
    });
    assert(!!officialStore, '2.1 Official Store Account Present', `Found Official Store: ${officialStore?.email}`);

    // Verify official store has manualSoldCount capability
    if (officialStore) {
      let testProd = await prisma.product.findFirst({
        where: { sellerId: officialStore.id },
      });
      let tempCreated = false;
      if (!testProd) {
        const cat = await prisma.category.findFirst();
        if (cat) {
          testProd = await prisma.product.create({
            data: {
              title: 'Schema Verification Product',
              description: 'Temp product for schema verification',
              price: 10,
              stock: 1,
              manualSoldCount: 0,
              sellerId: officialStore.id,
              categoryId: cat.id,
              imageUrl: '/placeholder.jpg',
            },
          });
          tempCreated = true;
        }
      }
      assert(
        testProd !== null && typeof testProd.manualSoldCount === 'number',
        '2.2 Official Store Manual Sold Count Invariant',
        `Product schema supports manualSoldCount: ${testProd?.manualSoldCount}`
      );
      if (tempCreated && testProd) {
        await prisma.product.delete({ where: { id: testProd.id } });
      }
    }

    // Verify frontend code contains identity badges
    const sellerDashboardCode = fs.readFileSync(
      path.join(__dirname, '../frontend/src/pages/SellerDashboardPage.tsx'),
      'utf8'
    );
    const hasOfficialBadge = sellerDashboardCode.includes('OFFICIAL STORE CATALOG ADMIN');
    const hasSellerBadge = sellerDashboardCode.includes('SELLER STOREFRONT');
    const hasDeleteBlockedForOfficial = sellerDashboardCode.includes('!isOfficialStore &&') && sellerDashboardCode.includes('handleDeleteProduct');

    assert(hasOfficialBadge && hasSellerBadge, '2.3 Dual Identity Badges in UI', 'Official Store and Regular Storefront identity badges present');
    assert(hasDeleteBlockedForOfficial, '2.4 Delete Button Restricted for Official Store', 'Delete button conditionally hidden for isOfficialStore');
  } catch (e: any) {
    assert(false, '2. Store Identity Invariants', e.message);
  }

  // --- 3. SINGLE SUPPORT AGENT & TICKET LIFECYCLE ---
  console.log('\n--- TEST GROUP 3: Single Support Agent & Chat Lifecycle ---');
  try {
    const supportUsers = await prisma.user.findMany({ where: { role: Role.SUPPORT } });
    assert(supportUsers.length === 1 && supportUsers[0].email === 'support.lead@martifycollection.com', '3.1 Single Support Agent Invariant', `Found exactly ${supportUsers.length} support account: ${supportUsers[0]?.email}`);

    // Test support messaging
    const seller = await prisma.user.findFirst({ where: { role: Role.SELLER } });
    if (seller) {
      const conv = await supportService.getOrCreateSellerConversation(seller.id);
      assert(!!conv && conv.sellerId === seller.id, '3.2 Support Thread Auto-Creation', `Thread ID: ${conv.id}`);

      const sentMsg = await supportService.sendSellerMessage(seller.id, 'Audit automated test message');
      assert(sentMsg.senderRole === 'SELLER', '3.3 Seller Message Delivery', `Message created with ID: ${sentMsg.id}`);

      const reply = await supportService.sendSupportReply(conv.id, 'Audit automated support reply');
      assert(reply.senderRole === 'SUPPORT', '3.4 Support Agent Response Flow', `Reply dispatched with ID: ${reply.id}`);

      // Clean up audit messages
      await prisma.supportMessage.deleteMany({
        where: { ticketId: conv.id, message: { contains: 'Audit automated' } },
      });
    }
  } catch (e: any) {
    assert(false, '3. Support Agent Invariant', e.message);
  }

  // --- 4. ORDERS LIFECYCLE & ESCROW STATE MACHINE ---
  console.log('\n--- TEST GROUP 4: Orders Lifecycle & Escrow State Machine ---');
  try {
    // Check support dashboard orders table layout
    const supportDashboardCode = fs.readFileSync(
      path.join(__dirname, '../frontend/src/pages/SupportDashboardPage.tsx'),
      'utf8'
    );
    const hasTableAuto = supportDashboardCode.includes('w-full table-auto');
    const hasMaxW180 = supportDashboardCode.includes('max-w-[180px]');
    const hasMaxW150 = supportDashboardCode.includes('max-w-[150px]');
    const hasCompactPadding = supportDashboardCode.includes('py-3 px-2.5');

    assert(
      hasTableAuto && hasMaxW180 && hasMaxW150 && hasCompactPadding,
      '4.1 Orders Table Compact Layout (No Horizontal Scroll)',
      'Table uses table-auto, max-w-[180px] buyer, max-w-[150px] product, and px-2.5 padding'
    );

    // Verify atomic escrow release logic
    const testSeller = await prisma.user.findFirst({ where: { role: Role.SELLER, sellerStatus: SellerStatus.APPROVED } });
    let testProduct = await prisma.product.findFirst({ where: { sellerId: testSeller?.id } });
    let tempAuditProduct = false;

    if (testSeller && !testProduct) {
      const category = await prisma.category.findFirst();
      if (category) {
        testProduct = await prisma.product.create({
          data: {
            title: 'Temporary Audit Product',
            description: 'Temporary product created for escrow invariant testing',
            price: 25.0,
            stock: 10,
            sellerId: testSeller.id,
            categoryId: category.id,
            imageUrl: '/placeholder.jpg',
          },
        });
        tempAuditProduct = true;
      }
    }

    if (testSeller && testProduct) {
      const initialAvailable = Number(testSeller.balanceAvailable);
      const initialHold = Number(testSeller.balanceOnHold);

      // Create test order
      const testOrder = await prisma.order.create({
        data: {
          productId: testProduct.id,
          sellerId: testSeller.id,
          buyerName: 'Audit Buyer',
          buyerEmail: 'audit@buyer.com',
          buyerPhone: '+1000000000',
          buyerAddress: '100 Audit St',
          city: 'Audit City',
          quantity: 1,
          totalPrice: 25.0,
          status: OrderStatus.BOOKED,
        },
      });

      // Credit hold
      await prisma.user.update({
        where: { id: testSeller.id },
        data: { balanceOnHold: { increment: 25.0 } },
      });

      // Progress through state machine
      await orderService.updateOrderStatus(testOrder.id, OrderStatus.PROCESSING, Role.SUPPORT);
      await orderService.updateOrderStatus(testOrder.id, OrderStatus.SHIPPING, Role.SUPPORT);
      await orderService.updateOrderStatus(testOrder.id, OrderStatus.DELIVERED, Role.SUPPORT);

      const refreshedSeller = await prisma.user.findUnique({ where: { id: testSeller.id } });
      const finalAvailable = Number(refreshedSeller?.balanceAvailable);
      const finalHold = Number(refreshedSeller?.balanceOnHold);

      const escrowReleasedCorrectly =
        Math.abs(finalAvailable - (initialAvailable + 25.0)) < 0.001 &&
        Math.abs(finalHold - initialHold) < 0.001;

      assert(
        escrowReleasedCorrectly,
        '4.2 Escrow Atomic State Machine Progression',
        `Booked -> Processing -> Shipping -> Delivered strictly released $25.00 from hold to available`
      );

      // Clean up audit order
      await prisma.order.delete({ where: { id: testOrder.id } });

      // Clean up temporary product if created
      if (tempAuditProduct && testProduct) {
        await prisma.product.delete({ where: { id: testProduct.id } });
      }

      await prisma.user.update({
        where: { id: testSeller.id },
        data: {
          balanceAvailable: initialAvailable,
          balanceOnHold: initialHold,
        },
      });
    }
  } catch (e: any) {
    assert(false, '4. Orders Lifecycle Invariant', e.message);
  }

  // --- 5. UI & DATA REFRESH OPERATIONS ---
  console.log('\n--- TEST GROUP 5: UI & Data Refresh Operations ---');
  try {
    const sellerDashboardCode = fs.readFileSync(
      path.join(__dirname, '../frontend/src/pages/SellerDashboardPage.tsx'),
      'utf8'
    );
    const adminDashboardCode = fs.readFileSync(
      path.join(__dirname, '../frontend/src/pages/AdminDashboardPage.tsx'),
      'utf8'
    );
    const supportDashboardCode = fs.readFileSync(
      path.join(__dirname, '../frontend/src/pages/SupportDashboardPage.tsx'),
      'utf8'
    );

    const sellerHasSpin = sellerDashboardCode.includes('isRefreshing ? \'animate-spin');
    const adminHasSpin = adminDashboardCode.includes('isRefreshing ? \'animate-spin');
    const supportHasSpin = supportDashboardCode.includes('isRefreshing ? \'animate-spin');

    const sellerHasPromiseAll = sellerDashboardCode.includes('handleRefresh') && sellerDashboardCode.includes('Promise.all');
    const adminHasPromiseAll = adminDashboardCode.includes('handleRefresh') && adminDashboardCode.includes('Promise.all');
    const supportHasSilentLoad = supportDashboardCode.includes('handleRefresh') && supportDashboardCode.includes('loadSupportData(true)');

    assert(
      sellerHasSpin && adminHasSpin && supportHasSpin,
      '5.1 Refresh Button Spinning Animation',
      'All 3 dashboards animate RefreshCw icon with animate-spin when refreshing'
    );

    assert(
      sellerHasPromiseAll && adminHasPromiseAll && supportHasSilentLoad,
      '5.2 Concurrent Background Re-fetch (No Full Reload)',
      'All 3 dashboards re-fetch data concurrently in background without full-screen loading spinner'
    );
  } catch (e: any) {
    assert(false, '5. Refresh Operations Invariant', e.message);
  }

  console.log('\n======================================================');
  console.log(` AUDIT COMPLETE: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAudit()
  .catch((e) => {
    console.error('Fatal audit failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
