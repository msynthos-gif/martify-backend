import { prisma } from '../src/config/prisma';

async function verify() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, sellerStatus: true, kycStatus: true, isDemoAccount: true },
  });
  const categories = await prisma.category.findMany({ select: { name: true, slug: true } });
  const products = await prisma.product.count();

  console.log('=== SEED VERIFICATION ===');
  console.log(`Total Users: ${users.length}`);
  users.forEach((u) => {
    console.log(` - [${u.role}] ${u.name} (${u.email}) [sellerStatus: ${u.sellerStatus}, kycStatus: ${u.kycStatus}, isDemo: ${u.isDemoAccount}]`);
  });
  console.log(`\nTotal Categories: ${categories.length}`);
  categories.forEach((c) => console.log(` - ${c.name} (${c.slug})`));
  console.log(`\nTotal Seeded Products: ${products}`);

  await prisma.$disconnect();
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
