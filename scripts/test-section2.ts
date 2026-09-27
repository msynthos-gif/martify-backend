import app from '../src/app';
import { prisma } from '../src/config/prisma';
import http from 'http';
import fs from 'fs';
import path from 'path';

let server: http.Server;
let baseUrl: string;

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
  console.log('🚀 Starting Section 2 Test Suite...\n');

  // Start temporary server
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const port = (server.address() as any).port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // 1. Clean up any previous test seller
    await prisma.user.deleteMany({
      where: { email: 'new.seller@market.com' },
    });

    // 2. Test Admin Login
    console.log('\n--- 1. Login Existing Users ---');
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@nayyar.com',
        password: 'admin!#$123@',
      },
    });
    assert(adminLogin.status === 200, 'Admin can login with valid credentials (200)');
    assert(adminLogin.body.data.user.role === 'ADMIN', 'Admin user role is ADMIN');
    const adminToken = adminLogin.body.data.token;

    // 3. Test Support Login
    const supportLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'support1@nayyar.com',
        password: 'nayyar123@#$',
      },
    });
    assert(supportLogin.status === 200, 'Support agent 1 can login with valid credentials (200)');
    assert(supportLogin.body.data.user.role === 'SUPPORT', 'Support user role is SUPPORT');

    // 4. Test Invalid Login
    const invalidLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@nayyar.com',
        password: 'wrong-password',
      },
    });
    assert(invalidLogin.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // 5. Test Seller Registration
    console.log('\n--- 2. Seller Registration ---');
    const registerRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Apex Merchant Co',
        email: 'new.seller@market.com',
        password: 'SellerSecret!99',
        phone: '+15551234567',
      },
    });
    assert(registerRes.status === 201, 'New seller registered successfully (201)');
    assert(registerRes.body.data.user.role === 'SELLER', 'Registered user role is SELLER');
    assert(registerRes.body.data.user.sellerStatus === 'PENDING', 'Initial sellerStatus is PENDING');
    assert(registerRes.body.data.user.kycStatus === 'NOT_SUBMITTED', 'Initial kycStatus is NOT_SUBMITTED');
    assert(registerRes.body.data.user.availableStock === 0, 'Initial availableStock is 0');
    const sellerToken = registerRes.body.data.token;
    const sellerId = registerRes.body.data.user.id;

    // Duplicate email registration should fail with 409 Conflict
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Another Apex',
        email: 'new.seller@market.com',
        password: 'Password123!',
        phone: '+15551234567',
      },
    });
    assert(dupRes.status === 409, 'Duplicate seller registration rejected with 409 Conflict');

    // 6. Test Seller Profile Endpoint (GET /api/seller/me)
    console.log('\n--- 3. Seller Profile Endpoint ---');
    const unauthProfile = await request('/api/seller/me');
    assert(unauthProfile.status === 401, 'Unauthenticated /api/seller/me rejected with 401');

    const profileRes = await request('/api/seller/me', { token: sellerToken });
    assert(profileRes.status === 200, 'Authenticated seller can access /api/seller/me (200)');
    assert(profileRes.body.data.id === sellerId, 'Profile returns correct seller id');
    assert(profileRes.body.data.availableStock === 0, 'Profile shows availableStock 0');

    // 7. Test Multer KYC Upload
    console.log('\n--- 4. File Upload (Multer) ---');
    const dummyImageBuffer = Buffer.from(
      'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
    );
    const uploadRes = await request('/api/seller/kyc/upload', {
      method: 'POST',
      token: sellerToken,
      formData: {
        fieldName: 'document',
        fileName: 'national-id.png',
        buffer: dummyImageBuffer,
        contentType: 'image/png',
      },
    });
    assert(uploadRes.status === 200, 'KYC document uploaded successfully via Multer (200)');
    const uploadedUrl = uploadRes.body.data.url;
    assert(typeof uploadedUrl === 'string' && uploadedUrl.length > 0, 'Upload returns valid url');

    // 8. Test Submit KYC (PATCH /api/seller/kyc)
    console.log('\n--- 5. Submit KYC ---');
    const submitKycRes = await request('/api/seller/kyc', {
      method: 'PATCH',
      token: sellerToken,
      body: {
        kycDocumentUrl: uploadedUrl,
      },
    });
    assert(submitKycRes.status === 200, 'KYC submitted successfully (200)');
    assert(submitKycRes.body.data.kycStatus === 'PENDING', 'kycStatus changed to PENDING');

    // 9. Test Business Logic Rule 1: Seller Approval Gate
    console.log('\n--- 6. Seller Approval Gate (Rule 1) ---');
    // Admin attempts to set sellerStatus = APPROVED while kycStatus is PENDING
    const prematureApproval = await request(`/api/admin/sellers/${sellerId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        sellerStatus: 'APPROVED',
      },
    });
    assert(
      prematureApproval.status === 400,
      'Rule 1 Gate: Approving seller before KYC approval rejected with 400 Bad Request'
    );

    // Support agent cannot access admin endpoints
    const supportUnauthorized = await request(`/api/admin/sellers/${sellerId}`, {
      method: 'PATCH',
      token: supportLogin.body.data.token,
      body: { sellerStatus: 'APPROVED' },
    });
    assert(
      supportUnauthorized.status === 403,
      'Support agent forbidden from admin seller endpoints (403)'
    );

    // Admin approves KYC
    const kycApproval = await request(`/api/admin/sellers/${sellerId}/kyc`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        kycStatus: 'APPROVED',
      },
    });
    assert(kycApproval.status === 200, 'Admin approved KYC successfully (200)');
    assert(kycApproval.body.data.kycStatus === 'APPROVED', 'kycStatus is now APPROVED');

    // Now Admin approves seller status -> should succeed!
    const sellerStatusApproval = await request(`/api/admin/sellers/${sellerId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        sellerStatus: 'APPROVED',
      },
    });
    assert(
      sellerStatusApproval.status === 200,
      'Rule 1 Gate: Admin approved sellerStatus after KYC approval (200)'
    );
    assert(
      sellerStatusApproval.body.data.sellerStatus === 'APPROVED',
      'sellerStatus is now APPROVED'
    );

    // 10. Test Blocked Seller Behavior
    console.log('\n--- 7. Blocked Seller Login Prevention ---');
    const blockRes = await request(`/api/admin/sellers/${sellerId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        sellerStatus: 'BLOCKED',
      },
    });
    assert(blockRes.status === 200, 'Admin blocked seller (200)');

    const blockedLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'new.seller@market.com',
        password: 'SellerSecret!99',
      },
    });
    assert(
      blockedLogin.status === 403,
      'Blocked seller login blocked with 403 Forbidden'
    );

    const blockedReq = await request('/api/seller/me', { token: sellerToken });
    assert(
      blockedReq.status === 403,
      'Blocked seller token rejected with 403 Forbidden'
    );

    // Cleanup: restore seller to APPROVED
    await prisma.user.update({
      where: { id: sellerId },
      data: { sellerStatus: 'APPROVED' },
    });

    console.log('\n🎉 ALL SECTION 2 TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('Section 2 test failure:', err);
  process.exit(1);
});
