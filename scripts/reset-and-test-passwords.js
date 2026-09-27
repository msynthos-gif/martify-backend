const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const http = require('http');

const prisma = new PrismaClient();

async function resetPasswords() {
  console.log('🔄 Hashing and resetting passwords in database...');

  const adminHash = await bcrypt.hash('admin!#$123@', 10);
  const support1Hash = await bcrypt.hash('nayyar123@#$', 10);
  const support2Hash = await bcrypt.hash('nayyar321#$@%', 10);
  const sellerHash = await bcrypt.hash('SellerPass123!', 10);

  const updatedAdmin = await prisma.user.update({
    where: { email: 'admin@nayyar.com' },
    data: { passwordHash: adminHash },
  });
  console.log(`✅ Reset admin@nayyar.com: role=${updatedAdmin.role}`);

  const updatedSupport1 = await prisma.user.update({
    where: { email: 'support1@nayyar.com' },
    data: { passwordHash: support1Hash },
  });
  console.log(`✅ Reset support1@nayyar.com: role=${updatedSupport1.role}`);

  const updatedSupport2 = await prisma.user.update({
    where: { email: 'support2@nayyar.com' },
    data: { passwordHash: support2Hash },
  });
  console.log(`✅ Reset support2@nayyar.com: role=${updatedSupport2.role}`);

  const updatedSeller = await prisma.user.update({
    where: { email: 'official@nexus.com' },
    data: { passwordHash: sellerHash },
  });
  console.log(`✅ Reset official@nexus.com: role=${updatedSeller.role}`);
}

function testLoginApi(email, password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email, password });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({
              statusCode: res.statusCode,
              success: res.statusCode === 200,
              body: parsed,
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              success: false,
              raw: body,
            });
          }
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        success: false,
        error: err.message,
      });
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  await resetPasswords();

  console.log('\n🧪 Testing HTTP Login API endpoints on http://localhost:5000/api/auth/login...\n');

  const testCases = [
    { email: 'admin@nayyar.com', password: 'admin!#$123@', expectedRole: 'ADMIN' },
    { email: 'support1@nayyar.com', password: 'nayyar123@#$', expectedRole: 'SUPPORT' },
    { email: 'support2@nayyar.com', password: 'nayyar321#$@%', expectedRole: 'SUPPORT' },
    { email: 'official@nexus.com', password: 'SellerPass123!', expectedRole: 'SELLER' },
  ];

  let allPassed = true;
  for (const tc of testCases) {
    const res = await testLoginApi(tc.email, tc.password);
    if (res.success && res.body?.data?.user?.role === tc.expectedRole) {
      console.log(`🎉 PASS: ${tc.email} -> Logged in successfully! Role: ${res.body.data.user.role}, Token returned: ${Boolean(res.body.data.token)}`);
    } else {
      console.error(`❌ FAIL: ${tc.email} -> Status: ${res.statusCode}, Body:`, res.body || res.raw || res.error);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n🚀 ALL LOGINS SUCCEEDED!');
  } else {
    console.error('\n⚠️ SOME LOGINS FAILED!');
    process.exitCode = 1;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
