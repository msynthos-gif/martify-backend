import { prisma } from '../src/config/prisma';
import { productService } from '../src/services/product.service';

async function main() {
  console.log('🧪 Testing Strict 24-Hour New Arrivals Logic...\n');

  const seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  const category = await prisma.category.findFirst();

  if (!seller || !category) {
    throw new Error('Seller or Category not found in database');
  }

  // 1. Create a product from 48 hours ago (should NOT appear in new arrivals)
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const oldProduct = await prisma.product.create({
    data: {
      title: 'Old Drop (48 Hours Ago)',
      description: 'Product created two days ago for testing 24-hour filtering',
      price: 99.0,
      stock: 5,
      imageUrl: '/images/old-drop.jpg',
      sellerId: seller.id,
      categoryId: category.id,
      createdAt: twoDaysAgo,
    },
  });
  console.log(`✅ 1. Created older product (48h ago): ${oldProduct.id}`);

  // 2. Create a fresh product from 1 hour ago (MUST appear in new arrivals)
  const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
  const freshProduct = await prisma.product.create({
    data: {
      title: 'Fresh Drop (1 Hour Ago)',
      description: 'Product created 1 hour ago for testing 24-hour filtering',
      price: 150.0,
      stock: 10,
      imageUrl: '/images/fresh-drop.jpg',
      sellerId: seller.id,
      categoryId: category.id,
      createdAt: oneHourAgo,
    },
  });
  console.log(`✅ 2. Created fresh product (1h ago): ${freshProduct.id}`);

  // 3. Query with filter=new-arrivals
  const newArrivals = await productService.getPublicProducts(undefined, 'new-arrivals');
  console.log(`✅ 3. Queried getPublicProducts(undefined, 'new-arrivals') -> returned ${newArrivals.length} products`);

  const containsFresh = newArrivals.some((p) => p.id === freshProduct.id);
  const containsOld = newArrivals.some((p) => p.id === oldProduct.id);

  console.log(`   - Contains fresh drop (1h ago): ${containsFresh ? 'YES (CORRECT)' : 'NO (ERROR)'}`);
  console.log(`   - Contains old drop (48h ago): ${containsOld ? 'YES (ERROR)' : 'NO (CORRECT)'}`);

  if (!containsFresh) throw new Error('Fresh product from 1 hour ago was not included in new arrivals!');
  if (containsOld) throw new Error('Old product from 48 hours ago was incorrectly included in new arrivals!');

  // Clean up test products
  await prisma.product.deleteMany({
    where: { id: { in: [oldProduct.id, freshProduct.id] } },
  });
  console.log('✅ 4. Cleaned up test products');

  console.log('\n🎉 ALL 24-HOUR NEW ARRIVALS TESTS PASSED SUCCESSFULLY!');
}

main()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
