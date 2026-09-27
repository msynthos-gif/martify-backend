import app from '../src/app';
import { prisma } from '../src/config/prisma';
import http from 'http';
import { Prisma } from '@prisma/client';

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
  console.log('🚀 Starting Section 5 Test Suite...\n');

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const port = (server.address() as any).port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    const sessionId = `guest-sess-${Date.now()}`;

    // 1. Fetch available products for testing
    console.log('\n--- 1. Fetch Catalog Products ---');
    const productsRes = await request('/api/products');
    assert(productsRes.status === 200, 'Fetched active products (200)');
    assert(productsRes.body.data.length >= 2, 'Found at least 2 active products');

    // Pick Product A and Product B from DIFFERENT sellers to verify multi-vendor balance hold distribution
    const productA = productsRes.body.data[0];
    const productB = productsRes.body.data.find((p: any) => p.sellerId !== productA.sellerId) || productsRes.body.data[1];
    console.log(`Product A: "${productA.title}" - $${productA.price} (Stock: ${productA.stock}, Seller: ${productA.seller.name})`);
    console.log(`Product B: "${productB.title}" - $${productB.price} (Stock: ${productB.stock}, Seller: ${productB.seller.name})`);

    // 2. Test Guest Cart Operations (Add, View, Remove)
    console.log('\n--- 2. Guest Cart Operations ---');
    // Add product A with qty 2
    const addA = await request('/api/cart', {
      method: 'POST',
      body: {
        sessionId,
        productId: productA.id,
        quantity: 2,
      },
    });
    assert(addA.status === 200, 'Guest added Product A (qty: 2) to cart (200)');

    // Add product B with qty 1
    const addB = await request('/api/cart', {
      method: 'POST',
      body: {
        sessionId,
        productId: productB.id,
        quantity: 1,
      },
    });
    assert(addB.status === 200, 'Guest added Product B (qty: 1) to cart (200)');

    // View cart
    const viewCart = await request(`/api/cart/${sessionId}`);
    assert(viewCart.status === 200, 'Guest retrieved cart items (200)');
    assert(viewCart.body.data.items.length === 2, 'Cart contains exactly 2 distinct products');
    assert(viewCart.body.data.itemCount === 3, 'Cart total item count is 3 (2 + 1)');

    const expectedSubtotal = Number(productA.price) * 2 + Number(productB.price) * 1;
    const actualSubtotal = Number(viewCart.body.data.subtotal);
    assert(
      Math.abs(actualSubtotal - expectedSubtotal) < 0.01,
      `Cart subtotal matches ($${actualSubtotal} === $${expectedSubtotal})`
    );

    // Try to add quantity exceeding product stock
    const overStockAdd = await request('/api/cart', {
      method: 'POST',
      body: {
        sessionId,
        productId: productA.id,
        quantity: 99999,
      },
    });
    assert(overStockAdd.status === 400, 'Adding quantity exceeding available stock rejected with 400 Bad Request');

    // Remove product B from cart
    const removeB = await request(`/api/cart/${sessionId}/${productB.id}`, {
      method: 'DELETE',
    });
    assert(removeB.status === 200, 'Removed Product B from cart (200)');

    const cartAfterRemove = await request(`/api/cart/${sessionId}`);
    assert(cartAfterRemove.body.data.items.length === 1, 'Cart now contains only 1 product');
    assert(cartAfterRemove.body.data.items[0].productId === productA.id, 'Remaining item is Product A');

    // Re-add product B (qty: 1) for a realistic multi-product order checkout
    await request('/api/cart', {
      method: 'POST',
      body: {
        sessionId,
        productId: productB.id,
        quantity: 1,
      },
    });

    // 3. Checkout Validation: Empty Cart Prevention
    console.log('\n--- 3. Checkout Validation ---');
    const emptySessionId = `empty-${Date.now()}`;
    const emptyCheckout = await request('/api/checkout', {
      method: 'POST',
      body: {
        sessionId: emptySessionId,
        buyerName: 'Jane Doe',
        buyerPhone: '+15557778899',
        buyerAddress: '99 Empty Cart Blvd, Suite 100',
      },
    });
    assert(emptyCheckout.status === 400, 'Checkout with empty cart rejected with 400 Bad Request');

    // 4. Test Checkout Transaction (Rule 4)
    console.log('\n--- 4. Guest Checkout Transaction (Rule 4) ---');
    // Fetch pre-checkout state for Product A, Product B, and their sellers
    const preProdA = await prisma.product.findUnique({ where: { id: productA.id } });
    const preProdB = await prisma.product.findUnique({ where: { id: productB.id } });
    const preSellerA = await prisma.user.findUnique({ where: { id: productA.sellerId } });
    const preSellerB = await prisma.user.findUnique({ where: { id: productB.sellerId } });

    console.log(`Pre-checkout Product A stock: ${preProdA!.stock}`);
    console.log(`Pre-checkout Product B stock: ${preProdB!.stock}`);
    console.log(`Pre-checkout Seller A balanceOnHold: $${preSellerA!.balanceOnHold}`);
    console.log(`Pre-checkout Seller B balanceOnHold: $${preSellerB!.balanceOnHold}`);

    // Execute checkout
    const checkoutRes = await request('/api/checkout', {
      method: 'POST',
      body: {
        sessionId,
        buyerName: 'Alice Buyer',
        buyerPhone: '+15554443322',
        buyerAddress: '123 Market Street, Apt 4B, Metro City',
      },
    });

    assert(checkoutRes.status === 201, 'Guest checkout completed successfully (201)');
    assert(checkoutRes.body.data.orders.length === 2, 'Created 2 Order records (one per cart item)');
    assert(checkoutRes.body.data.buyerName === 'Alice Buyer', 'Order buyerName recorded');
    assert(checkoutRes.body.data.buyerPhone === '+15554443322', 'Order buyerPhone recorded');

    // Verify each order is in status BOOKED
    for (const order of checkoutRes.body.data.orders) {
      assert(order.status === 'BOOKED', `Order ${order.id} status is BOOKED`);
      assert(Number(order.totalPrice) > 0, `Order ${order.id} totalPrice is positive`);
    }

    const orderA = checkoutRes.body.data.orders.find((o: any) => o.productId === productA.id);
    const orderB = checkoutRes.body.data.orders.find((o: any) => o.productId === productB.id);

    const expectedOrderATotal = Number(productA.price) * 2;
    const expectedOrderBTotal = Number(productB.price) * 1;
    assert(Math.abs(Number(orderA.totalPrice) - expectedOrderATotal) < 0.01, 'Order A totalPrice matches exact calculation');
    assert(Math.abs(Number(orderB.totalPrice) - expectedOrderBTotal) < 0.01, 'Order B totalPrice matches exact calculation');

    // 5. Verify Database State Mutations (Transaction Integrity)
    console.log('\n--- 5. Database State & Balance Hold Verification ---');
    // Product stock decremented
    const postProdA = await prisma.product.findUnique({ where: { id: productA.id } });
    const postProdB = await prisma.product.findUnique({ where: { id: productB.id } });
    assert(postProdA!.stock === preProdA!.stock - 2, `Product A stock decremented by 2 (${preProdA!.stock} -> ${postProdA!.stock})`);
    assert(postProdB!.stock === preProdB!.stock - 1, `Product B stock decremented by 1 (${preProdB!.stock} -> ${postProdB!.stock})`);

    // Calculate expected credits per seller
    const sellerAOrdersTotal = checkoutRes.body.data.orders
      .filter((o: any) => o.sellerId === productA.sellerId)
      .reduce((sum: number, o: any) => sum + Number(o.totalPrice), 0);
    const sellerBOrdersTotal = checkoutRes.body.data.orders
      .filter((o: any) => o.sellerId === productB.sellerId)
      .reduce((sum: number, o: any) => sum + Number(o.totalPrice), 0);

    const postSellerA = await prisma.user.findUnique({ where: { id: productA.sellerId } });
    const postSellerB = await prisma.user.findUnique({ where: { id: productB.sellerId } });

    const expectedSellerAHold = Number(preSellerA!.balanceOnHold) + sellerAOrdersTotal;
    const expectedSellerBHold = Number(preSellerB!.balanceOnHold) + sellerBOrdersTotal;

    assert(
      Math.abs(Number(postSellerA!.balanceOnHold) - expectedSellerAHold) < 0.01,
      `Seller A balanceOnHold credited by $${sellerAOrdersTotal} ($${preSellerA!.balanceOnHold} -> $${postSellerA!.balanceOnHold})`
    );
    assert(
      Math.abs(Number(postSellerB!.balanceOnHold) - expectedSellerBHold) < 0.01,
      `Seller B balanceOnHold credited by $${sellerBOrdersTotal} ($${preSellerB!.balanceOnHold} -> $${postSellerB!.balanceOnHold})`
    );

    // Available balance remains untouched (Rule 4: strictly hold balance until delivered)
    assert(
      Number(postSellerA!.balanceAvailable) === Number(preSellerA!.balanceAvailable),
      'Seller A balanceAvailable remains untouched (0)'
    );
    assert(
      Number(postSellerB!.balanceAvailable) === Number(preSellerB!.balanceAvailable),
      'Seller B balanceAvailable remains untouched (0)'
    );

    // Cart cleared after checkout
    const postCart = await request(`/api/cart/${sessionId}`);
    assert(postCart.body.data.items.length === 0, 'Cart is completely cleared after checkout');

    console.log('\n🎉 ALL SECTION 5 TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('Section 5 test failure:', err);
  process.exit(1);
});
