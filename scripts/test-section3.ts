import app from '../src/app';
import { prisma } from '../src/config/prisma';
import http from 'http';

let server: http.Server;
let baseUrl: string;

async function request(
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
  } = {}
) {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {};

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  let bodyData: any = undefined;
  if (options.body) {
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
  } catch (e) {
    json = null;
  }

  return { status, body: json };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('🚀 Starting Section 3 Test Suite...\n');

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const port = (server.address() as any).port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // 1. Authenticate Admin, Support, and Demo Seller
    console.log('\n--- 1. Authenticate Test Users ---');
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@nayyar.com', password: 'admin!#$123@' },
    });
    assert(adminLogin.status === 200, 'Admin logged in (200)');
    const adminToken = adminLogin.body.data.token;

    const supportLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'support1@nayyar.com', password: 'nayyar123@#$' },
    });
    assert(supportLogin.status === 200, 'Support logged in (200)');
    const supportToken = supportLogin.body.data.token;

    const sellerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'techzone@demo.com', password: 'SellerPass123!' },
    });
    assert(sellerLogin.status === 200, 'Demo seller logged in (200)');
    const sellerToken = sellerLogin.body.data.token;
    const sellerId = sellerLogin.body.data.user.id;

    // 2. Test Admin Seller Listing & Detail
    console.log('\n--- 2. Admin Seller Management ---');
    const sellersList = await request('/api/admin/sellers', { token: adminToken });
    assert(sellersList.status === 200, 'Admin can list sellers (200)');
    assert(Array.isArray(sellersList.body.data), 'Sellers response is an array');
    assert(sellersList.body.data.length >= 5, 'Found at least 5 seeded demo sellers');

    const singleSeller = await request(`/api/admin/sellers/${sellerId}`, { token: adminToken });
    assert(singleSeller.status === 200, 'Admin can view single seller detail (200)');
    assert(singleSeller.body.data.email === 'techzone@demo.com', 'Seller email matches');
    assert(singleSeller.body.data._count.products >= 3, 'Seller has at least 3 seeded products');

    // 3. Test Public & Admin Category Endpoints
    console.log('\n--- 3. Category Management (CRUD) ---');
    // Public category listing
    const publicCats = await request('/api/categories');
    assert(publicCats.status === 200, 'Public GET /api/categories accessible without auth (200)');
    assert(publicCats.body.data.length >= 6, 'Public categories list contains at least 6 categories');

    // Admin creates new category
    const createCat = await request('/api/admin/categories', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'Musical Instruments',
        slug: 'musical-instruments',
      },
    });
    assert(createCat.status === 201, 'Admin created new category (201)');
    const newCatId = createCat.body.data.id;
    assert(createCat.body.data.slug === 'musical-instruments', 'Category slug matches');

    // Duplicate slug rejected
    const dupCat = await request('/api/admin/categories', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'Another Instruments',
        slug: 'musical-instruments',
      },
    });
    assert(dupCat.status === 409, 'Duplicate category slug rejected with 409 Conflict');

    // Admin updates category
    const updateCat = await request(`/api/admin/categories/${newCatId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        name: 'Studio & Audio Gear',
      },
    });
    assert(updateCat.status === 200, 'Admin updated category name (200)');
    assert(updateCat.body.data.name === 'Studio & Audio Gear', 'Updated category name matches');

    // Admin deletes unused category
    const deleteCat = await request(`/api/admin/categories/${newCatId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert(deleteCat.status === 200, 'Admin deleted unused category (200)');

    // Attempting to delete category with products fails
    const seededCat = publicCats.body.data.find((c: any) => c.slug === 'electronics');
    assert(!!seededCat, 'Electronics category exists');
    const deleteUsedCat = await request(`/api/admin/categories/${seededCat.id}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert(deleteUsedCat.status === 409, 'Deleting category with existing products rejected with 409 Conflict');

    // 4. Test Stock Request Flow & Atomic availableStock Increment
    console.log('\n--- 4. Stock Request Flow & Atomic Increment ---');
    // Get seller's current availableStock
    const profileBefore = await request('/api/seller/me', { token: sellerToken });
    const initialStock = profileBefore.body.data.availableStock;
    console.log(`Initial seller availableStock: ${initialStock}`);

    // Seller submits stock request for +200
    const stockReqRes = await request('/api/seller/stock-requests', {
      method: 'POST',
      token: sellerToken,
      body: {
        quantity: 200,
        note: 'Seasonal inventory increase',
      },
    });
    assert(stockReqRes.status === 201, 'Seller submitted stock request for 200 units (201)');
    assert(stockReqRes.body.data.status === 'PENDING', 'Initial stock request status is PENDING');
    const stockReqId = stockReqRes.body.data.id;

    // Seller views own stock requests
    const sellerRequests = await request('/api/seller/stock-requests', { token: sellerToken });
    assert(sellerRequests.status === 200, 'Seller can list own stock requests (200)');
    assert(sellerRequests.body.data.some((r: any) => r.id === stockReqId), 'New request in seller list');

    // Admin views all stock requests
    const adminRequests = await request('/api/admin/stock-requests', { token: adminToken });
    assert(adminRequests.status === 200, 'Admin can view all stock requests (200)');
    assert(adminRequests.body.data.some((r: any) => r.id === stockReqId), 'New request in admin list');

    // Non-admin (support) cannot approve stock request
    const supportTry = await request(`/api/admin/stock-requests/${stockReqId}`, {
      method: 'PATCH',
      token: supportToken,
      body: { status: 'APPROVED' },
    });
    assert(supportTry.status === 403, 'Support agent forbidden from approving stock requests (403)');

    // Admin approves stock request -> triggers atomic transaction
    const approveRes = await request(`/api/admin/stock-requests/${stockReqId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'APPROVED' },
    });
    assert(approveRes.status === 200, 'Admin approved stock request (200)');
    assert(approveRes.body.data.stockRequest.status === 'APPROVED', 'Stock request status is APPROVED');

    // Verify atomic availableStock increment: initialStock + 200
    const profileAfter = await request('/api/seller/me', { token: sellerToken });
    const newStock = profileAfter.body.data.availableStock;
    console.log(`Updated seller availableStock: ${newStock}`);
    assert(newStock === initialStock + 200, `availableStock correctly incremented by 200 (${initialStock} -> ${newStock})`);

    // Cannot approve an already approved stock request
    const reApprove = await request(`/api/admin/stock-requests/${stockReqId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'APPROVED' },
    });
    assert(reApprove.status === 400, 'Re-approving an already approved stock request rejected with 400 Bad Request');

    // 5. Test Stock Request Rejection (no availableStock increment)
    console.log('\n--- 5. Stock Request Rejection ---');
    const rejectReqRes = await request('/api/seller/stock-requests', {
      method: 'POST',
      token: sellerToken,
      body: {
        quantity: 50,
        note: 'Small top-up',
      },
    });
    const rejectReqId = rejectReqRes.body.data.id;

    const rejectAction = await request(`/api/admin/stock-requests/${rejectReqId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'REJECTED' },
    });
    assert(rejectAction.status === 200, 'Admin rejected stock request (200)');
    assert(rejectAction.body.data.stockRequest.status === 'REJECTED', 'Stock request status is REJECTED');

    // Verify availableStock did not change
    const profileFinal = await request('/api/seller/me', { token: sellerToken });
    assert(profileFinal.body.data.availableStock === newStock, 'availableStock remains unchanged on rejection');

    console.log('\n🎉 ALL SECTION 3 TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('Section 3 test failure:', err);
  process.exit(1);
});
