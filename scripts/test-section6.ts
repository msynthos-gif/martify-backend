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
  console.log('🚀 Starting Section 6 Test Suite...\n');

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
    console.log('\n--- 1. Authenticate Users ---');
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@nayyar.com', password: 'admin!#$123@' },
    });
    const adminToken = adminLogin.body.data.token;

    const supportLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'support1@nayyar.com', password: 'nayyar123@#$' },
    });
    const supportToken = supportLogin.body.data.token;

    const sellerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'urbanthreads@demo.com', password: 'SellerPass123!' },
    });
    const sellerToken = sellerLogin.body.data.token;
    const sellerId = sellerLogin.body.data.user.id;

    // Create a fresh test order via Guest Checkout
    console.log('\n--- 2. Create Fresh Order for Testing ---');
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId, isActive: true },
    });
    const targetProduct = sellerProducts[0];

    const sessionId = `test-s6-${Date.now()}`;
    await request('/api/cart', {
      method: 'POST',
      body: {
        sessionId,
        productId: targetProduct.id,
        quantity: 1,
      },
    });

    const checkoutRes = await request('/api/checkout', {
      method: 'POST',
      body: {
        sessionId,
        buyerName: 'Section 6 Tester',
        buyerPhone: '+15553332211',
        buyerAddress: '77 Logistics Ave, Cityville',
      },
    });
    assert(checkoutRes.status === 201, 'Order created via checkout (201)');
    const testOrder = checkoutRes.body.data.orders[0];
    const orderId = testOrder.id;
    const orderPrice = Number(testOrder.totalPrice);
    console.log(`Test Order ID: ${orderId} ($${orderPrice}), initial status: ${testOrder.status}`);

    // 2. Test Order Status Permission & Sequential Transitions (Rule 5)
    console.log('\n--- 3. Order Status Lifecycle (Rule 5) ---');
    // Seller cannot update order status
    const sellerForbidden = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      token: sellerToken,
      body: { status: 'PROCESSING' },
    });
    assert(sellerForbidden.status === 403, 'Seller forbidden from updating order status (403)');

    // Prohibited skip: BOOKED -> DELIVERED
    const skipDelivered = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      token: supportToken,
      body: { status: 'DELIVERED' },
    });
    assert(skipDelivered.status === 400, 'Prohibited skip: BOOKED -> DELIVERED rejected with 400');

    // Prohibited skip: BOOKED -> SHIPPING
    const skipShipping = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      token: supportToken,
      body: { status: 'SHIPPING' },
    });
    assert(skipShipping.status === 400, 'Prohibited skip: BOOKED -> SHIPPING rejected with 400');

    // Valid step 1: BOOKED -> PROCESSING
    const step1 = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      token: supportToken,
      body: { status: 'PROCESSING' },
    });
    assert(step1.status === 200, 'Sequential move: BOOKED -> PROCESSING (200)');
    assert(step1.body.data.order.status === 'PROCESSING', 'Status is now PROCESSING');

    // Prohibited backward move: PROCESSING -> BOOKED
    const backwardMove = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      token: supportToken,
      body: { status: 'BOOKED' as any },
    });
    assert(backwardMove.status === 400, 'Prohibited backward move: PROCESSING -> BOOKED rejected with 400');

    // Valid step 2: PROCESSING -> SHIPPING
    const step2 = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      token: supportToken,
      body: { status: 'SHIPPING' },
    });
    assert(step2.status === 200, 'Sequential move: PROCESSING -> SHIPPING (200)');
    assert(step2.body.data.order.status === 'SHIPPING', 'Status is now SHIPPING');

    // 3. Test Balance Release on DELIVERED (Rule 6)
    console.log('\n--- 4. Balance Release on Delivery (Rule 6) ---');
    // Check seller balances right before delivery
    const preDeliverySeller = await prisma.user.findUnique({ where: { id: sellerId } });
    const preHold = Number(preDeliverySeller!.balanceOnHold);
    const preAvail = Number(preDeliverySeller!.balanceAvailable);
    console.log(`Pre-delivery: balanceOnHold = $${preHold}, balanceAvailable = $${preAvail}`);

    // Valid step 3: SHIPPING -> DELIVERED (Admin or Support)
    const step3 = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'DELIVERED' },
    });
    assert(step3.status === 200, 'Sequential move: SHIPPING -> DELIVERED (200)');
    assert(step3.body.data.order.status === 'DELIVERED', 'Status is now DELIVERED');

    // Verify atomic balance shift: balanceOnHold decremented by orderPrice, balanceAvailable incremented by orderPrice
    const postDeliverySeller = await prisma.user.findUnique({ where: { id: sellerId } });
    const postHold = Number(postDeliverySeller!.balanceOnHold);
    const postAvail = Number(postDeliverySeller!.balanceAvailable);
    console.log(`Post-delivery: balanceOnHold = $${postHold}, balanceAvailable = $${postAvail}`);

    assert(
      Math.abs(postHold - (preHold - orderPrice)) < 0.01,
      `balanceOnHold correctly decremented by $${orderPrice} ($${preHold} -> $${postHold})`
    );
    assert(
      Math.abs(postAvail - (preAvail + orderPrice)) < 0.01,
      `balanceAvailable correctly incremented by $${orderPrice} ($${preAvail} -> $${postAvail})`
    );

    // Cannot advance past DELIVERED
    const pastDelivered = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      token: supportToken,
      body: { status: 'DELIVERED' },
    });
    assert(pastDelivered.status === 400, 'Cannot advance past DELIVERED (rejected with 400)');

    // 4. Seller Views Orders (Read-only)
    console.log('\n--- 5. Seller Orders Endpoint ---');
    const sellerOrdersRes = await request('/api/seller/orders', { token: sellerToken });
    assert(sellerOrdersRes.status === 200, 'Seller can list own orders (200)');
    assert(sellerOrdersRes.body.data.some((o: any) => o.id === orderId), 'Test order appears in seller order list');

    // 5. Support Ticket System (Rule 7)
    console.log('\n--- 6. Support Ticket System (Rule 7) ---');
    // Seller creates ticket attached to their order
    const createTicketRes = await request('/api/support/tickets', {
      method: 'POST',
      token: sellerToken,
      body: {
        subject: 'Shipment confirmation inquiry',
        orderId: orderId,
        message: 'Can you confirm if delivery was signed by recipient?',
      },
    });
    assert(createTicketRes.status === 201, 'Seller created support ticket (201)');
    const ticketId = createTicketRes.body.data.id;
    assert(createTicketRes.body.data.status === 'OPEN', 'Initial ticket status is OPEN');
    assert(createTicketRes.body.data.messages.length === 1, 'Initial message created');
    assert(createTicketRes.body.data.messages[0].senderRole === 'SELLER', 'Sender role is SELLER');

    // Support lists tickets -> sees new ticket
    const supportTickets = await request('/api/support/tickets', { token: supportToken });
    assert(supportTickets.status === 200, 'Support agent lists all tickets (200)');
    assert(supportTickets.body.data.some((t: any) => t.id === ticketId), 'Ticket visible in Support dashboard');

    // Support posts a reply
    const replyRes = await request(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      token: supportToken,
      body: {
        message: 'Yes, recipient signed at front desk at 10:15 AM.',
      },
    });
    assert(replyRes.status === 201, 'Support posted message to ticket (201)');
    assert(replyRes.body.data.senderRole === 'SUPPORT', 'Sender role is SUPPORT');

    // Seller posts follow-up message
    const followUpRes = await request(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      token: sellerToken,
      body: {
        message: 'Perfect, thank you for checking!',
      },
    });
    assert(followUpRes.status === 201, 'Seller replied to ticket (201)');
    assert(followUpRes.body.data.senderRole === 'SELLER', 'Sender role is SELLER');

    // Verify conversation history
    const ticketDetail = await request(`/api/support/tickets/${ticketId}`, { token: sellerToken });
    assert(ticketDetail.status === 200, 'Retrieved ticket details with messages (200)');
    assert(ticketDetail.body.data.messages.length === 3, 'Ticket has exactly 3 messages in conversation');

    // Seller cannot update ticket status
    const sellerStatusChange = await request(`/api/support/tickets/${ticketId}`, {
      method: 'PATCH',
      token: sellerToken,
      body: { status: 'RESOLVED' },
    });
    assert(sellerStatusChange.status === 403, 'Seller forbidden from updating ticket status (403)');

    // Support updates ticket status to RESOLVED
    const resolveRes = await request(`/api/support/tickets/${ticketId}`, {
      method: 'PATCH',
      token: supportToken,
      body: { status: 'RESOLVED' },
    });
    assert(resolveRes.status === 200, 'Support updated ticket status to RESOLVED (200)');
    assert(resolveRes.body.data.status === 'RESOLVED', 'Ticket status is now RESOLVED');

    console.log('\n🎉 ALL SECTION 6 TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('Section 6 test failure:', err);
  process.exit(1);
});
