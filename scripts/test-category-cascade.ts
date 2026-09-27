import { prisma } from '../src/config/prisma';
import { categoryService } from '../src/services/category.service';

async function main() {
  console.log('🧪 Testing Category Upgrade & Cascade Deletion...\n');

  // 1. Create a parent category
  const parent = await categoryService.createCategory({
    name: 'Test Outerwear Parent',
    slug: 'test-outerwear-parent',
  });
  console.log(`✅ 1. Created parent category: ${parent.name} (id: ${parent.id}, slug: ${parent.slug})`);

  // 2. Create a sub-category under this parent
  const child = await categoryService.createCategory({
    name: 'Test Winter Jackets Child',
    slug: 'test-winter-jackets-child',
    parentId: parent.id,
  });
  console.log(`✅ 2. Created sub-category: ${child.name} (id: ${child.id}, parentId: ${child.parentId})`);

  // 3. Update / Rename category (Name & auto slug update)
  const updatedChild = await categoryService.updateCategory(child.id, {
    name: 'Test Heavy Winter Coats',
  });
  console.log(`✅ 3. Renamed sub-category to: ${updatedChild.name} (slug auto-updated: ${updatedChild.slug})`);

  // 4. Find an active seller to create products under both parent and child
  const seller = await prisma.user.findFirst({
    where: { role: 'SELLER' },
  });
  if (!seller) {
    throw new Error('No seller found in database');
  }

  // Create a product in parent category
  const prod1 = await prisma.product.create({
    data: {
      title: 'Parent Category Test Product',
      description: 'Product directly in parent category',
      price: 120.0,
      stock: 15,
      imageUrl: '/images/test-p1.jpg',
      sellerId: seller.id,
      categoryId: parent.id,
    },
  });

  // Create a product in child category
  const prod2 = await prisma.product.create({
    data: {
      title: 'Child Category Test Product',
      description: 'Product in sub-category',
      price: 180.0,
      stock: 10,
      imageUrl: '/images/test-p2.jpg',
      sellerId: seller.id,
      categoryId: child.id,
    },
  });
  console.log(`✅ 4. Created 2 test products: prod1 in parent (${prod1.id}), prod2 in child (${prod2.id})`);

  // 5. Test Cascade Deletion: Delete parent category
  console.log(`⏳ 5. Deleting parent category ${parent.id} with cascade...`);
  const deleteResult = await categoryService.deleteCategory(parent.id);
  console.log(`✅ 5. Delete result:`, deleteResult);

  // 6. Verify database clean state
  const parentCheck = await prisma.category.findUnique({ where: { id: parent.id } });
  const childCheck = await prisma.category.findUnique({ where: { id: child.id } });
  const prod1Check = await prisma.product.findUnique({ where: { id: prod1.id } });
  const prod2Check = await prisma.product.findUnique({ where: { id: prod2.id } });

  if (parentCheck !== null) throw new Error('Parent category was not deleted!');
  if (childCheck !== null) throw new Error('Sub-category was not cascaded and deleted!');
  if (prod1Check !== null) throw new Error('Parent product was not cascaded and deleted!');
  if (prod2Check !== null) throw new Error('Child product was not cascaded and deleted!');

  console.log('✅ 6. Verification confirmed: Parent category, child sub-category, and all associated products were cleanly cascade deleted without any FK or 409 conflict errors!');
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

main()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
