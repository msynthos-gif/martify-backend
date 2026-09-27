import { prisma } from '../src/config/prisma';
import { categoryService } from '../src/services/category.service';

async function main() {
  console.log('--- Testing Category showInNavbar and Sub-category Hierarchy ---');

  // 1. Create a parent category with showInNavbar: false
  const parentHidden = await categoryService.createCategory({
    name: '__Test_Hidden_Cat__',
    slug: 'test-hidden-cat',
    showInNavbar: false,
  });
  console.log('1. Created parent with showInNavbar = false:', parentHidden.showInNavbar);
  if (parentHidden.showInNavbar !== false) {
    throw new Error('Expected showInNavbar to be false');
  }

  // 2. Create a parent category with showInNavbar: true (or default)
  const parentVisible = await categoryService.createCategory({
    name: '__Test_Visible_Cat__',
    slug: 'test-visible-cat',
    showInNavbar: true,
  });
  console.log('2. Created parent with showInNavbar = true:', parentVisible.showInNavbar);
  if (parentVisible.showInNavbar !== true) {
    throw new Error('Expected showInNavbar to be true');
  }

  // 3. Create a sub-category under parentVisible
  const subCat = await categoryService.createCategory({
    name: '__Test_Sub_Cat__',
    slug: 'test-sub-cat',
    parentId: parentVisible.id,
    showInNavbar: true,
  });
  console.log('3. Created sub-category with parentId:', subCat.parentId);
  if (subCat.parentId !== parentVisible.id) {
    throw new Error('Expected subCat parentId to match parentVisible.id');
  }

  // 4. Update parentHidden to showInNavbar: true
  const updatedParent = await categoryService.updateCategory(parentHidden.id, {
    showInNavbar: true,
  });
  console.log('4. Updated parentHidden to showInNavbar = true:', updatedParent.showInNavbar);
  if (updatedParent.showInNavbar !== true) {
    throw new Error('Expected updatedParent showInNavbar to be true');
  }

  // 5. Query all categories and verify relations and showInNavbar
  const allCats = await categoryService.getAllCategories();
  const foundVisible = allCats.find(c => c.id === parentVisible.id);
  console.log('5. Found visible parent with subCategories count:', foundVisible?.subCategories?.length);
  if (!foundVisible || foundVisible.subCategories?.length !== 1) {
    throw new Error('Expected visible parent to have 1 sub-category');
  }

  // 6. Cleanup
  await categoryService.deleteCategory(parentHidden.id);
  await categoryService.deleteCategory(parentVisible.id);
  console.log('6. Cleanup complete.');

  console.log('All Category showInNavbar & Sub-category tests PASSED!');
}

main()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
