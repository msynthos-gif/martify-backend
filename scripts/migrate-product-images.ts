import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating existing product images into product_images table...');
  const products = await prisma.product.findMany({
    include: {
      images: true,
    },
  });

  console.log(`Found ${products.length} products in database.`);
  let migratedCount = 0;

  for (const product of products) {
    if (product.images.length === 0 && product.imageUrl) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: product.imageUrl,
          sortOrder: 0,
        },
      });
      migratedCount++;
    }
  }

  console.log(`✅ Successfully migrated ${migratedCount} products to have sortOrder 0 ProductImage rows.`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
