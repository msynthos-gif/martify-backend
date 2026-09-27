const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Normalizing KYC and Product image URLs in the database...');
  const users = await prisma.user.findMany({
    where: { kycDocumentUrl: { not: null } },
  });

  for (const u of users) {
    if (u.kycDocumentUrl) {
      const idx = u.kycDocumentUrl.toLowerCase().indexOf('uploads/');
      if (idx !== -1) {
        const cleanUrl = '/' + u.kycDocumentUrl.slice(idx).replace(/\\/g, '/');
        await prisma.user.update({
          where: { id: u.id },
          data: { kycDocumentUrl: cleanUrl },
        });
        console.log(`Updated user ${u.name}: ${u.kycDocumentUrl} -> ${cleanUrl}`);
      }
    }
  }

  // Also check products in case any products had raw disk paths
  const products = await prisma.product.findMany();
  for (const p of products) {
    if (p.imageUrl && p.imageUrl.toLowerCase().includes('uploads/')) {
      const idx = p.imageUrl.toLowerCase().indexOf('uploads/');
      const cleanUrl = '/' + p.imageUrl.slice(idx).replace(/\\/g, '/');
      if (cleanUrl !== p.imageUrl) {
        await prisma.product.update({
          where: { id: p.id },
          data: { imageUrl: cleanUrl },
        });
        console.log(`Updated product ${p.title}: ${p.imageUrl} -> ${cleanUrl}`);
      }
    }
  }

  console.log('✅ Database URL normalization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
