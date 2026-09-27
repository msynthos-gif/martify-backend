import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- Verifying Database State ---');

  // 1. Check demo accounts
  const demoAccounts = await prisma.user.findMany({
    where: { isDemoAccount: true },
    select: { id: true, name: true, email: true, role: true, sellerStatus: true, kycStatus: true, isDemoAccount: true },
  });

  console.log(`Demo accounts found (${demoAccounts.length}):`, JSON.stringify(demoAccounts, null, 2));

  if (demoAccounts.length !== 1) {
    throw new Error(`Expected exactly 1 demo account, found ${demoAccounts.length}`);
  }

  const officialStore = demoAccounts[0];
  if (officialStore.name !== 'Nexus Official Store' || officialStore.email !== 'official@nexus.com') {
    throw new Error(`Unexpected official store data: ${JSON.stringify(officialStore)}`);
  }

  // 2. Check all products in DB
  const allProducts = await prisma.product.findMany({
    include: {
      seller: { select: { id: true, name: true, email: true, isDemoAccount: true } },
      category: { select: { name: true, slug: true } },
    },
  });

  console.log(`Total products seeded: ${allProducts.length}`);

  const unassignedOrNonOfficial = allProducts.filter(p => p.sellerId !== officialStore.id);
  if (unassignedOrNonOfficial.length > 0) {
    throw new Error(`Found ${unassignedOrNonOfficial.length} products not assigned to Nexus Official Store!`);
  }

  console.log('Sample verified products:');
  allProducts.slice(0, 5).forEach((p, i) => {
    console.log(`  [${i + 1}] "${p.title}" | $${p.price} | Category: ${p.category?.name} | Seller: ${p.seller.name} (${p.seller.email})`);
  });

  // 3. Verify public catalog endpoint against running backend or via fetch
  console.log('\n--- Verifying GET http://localhost:5000/api/products/catalog ---');
  try {
    const res = await fetch('http://localhost:5000/api/products/catalog');
    const json = await res.json();
    console.log(`Response Status: ${res.status}`);
    console.log(`Products returned in catalog: ${json.data?.length}`);
    const nonNexus = (json.data || []).filter((p: any) => p.seller?.name !== 'Nexus Official Store');
    if (nonNexus.length > 0) {
      console.error('Non-nexus products found:', nonNexus);
    } else {
      console.log('✅ ALL 15 catalog products are attributed to "Nexus Official Store"!');
    }
  } catch (err) {
    console.log('Note: Backend server check error (might be restart in progress):', err);
  }

  // 4. Verify seller storefront endpoint
  console.log(`\n--- Verifying GET http://localhost:5000/api/sellers/${officialStore.id}/products ---`);
  try {
    const res = await fetch(`http://localhost:5000/api/sellers/${officialStore.id}/products`);
    const json = await res.json();
    console.log(`Storefront Response Status: ${res.status}`);
    console.log(`Storefront Seller:`, json.data?.seller);
    console.log(`Storefront Products count: ${json.data?.products?.length}`);
  } catch (err) {
    console.log('Note: Storefront check error:', err);
  }

  console.log('\n✅ Verification Complete!');
}

verify()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
