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
  console.log('🚀 Starting Section 4 Test Suite...\n');

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const port = (server.address() as any).port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // 1. Authenticate Admin and a demo seller
    console.log('\n--- 1. Authenticate & Setup Test Seller ---');
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@nayyar.com', password: 'admin!#$123@' },
    });
    const adminToken = adminLogin.body.data.token;

    // Clean up test seller if exists
    await prisma.user.deleteMany({
      where: { email: 'cloning.seller@market.com' },
    });

    // Register a new test seller
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Venture Merchants',
        email: 'cloning.seller@market.com',
        password: 'Password123!',
        phone: '+15559876543',
      },
    });
    const sellerId = regRes.body.data.user.id;
    const sellerToken = regRes.body.data.token;

    // Fast-track approval for this test seller via Admin
    await request(`/api/seller/kyc`, {
      method: 'PATCH',
      token: sellerToken,
      body: { kycDocumentUrl: '/uploads/kyc/test-license.png' },
    });
    await request(`/api/admin/sellers/${sellerId}/kyc`, {
      method: 'PATCH',
      token: adminToken,
      body: { kycStatus: 'APPROVED' },
    });
    await request(`/api/admin/sellers/${sellerId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { sellerStatus: 'APPROVED' },
    });

    // Give seller availableStock = 100 via approved stock request
    const stockReq = await request('/api/seller/stock-requests', {
      method: 'POST',
      token: sellerToken,
      body: { quantity: 100, note: 'Initial stock allocation' },
    });
    await request(`/api/admin/stock-requests/${stockReq.body.data.id}`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'APPROVED' },
    });

    const profileRes = await request('/api/seller/me', { token: sellerToken });
    assert(profileRes.body.data.availableStock === 100, 'Test seller initialized with availableStock = 100');

    // Get a category ID
    const catList = await request('/api/categories');
    const categoryId = catList.body.data[0].id;

    // 2. Test Catalog Products Endpoint (Rule 3)
    console.log('\n--- 2. Public Catalog Endpoint (Rule 3) ---');
    const catalogRes = await request('/api/products/catalog');
    assert(catalogRes.status === 200, 'GET /api/products/catalog returns 200');
    assert(Array.isArray(catalogRes.body.data), 'Catalog data is an array');
    assert(catalogRes.body.data.length >= 15, 'Found at least 15 demo catalog products');
    // Ensure all catalog items come from demo accounts
    const allDemo = catalogRes.body.data.every((p: any) => p.seller !== undefined);
    assert(allDemo, 'Catalog products contain valid seller attribution');
    const targetCatalogProduct = catalogRes.body.data[0];
    console.log(`Target catalog item: "${targetCatalogProduct.title}" ($${targetCatalogProduct.price})`);

    // 3. Test Product Creation & Stock Cap (Rule 2)
    console.log('\n--- 3. Product Creation & Stock Cap (Rule 2) ---');
    // Create product with 40 stock (<= 100 limit)
    const createProdRes = await request('/api/seller/products', {
      method: 'POST',
      token: sellerToken,
      body: {
        title: 'Artisan Mechanical Numpad',
        description: 'CNC anodized aluminum numpad with hot-swappable sockets.',
        price: 49.99,
        imageUrl: '/uploads/products/numpad.svg',
        stock: 40,
        categoryId,
      },
    });
    assert(createProdRes.status === 201, 'Created original product with stock: 40 (201)');
    const originalProductId = createProdRes.body.data.id;

    // Try to create second product with 70 stock (40 + 70 = 110 > 100) -> MUST FAIL 400
    const overCapCreate = await request('/api/seller/products', {
      method: 'POST',
      token: sellerToken,
      body: {
        title: 'Excessive Stock Item',
        description: 'This item exceeds remaining stock cap.',
        price: 29.99,
        imageUrl: '/uploads/products/excess.svg',
        stock: 70,
        categoryId,
      },
    });
    assert(overCapCreate.status === 400, 'Rule 2: Exceeding stock cap on product creation rejected with 400 Bad Request');

    // 4. Test Product Update & Stock Cap
    console.log('\n--- 4. Product Update & Stock Cap ---');
    // Update product stock to 110 (> 100) -> MUST FAIL 400
    const overCapUpdate = await request(`/api/seller/products/${originalProductId}`, {
      method: 'PATCH',
      token: sellerToken,
      body: { stock: 110 },
    });
    assert(overCapUpdate.status === 400, 'Rule 2: Updating product stock beyond availableStock rejected with 400 Bad Request');

    // Update product stock to 50 (<= 100) -> SUCCEEDS
    const validUpdate = await request(`/api/seller/products/${originalProductId}`, {
      method: 'PATCH',
      token: sellerToken,
      body: { stock: 50, price: 54.99 },
    });
    assert(validUpdate.status === 200, 'Updated product stock to 50 and price to 54.99 (200)');
    assert(Number(validUpdate.body.data.price) === 54.99, 'Updated price is 54.99');
    assert(validUpdate.body.data.stock === 50, 'Updated stock is 50');

    // 5. Test Catalog Clone Flow (Rule 3)
    console.log('\n--- 5. Catalog Clone Flow (Rule 3) ---');
    // Clone target catalog product with stock = 30 (current active: 50 + 30 = 80 <= 100)
    const cloneRes = await request('/api/seller/products/clone', {
      method: 'POST',
      token: sellerToken,
      body: {
        catalogProductId: targetCatalogProduct.id,
        price: 79.99,
        stock: 30,
      },
    });
    assert(cloneRes.status === 201, 'Cloned catalog product successfully (201)');
    assert(cloneRes.body.data.title === targetCatalogProduct.title, 'Cloned title copied from catalog');
    assert(cloneRes.body.data.description === targetCatalogProduct.description, 'Cloned description copied from catalog');
    assert(cloneRes.body.data.imageUrl === targetCatalogProduct.imageUrl, 'Cloned imageUrl copied from catalog');
    assert(cloneRes.body.data.categoryId === targetCatalogProduct.categoryId, 'Cloned categoryId copied from catalog');
    assert(Number(cloneRes.body.data.price) === 79.99, 'Seller custom price applied (79.99)');
    assert(cloneRes.body.data.stock === 30, 'Seller custom stock applied (30)');
    assert(cloneRes.body.data.clonedFromProductId === targetCatalogProduct.id, 'clonedFromProductId set for traceability');
    const clonedProductId = cloneRes.body.data.id;

    // Try to clone another item with stock = 30 (current active: 50 + 30 + 30 = 110 > 100) -> MUST FAIL 400
    const overCapClone = await request('/api/seller/products/clone', {
      method: 'POST',
      token: sellerToken,
      body: {
        catalogProductId: catalogRes.body.data[1].id,
        price: 99.99,
        stock: 30,
      },
    });
    assert(overCapClone.status === 400, 'Rule 2 & 3: Stock cap enforced on catalog clone (rejected with 400)');

    // 6. Test Ownership Protection
    console.log('\n--- 6. Ownership & Access Guards ---');
    const demoSellerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'techzone@demo.com', password: 'SellerPass123!' },
    });
    const otherSellerToken = demoSellerLogin.body.data.token;

    // Other seller cannot view or update this seller's products
    const otherView = await request(`/api/seller/products/${clonedProductId}`, { token: otherSellerToken });
    assert(otherView.status === 404, 'Other seller cannot access product via /api/seller/products/:id (404)');

    const otherUpdate = await request(`/api/seller/products/${clonedProductId}`, {
      method: 'PATCH',
      token: otherSellerToken,
      body: { price: 1.0 },
    });
    assert(otherUpdate.status === 404, 'Other seller cannot modify product (404)');

    // 7. Test Product Deletion and Stock Capacity Reclaim
    console.log('\n--- 7. Product Deletion & Capacity Reclaim ---');
    // Delete the original product (50 stock freed, leaving 30 active out of 100)
    const deleteRes = await request(`/api/seller/products/${originalProductId}`, {
      method: 'DELETE',
      token: sellerToken,
    });
    assert(deleteRes.status === 200, 'Seller deleted original product (200)');

    // Now seller has 70 stock available! Creating a product with 50 stock now succeeds
    const reclaimedCreate = await request('/api/seller/products', {
      method: 'POST',
      token: sellerToken,
      body: {
        title: 'Reclaimed Stock Keyboard Cable',
        description: 'Custom coiled aviator cable.',
        price: 24.99,
        imageUrl: '/uploads/products/cable.svg',
        stock: 50,
        categoryId,
      },
    });
    assert(reclaimedCreate.status === 201, 'Created product utilizing reclaimed capacity (201)');

    // 8. Test Public Catalog Views
    console.log('\n--- 8. Public Catalog Views ---');
    const publicProducts = await request('/api/products');
    assert(publicProducts.status === 200, 'GET /api/products returns 200');
    assert(publicProducts.body.data.length > 0, 'Public products listed');

    const singlePub = await request(`/api/products/${clonedProductId}`);
    assert(singlePub.status === 200, 'GET /api/products/:id returns 200');
    assert(singlePub.body.data.title === targetCatalogProduct.title, 'Public single product view matches title');

    const sellerStore = await request(`/api/sellers/${sellerId}/products`);
    assert(sellerStore.status === 200, 'GET /api/sellers/:id/products returns seller storefront (200)');
    assert(sellerStore.body.data.products.length === 2, 'Seller storefront displays active products');

    console.log('\n🎉 ALL SECTION 4 TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('Section 4 test failure:', err);
  process.exit(1);
});
