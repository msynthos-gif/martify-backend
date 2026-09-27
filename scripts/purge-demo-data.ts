import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';

export async function purgeAllProductsAndInventory() {
  console.log('\n🧹 ======================================================');
  console.log('    PURGING ALL PRODUCTS & RESETTING SELLER INVENTORY    ');
  console.log('========================================================\n');

  // 1. Delete all Support Messages & Tickets
  const deletedMessages = await prisma.supportMessage.deleteMany();
  console.log(`✅ Cleared ${deletedMessages.count} support messages.`);

  const deletedTickets = await prisma.supportTicket.deleteMany();
  console.log(`✅ Cleared ${deletedTickets.count} support tickets.`);

  // 2. Delete all Orders & Order Items
  const deletedOrders = await prisma.order.deleteMany();
  console.log(`✅ Cleared ${deletedOrders.count} orders.`);

  // 3. Delete all Cart Items
  const deletedCartItems = await prisma.cartItem.deleteMany();
  console.log(`✅ Cleared ${deletedCartItems.count} cart items.`);

  // 4. Delete all Stock Requests
  const deletedStockRequests = await prisma.stockRequest.deleteMany();
  console.log(`✅ Cleared ${deletedStockRequests.count} stock requests.`);

  // 5. Delete ALL Product Images (DB records)
  const deletedImages = await prisma.productImage.deleteMany();
  console.log(`✅ Cleared ${deletedImages.count} product images.`);

  // 6. Delete ALL Products
  const deletedProducts = await prisma.product.deleteMany();
  console.log(`✅ Cleared ${deletedProducts.count} products.`);

  // 7. Reset seller inventory & balances to zero
  const resetSellers = await prisma.user.updateMany({
    where: { role: Role.SELLER },
    data: {
      availableStock: 0,
      balanceOnHold: 0,
      balanceAvailable: 0,
    },
  });
  console.log(`✅ Reset inventory & balance to zero for ${resetSellers.count} sellers.`);

  // 8. Verify Safe-Keeping Invariants
  const categoriesCount = await prisma.category.count();
  const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
  const supportCount = await prisma.user.count({ where: { role: Role.SUPPORT } });
  const remainingSellers = await prisma.user.count({ where: { role: Role.SELLER } });
  const remainingProducts = await prisma.product.count();

  console.log('\n========================================================');
  console.log('              POST-PURGE STATUS REPORT                  ');
  console.log('========================================================');
  console.log(`📁 Categories Preserved: ${categoriesCount}`);
  console.log(`👤 Admin Account Preserved: ${adminCount}`);
  console.log(`🎧 Support Account Preserved: ${supportCount}`);
  console.log(`🏪 Active Sellers: ${remainingSellers}`);
  console.log(`📦 Remaining Products: ${remainingProducts}`);
  console.log('========================================================\n');

  if (remainingProducts !== 0) {
    throw new Error(`Incomplete purge: ${remainingProducts} products still exist!`);
  }
}

// Execute when called via tsx / npm run
if (require.main === module || (process.argv[1] && process.argv[1].includes('purge-demo-data'))) {
  purgeAllProductsAndInventory()
    .then(() => {
      console.log('🎉 Storefront successfully cleared to 0 products.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error during purge:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
