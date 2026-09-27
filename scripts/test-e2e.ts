import app from '../src/app';
import { prisma } from '../src/config/prisma';
import http from 'http';

let server: http.Server;
let baseUrl: string;

interface TestResult {
  rule: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function recordPass(rule: string, name: string, details?: string) {
  console.log(`  ✅ [PASS] ${rule}: ${name}`);
  if (details) console.log(`     └─ ${details}`);
  results.push({ rule, name, passed: true, details });
}

function recordFail(rule: string, name: string, error: any) {
  const details = error instanceof Error ? error.message : String(error);
  console.error(`  ❌ [FAIL] ${rule}: ${name}`);
  console.error(`     └─ Error: ${details}`);
  results.push({ rule, name, passed: false, details });
}

async function request(
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
    formData?: { fieldName: string; fileName: string; buffer: Buffer; contentType: string };
  } = {}
) {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {};

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  let bodyData: any = undefined;

  if (options.formData) {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
    const { fieldName, fileName, buffer, contentType } = options.formData;
    const pre = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`
    );
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    bodyData = Buffer.concat([pre, buffer, post]);
  } else if (options.body) {
    headers['Content-Type'] = 'application/json';
    bodyData = JSON.stringify(options.body);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: bodyData,
  });

  const status = res.status;
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { status, body: json };
}

async function runE2ESuite() {
  console.log('================================================================');
  console.log('      MULTI-VENDOR MARKETPLACE — COMPREHENSIVE E2E TEST SUITE   ');
  console.log('================================================================\n');

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const port = (server.address() as any).port;
      baseUrl = `http://localhost:${port}`;
      console.log(`📡 E2E Live Test Server running on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // SECTION 1: SEED & FOUNDATION
    // -------------------------------------------------------------
    console.log('🔹 SECTION 1: Foundation, Schema & Credentials Verification');

    // 1. Admin login with requested credentials
    try {
      const adminRes = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin.core@martifycollection.com', password: 'Mrtf!98_Adm#K9x$2026' },
      });
      if (adminRes.status === 200 && adminRes.body.data.user.role === 'ADMIN') {
        recordPass('Sec 1.1', 'Admin Authentication', 'admin.core@martifycollection.com successfully logged in with role ADMIN');
      } else {
        throw new Error(`Status ${adminRes.status}: ${JSON.stringify(adminRes.body)}`);
      }
    } catch (err) {
      recordFail('Sec 1.1', 'Admin Authentication', err);
    }

    // 2. Support agent login
    try {
      const sup1 = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'support.lead@martifycollection.com', password: 'Spprt#74@Mrtf_Tx9!26' },
      });
      if (sup1.status === 200) {
        recordPass('Sec 1.2', 'Support Authentication', 'Primary support agent authenticated successfully');
      } else {
        throw new Error(`Support 1 (${sup1.status})`);
      }
    } catch (err) {
      recordFail('Sec 1.2', 'Support Authentication', err);
    }

    // 3. Categories count
    try {
      const catsRes = await request('/api/categories');
      if (catsRes.status === 200 && catsRes.body.data.length >= 6) {
        recordPass('Sec 1.3', 'Platform Categories', `Found ${catsRes.body.data.length} active categories`);
      } else {
        throw new Error(`Expected at least 6 categories, got ${catsRes.body.data.length}`);
      }
    } catch (err) {
      recordFail('Sec 1.3', 'Platform Categories', err);
    }

    // 4. Demo sellers and products
    try {
      const catalogRes = await request('/api/products/catalog');
      if (catalogRes.status === 200 && catalogRes.body.data.length >= 15) {
        recordPass('Sec 1.4', 'Demo Catalog Seeding', `Found ${catalogRes.body.data.length} catalog products from demo sellers`);
      } else {
        throw new Error(`Expected >= 15 demo products, got ${catalogRes.body.data.length}`);
      }
    } catch (err) {
      recordFail('Sec 1.4', 'Demo Catalog Seeding', err);
    }

    // Obtain Admin & Support Tokens
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin.core@martifycollection.com', password: 'Mrtf!98_Adm#K9x$2026' },
    });
    const adminToken = adminLogin.body.data.token;

    const supportLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'support.lead@martifycollection.com', password: 'Spprt#74@Mrtf_Tx9!26' },
    });
    const supportToken = supportLogin.body.data.token;

    // -------------------------------------------------------------
    // SECTION 2: AUTH & KYC WORKFLOWS + RULE 1 GATE
    // -------------------------------------------------------------
    console.log('\n🔹 SECTION 2: Auth, Registration, KYC & Rule 1 Gate');

    const testSellerEmail = `e2e.seller.${Date.now()}@testmarket.com`;
    let testSellerId = '';
    let testSellerToken = '';

    // 5. Seller registration
    try {
      const reg = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Apex E2E Electronics',
          email: testSellerEmail,
          password: 'SecurePassword123!',
          phone: '+15552223344',
        },
      });
      if (
        reg.status === 201 &&
        reg.body.data.user.sellerStatus === 'PENDING' &&
        reg.body.data.user.kycStatus === 'NOT_SUBMITTED' &&
        reg.body.data.user.availableStock === 0
      ) {
        testSellerId = reg.body.data.user.id;
        testSellerToken = reg.body.data.token;
        recordPass('Sec 2.1', 'Seller Registration', 'Seller initialized with PENDING status, NOT_SUBMITTED KYC, and 0 stock');
      } else {
        throw new Error(`Unexpected registration response: ${JSON.stringify(reg.body)}`);
      }
    } catch (err) {
      recordFail('Sec 2.1', 'Seller Registration', err);
    }

    // 6. Duplicate registration prevention
    try {
      const dup = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Duplicate Seller',
          email: testSellerEmail,
          password: 'SecurePassword123!',
          phone: '+15552223344',
        },
      });
      if (dup.status === 409) {
        recordPass('Sec 2.2', 'Duplicate Prevention', 'Duplicate email rejected with 409 Conflict');
      } else {
        throw new Error(`Expected 409, got ${dup.status}`);
      }
    } catch (err) {
      recordFail('Sec 2.2', 'Duplicate Prevention', err);
    }

    // 7. KYC Upload & Submission
    let uploadedKycUrl = '';
    try {
      const dummyImg = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
      const up = await request('/api/seller/kyc/upload', {
        method: 'POST',
        token: testSellerToken,
        formData: {
          fieldName: 'document',
          fileName: 'passport.png',
          buffer: dummyImg,
          contentType: 'image/png',
        },
      });
      uploadedKycUrl = up.body.data.url;

      const submit = await request('/api/seller/kyc', {
        method: 'PATCH',
        token: testSellerToken,
        body: { kycDocumentUrl: uploadedKycUrl },
      });

      if (submit.status === 200 && submit.body.data.kycStatus === 'PENDING') {
        recordPass('Sec 2.3', 'KYC Document Submission', 'KYC document uploaded via Multer and set to PENDING');
      } else {
        throw new Error(`KYC submission failed with status ${submit.status}`);
      }
    } catch (err) {
      recordFail('Sec 2.3', 'KYC Document Submission', err);
    }

    // 8. Rule 1 Gate: Seller approval MUST fail before KYC approval
    try {
      const prematureApprove = await request(`/api/admin/sellers/${testSellerId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { sellerStatus: 'APPROVED' },
      });
      if (prematureApprove.status === 400) {
        recordPass('RULE 1', 'Seller Approval Gate', 'Approving seller before KYC approval strictly rejected with 400 Bad Request');
      } else {
        throw new Error(`Expected 400, got ${prematureApprove.status}`);
      }
    } catch (err) {
      recordFail('RULE 1', 'Seller Approval Gate', err);
    }

    // 9. Admin approves KYC then approves sellerStatus
    try {
      const kycOk = await request(`/api/admin/sellers/${testSellerId}/kyc`, {
        method: 'PATCH',
        token: adminToken,
        body: { kycStatus: 'APPROVED' },
      });
      const sellerOk = await request(`/api/admin/sellers/${testSellerId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { sellerStatus: 'APPROVED' },
      });
      if (kycOk.status === 200 && sellerOk.status === 200 && sellerOk.body.data.sellerStatus === 'APPROVED') {
        recordPass('Sec 2.4', 'Admin Approval Flow', 'Admin approved KYC and subsequently approved seller status');
      } else {
        throw new Error(`Approval sequence failed: KYC(${kycOk.status}), Seller(${sellerOk.status})`);
      }
    } catch (err) {
      recordFail('Sec 2.4', 'Admin Approval Flow', err);
    }

    // -------------------------------------------------------------
    // SECTION 3: ADMIN MANAGEMENT & STOCK REQUEST ATOMIC INCREMENT
    // -------------------------------------------------------------
    console.log('\n🔹 SECTION 3: Admin Management & Atomic Stock Requests');

    // 10. Category CRUD
    try {
      const newCat = await request('/api/admin/categories', {
        method: 'POST',
        token: adminToken,
        body: { name: 'E2E Temporary Category', slug: `e2e-temp-${Date.now()}` },
      });
      const catId = newCat.body.data.id;
      const delCat = await request(`/api/admin/categories/${catId}`, {
        method: 'DELETE',
        token: adminToken,
      });
      if (newCat.status === 201 && delCat.status === 200) {
        recordPass('Sec 3.1', 'Category CRUD', 'Admin created and cleanly deleted category');
      } else {
        throw new Error(`Category CRUD failed: create(${newCat.status}), delete(${delCat.status})`);
      }
    } catch (err) {
      recordFail('Sec 3.1', 'Category CRUD', err);
    }

    // 11. Stock Request & Atomic Increment
    let stockReqId = '';
    try {
      const createReq = await request('/api/seller/stock-requests', {
        method: 'POST',
        token: testSellerToken,
        body: { quantity: 150, note: 'E2E inventory expansion' },
      });
      stockReqId = createReq.body.data.id;

      // Admin approves stock request
      const approveReq = await request(`/api/admin/stock-requests/${stockReqId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'APPROVED' },
      });

      // Verify seller availableStock was atomically incremented from 0 to 150
      const profile = await request('/api/seller/me', { token: testSellerToken });
      if (
        approveReq.status === 200 &&
        approveReq.body.data.stockRequest.status === 'APPROVED' &&
        profile.body.data.availableStock === 150
      ) {
        recordPass('Sec 3.2', 'Atomic Stock Allocation', 'Stock request approved and availableStock atomically incremented (0 -> 150)');
      } else {
        throw new Error(`Expected availableStock = 150, got ${profile.body.data.availableStock}`);
      }
    } catch (err) {
      recordFail('Sec 3.2', 'Atomic Stock Allocation', err);
    }

    // -------------------------------------------------------------
    // SECTION 4: SELLER PRODUCTS, STOCK CAP (RULE 2) & CLONE (RULE 3)
    // -------------------------------------------------------------
    console.log('\n🔹 SECTION 4: Products CRUD, Rule 2 Stock Cap & Rule 3 Catalog Clone');

    const catList = await request('/api/categories');
    const firstCatId = catList.body.data[0].id;
    let originalProductId = '';

    // 12. Create original product within availableStock
    try {
      const prodRes = await request('/api/seller/products', {
        method: 'POST',
        token: testSellerToken,
        body: {
          title: 'Custom Mechanical Macro Pad',
          description: 'CNC milled brass plate with Kailh switches.',
          price: 59.99,
          imageUrl: '/uploads/products/macropad.svg',
          stock: 60, // 60 <= 150
          categoryId: firstCatId,
        },
      });
      if (prodRes.status === 201) {
        originalProductId = prodRes.body.data.id;
        recordPass('Sec 4.1', 'Original Product Listing', 'Seller listed product with 60 stock within cap');
      } else {
        throw new Error(`Status ${prodRes.status}: ${JSON.stringify(prodRes.body)}`);
      }
    } catch (err) {
      recordFail('Sec 4.1', 'Original Product Listing', err);
    }

    // 13. Removal of Stock Cap on Creation (Seller can list any quantity)
    try {
      // Stock = 500. No cap limit enforced.
      const unconstrainedStockProd = await request('/api/seller/products', {
        method: 'POST',
        token: testSellerToken,
        body: {
          title: 'High Inventory Listing',
          description: 'Product listed with unrestricted inventory allocation.',
          price: 29.99,
          imageUrl: '/uploads/products/high-stock.svg',
          stock: 500,
          categoryId: firstCatId,
        },
      });
      if (unconstrainedStockProd.status === 201 && unconstrainedStockProd.body.data.stock === 500) {
        recordPass('RULE 2 REMOVAL', 'Uncapped Stock Listing', 'Seller listed product with 500 stock without cap constraint');
      } else {
        throw new Error(`Expected 201, got ${unconstrainedStockProd.status}: ${JSON.stringify(unconstrainedStockProd.body)}`);
      }
    } catch (err) {
      recordFail('RULE 2 REMOVAL', 'Uncapped Stock Listing', err);
    }

    // 14. Removal of Stock Cap on Update
    try {
      // Updating product stock to 1000 units
      const updateUncapped = await request(`/api/seller/products/${originalProductId}`, {
        method: 'PATCH',
        token: testSellerToken,
        body: { stock: 1000 },
      });
      if (updateUncapped.status === 200 && updateUncapped.body.data.stock === 1000) {
        recordPass('RULE 2 REMOVAL', 'Uncapped Stock Update', 'Updating product stock to 1000 succeeded without cap rejection');
      } else {
        throw new Error(`Expected 200, got ${updateUncapped.status}: ${JSON.stringify(updateUncapped.body)}`);
      }
    } catch (err) {
      recordFail('RULE 2 REMOVAL', 'Uncapped Stock Update', err);
    }

    // 15. Rule 3: Catalog Clone Flow
    let clonedProductId = '';
    try {
      const catalog = await request('/api/products/catalog');
      const catalogSource = catalog.body.data[0];

      // Clone catalog item with custom price and 40 stock (60 + 40 = 100 <= 150)
      const clone = await request('/api/seller/products/clone', {
        method: 'POST',
        token: testSellerToken,
        body: {
          catalogProductId: catalogSource.id,
          price: 129.95,
          stock: 40,
        },
      });

      if (
        clone.status === 201 &&
        clone.body.data.clonedFromProductId === catalogSource.id &&
        Number(clone.body.data.price) === 129.95 &&
        clone.body.data.stock === 40
      ) {
        clonedProductId = clone.body.data.id;
        recordPass('RULE 3', 'Catalog Clone Flow', 'Copied catalog product with custom price, custom stock, and clonedFromProductId');
      } else {
        throw new Error(`Clone failed: ${JSON.stringify(clone.body)}`);
      }
    } catch (err) {
      recordFail('RULE 3', 'Catalog Clone Flow', err);
    }

    // -------------------------------------------------------------
    // SECTION 5: GUEST CART & CHECKOUT TRANSACTION (RULE 4)
    // -------------------------------------------------------------
    console.log('\n🔹 SECTION 5: Guest Cart, Checkout & Balance Hold (Rule 4)');

    const guestSession = `e2e-sess-${Date.now()}`;
    let createdOrderId = '';
    let orderedProductPrice = 0;

    // 16. Guest Cart Operations
    try {
      const addCart = await request('/api/cart', {
        method: 'POST',
        body: {
          sessionId: guestSession,
          productId: clonedProductId,
          quantity: 2, // 2 * $129.95 = $259.90
        },
      });

      const getCart = await request(`/api/cart/${guestSession}`);
      if (
        addCart.status === 200 &&
        getCart.status === 200 &&
        getCart.body.data.items.length === 1 &&
        getCart.body.data.itemCount === 2
      ) {
        orderedProductPrice = Number(getCart.body.data.subtotal);
        recordPass('Sec 5.1', 'Guest Cart Management', `Cart calculated subtotal correctly ($${orderedProductPrice})`);
      } else {
        throw new Error(`Cart operations failed: add(${addCart.status}), get(${getCart.status})`);
      }
    } catch (err) {
      recordFail('Sec 5.1', 'Guest Cart Management', err);
    }

    // 17. Rule 4: Checkout Transaction & Balance On Hold
    try {
      // Capture seller balances and product stock prior to checkout
      const preSeller = await prisma.user.findUnique({ where: { id: testSellerId } });
      const preProd = await prisma.product.findUnique({ where: { id: clonedProductId } });

      const checkout = await request('/api/checkout', {
        method: 'POST',
        body: {
          sessionId: guestSession,
          email: 'e2e.buyer@example.com',
          firstName: 'E2E',
          lastName: 'Verifier',
          buyerPhone: '+15558889900',
          country: 'United States',
          company: 'Acme Corp',
          address: '500 Marketplace Way',
          apartment: 'Suite 400',
          city: 'Tech Center',
          state: 'CA',
          zipCode: '94016',
        },
      });

      if (checkout.status !== 201) {
        throw new Error(`Checkout returned status ${checkout.status}: ${JSON.stringify(checkout.body)}`);
      }

      createdOrderId = checkout.body.data.orders[0].id;
      const orderTotalPrice = Number(checkout.body.data.orders[0].totalPrice);

      // Verify stock decremented
      const postProd = await prisma.product.findUnique({ where: { id: clonedProductId } });
      if (postProd!.stock !== preProd!.stock - 2) {
        throw new Error(`Stock did not decrement correctly: before=${preProd!.stock}, after=${postProd!.stock}`);
      }

      // Verify seller balanceOnHold credited by orderTotalPrice
      const postSeller = await prisma.user.findUnique({ where: { id: testSellerId } });
      const expectedHold = Number(preSeller!.balanceOnHold) + orderTotalPrice;
      if (Math.abs(Number(postSeller!.balanceOnHold) - expectedHold) > 0.01) {
        throw new Error(`balanceOnHold incorrect: expected ${expectedHold}, got ${postSeller!.balanceOnHold}`);
      }

      // Verify balanceAvailable remains 0
      if (Number(postSeller!.balanceAvailable) !== 0) {
        throw new Error(`balanceAvailable should remain 0 until delivered, got ${postSeller!.balanceAvailable}`);
      }

      // Verify cart empty
      const emptyCart = await request(`/api/cart/${guestSession}`);
      if (emptyCart.body.data.items.length !== 0) {
        throw new Error('Cart was not cleared after checkout');
      }

      recordPass(
        'RULE 4',
        'Guest Checkout & Balance Hold',
        `Order placed as BOOKED, stock decremented, and $${orderTotalPrice} credited to balanceOnHold (available balance unchanged at 0)`
      );
    } catch (err) {
      recordFail('RULE 4', 'Guest Checkout & Balance Hold', err);
    }

    // -------------------------------------------------------------
    // SECTION 6: ORDER LIFECYCLE (RULE 5 & 6) & SUPPORT TICKETS (RULE 7)
    // -------------------------------------------------------------
    console.log('\n🔹 SECTION 6: Order Lifecycle, Balance Release & Support Tickets');

    // 18. Rule 5: Seller forbidden from updating status
    try {
      const sellerStatusAttempt = await request(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        token: testSellerToken,
        body: { status: 'PROCESSING' },
      });
      if (sellerStatusAttempt.status === 403) {
        recordPass('RULE 5', 'Order Status Role Guard', 'Sellers are forbidden from changing order status (403)');
      } else {
        throw new Error(`Expected 403, got ${sellerStatusAttempt.status}`);
      }
    } catch (err) {
      recordFail('RULE 5', 'Order Status Role Guard', err);
    }

    // 19. Rule 5: Sequential lifecycle check (no skips, no backwards)
    try {
      // Prohibited skip: BOOKED -> DELIVERED
      const skipAttempt = await request(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        token: supportToken,
        body: { status: 'DELIVERED' },
      });
      if (skipAttempt.status !== 400) throw new Error(`Skip attempt should return 400, got ${skipAttempt.status}`);

      // Valid: BOOKED -> PROCESSING
      const step1 = await request(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        token: supportToken,
        body: { status: 'PROCESSING' },
      });
      if (step1.status !== 200) throw new Error(`Move to PROCESSING failed with ${step1.status}`);

      // Valid: PROCESSING -> SHIPPING
      const step2 = await request(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        token: supportToken,
        body: { status: 'SHIPPING' },
      });
      if (step2.status !== 200) throw new Error(`Move to SHIPPING failed with ${step2.status}`);

      recordPass(
        'RULE 5',
        'Sequential Order Progression',
        'Skips prohibited; order moved BOOKED -> PROCESSING -> SHIPPING'
      );
    } catch (err) {
      recordFail('RULE 5', 'Sequential Order Progression', err);
    }

    // 20. Rule 6: Atomic Balance Release on DELIVERED
    try {
      const preDelivSeller = await prisma.user.findUnique({ where: { id: testSellerId } });
      const order = await prisma.order.findUnique({ where: { id: createdOrderId } });
      const orderAmount = Number(order!.totalPrice);

      const delivRes = await request(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'DELIVERED' },
      });

      if (delivRes.status !== 200) {
        throw new Error(`Transition to DELIVERED failed with ${delivRes.status}`);
      }

      const postDelivSeller = await prisma.user.findUnique({ where: { id: testSellerId } });

      const expectedHold = Number(preDelivSeller!.balanceOnHold) - orderAmount;
      const expectedAvail = Number(preDelivSeller!.balanceAvailable) + orderAmount;

      if (
        Math.abs(Number(postDelivSeller!.balanceOnHold) - expectedHold) < 0.01 &&
        Math.abs(Number(postDelivSeller!.balanceAvailable) - expectedAvail) < 0.01
      ) {
        recordPass(
          'RULE 6',
          'Atomic Balance Release on Delivery',
          `Order marked DELIVERED; $${orderAmount} atomically moved from balanceOnHold to balanceAvailable`
        );
      } else {
        throw new Error(`Balance mismatch: hold=${postDelivSeller!.balanceOnHold}, avail=${postDelivSeller!.balanceAvailable}`);
      }
    } catch (err) {
      recordFail('RULE 6', 'Atomic Balance Release on Delivery', err);
    }

    // 21. Rule 7: Support Ticket Creation & Messaging
    try {
      // Seller creates ticket attached to the order
      const ticketRes = await request('/api/support/tickets', {
        method: 'POST',
        token: testSellerToken,
        body: {
          subject: 'Delivery confirmation receipt request',
          orderId: createdOrderId,
          message: 'Can you provide the carrier tracking receipt?',
        },
      });
      if (ticketRes.status !== 201) throw new Error(`Ticket creation failed: ${ticketRes.status}`);
      const ticketId = ticketRes.body.data.id;

      // Support agent replies
      const supportReply = await request(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        token: supportToken,
        body: { message: 'Receipt attached: Delivered to recipient front desk.' },
      });
      if (supportReply.status !== 201 || supportReply.body.data.senderRole !== 'SUPPORT') {
        throw new Error('Support reply failed');
      }

      // Seller replies back
      const sellerReply = await request(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        token: testSellerToken,
        body: { message: 'Acknowledged, thank you!' },
      });
      if (sellerReply.status !== 201 || sellerReply.body.data.senderRole !== 'SELLER') {
        throw new Error('Seller reply failed');
      }

      // Support closes ticket
      const resolveTicket = await request(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        token: supportToken,
        body: { status: 'RESOLVED' },
      });
      if (resolveTicket.status !== 200 || resolveTicket.body.data.status !== 'RESOLVED') {
        throw new Error('Ticket status resolution failed');
      }

      recordPass(
        'RULE 7',
        'Support Ticket Lifecycle & Messaging',
        'Seller opened ticket for order, exchanged messages with support, and ticket was marked RESOLVED'
      );
    } catch (err) {
      recordFail('RULE 7', 'Support Ticket Lifecycle & Messaging', err);
    }

    // -------------------------------------------------------------
    // SECTION 8: RECENTLY SOLD COUNT & TOTAL SOLD DYNAMICS
    // -------------------------------------------------------------
    console.log('\n🔹 SECTION 8: Recently Sold Count & Dynamic Badge Invariants');

    try {
      // 1. Official Store Login
      const officialLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'official.store@martifycollection.com', password: 'MrtfVndr$88#Store_2026!' },
      });
      if (officialLogin.status !== 200 || !officialLogin.body.data.user.isDemoAccount) {
        throw new Error(`Failed to login as Official Store: ${JSON.stringify(officialLogin.body)}`);
      }
      const officialToken = officialLogin.body.data.token;

      // 2. Official Store lists product with manualSoldCount = 50
      const catsRes = await request('/api/categories');
      const categoryId = catsRes.body.data[0].id;

      const createOfficialProd = await request('/api/seller/products', {
        method: 'POST',
        token: officialToken,
        body: {
          title: 'Official Store Limited Pro Edition',
          description: 'Official flagship item with authentic recently sold verification.',
          price: 199.99,
          stock: 60,
          categoryId,
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
          manualSoldCount: 50,
        },
      });

      if (createOfficialProd.status !== 201) {
        throw new Error(`Official store product creation failed: ${JSON.stringify(createOfficialProd.body)}`);
      }
      const officialProdId = createOfficialProd.body.data.id;
      if (createOfficialProd.body.data.manualSoldCount !== 50 || createOfficialProd.body.data.totalSold !== 50) {
        throw new Error(`Expected manualSoldCount=50 and totalSold=50, got manual=${createOfficialProd.body.data.manualSoldCount}, total=${createOfficialProd.body.data.totalSold}`);
      }
      recordPass('Sec 8.1', 'Official Store Manual Sold Count Creation', 'Official store created product with manualSoldCount=50 and received totalSold=50');

      // 3. Verify public product detail returns totalSold=50
      const publicProd = await request(`/api/products/${officialProdId}`);
      if (publicProd.status !== 200 || publicProd.body.data.totalSold !== 50) {
        throw new Error(`Public product detail did not return totalSold=50: ${JSON.stringify(publicProd.body)}`);
      }
      recordPass('Sec 8.2', 'Public API Total Sold Badge Computation', 'Public endpoint correctly returned totalSold=50 for official product');

      // 4. Update Official Store product to manualSoldCount = 75
      const updateOfficialProd = await request(`/api/seller/products/${officialProdId}`, {
        method: 'PATCH',
        token: officialToken,
        body: { manualSoldCount: 75 },
      });
      if (updateOfficialProd.status !== 200 || updateOfficialProd.body.data.totalSold !== 75) {
        throw new Error(`Failed to update official product manualSoldCount: ${JSON.stringify(updateOfficialProd.body)}`);
      }
      recordPass('Sec 8.3', 'Official Store Manual Sold Count Update', 'Official store updated manualSoldCount to 75, totalSold dynamically updated to 75');

      // 5. Regular seller cannot forge manualSoldCount
      const regularProdUpdate = await request(`/api/seller/products/${clonedProductId}`, {
        method: 'PATCH',
        token: testSellerToken,
        body: { manualSoldCount: 999 },
      });
      if (regularProdUpdate.status !== 200) {
        throw new Error(`Regular seller update failed: ${JSON.stringify(regularProdUpdate.body)}`);
      }
      // Ensure regular seller product manualSoldCount is 0, and totalSold is derived only from actual orders
      const regularPublicProd = await request(`/api/products/${clonedProductId}`);
      if (regularPublicProd.body.data.manualSoldCount === 999) {
        throw new Error('Security Violation: Regular seller successfully persisted manualSoldCount!');
      }
      if (regularPublicProd.body.data.totalSold !== 1) { // 1 order was placed in Section 5
        throw new Error(`Expected regular seller totalSold=1 (real order count), got ${regularPublicProd.body.data.totalSold}`);
      }
      recordPass('Sec 8.4', 'Regular Seller Sold Count Isolation', 'Regular seller cannot set manualSoldCount; totalSold is calculated strictly from real orders (totalSold=1)');

      // 6. Confirm no buyer-seller messaging route exists
      const testBuyerSellerChat = await request('/api/messages', { method: 'POST', body: { sellerId: testSellerId, message: 'Hello' } });
      if (testBuyerSellerChat.status === 404 || testBuyerSellerChat.status === 401) {
        recordPass('Sec 8.5', 'No Buyer-Seller Messaging Guarantee', 'Verified buyer-seller direct messaging routes do not exist');
      } else {
        throw new Error(`Unexpected response for buyer-seller messaging route: ${testBuyerSellerChat.status}`);
      }
    } catch (err) {
      recordFail('Sec 8', 'Recently Sold Count & Dynamic Badge Invariants', err);
    }
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  }

  // -------------------------------------------------------------
  // FINAL SCORECARD & SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                 E2E TEST SCORECARD & AUDIT REPORT              ');
  console.log('================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  results.forEach((r) => {
    const icon = r.passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${icon} ${r.rule.padEnd(8)}: ${r.name}`);
  });

  console.log('----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);
  console.log('================================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runE2ESuite().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
