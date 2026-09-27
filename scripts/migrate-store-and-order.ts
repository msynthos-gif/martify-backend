import { prisma } from '../src/config/prisma';

async function run() {
  try {
    console.log('Running migration for store profile and structured checkout fields...');

    // 1. Add store profile fields to users table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "storeName" TEXT,
      ADD COLUMN IF NOT EXISTS "storeDescription" TEXT,
      ADD COLUMN IF NOT EXISTS "storeImageUrl" TEXT;
    `);
    console.log('✅ users table updated with storeName, storeDescription, storeImageUrl');

    // 2. Add structured checkout fields to orders table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS "buyerEmail" TEXT,
      ADD COLUMN IF NOT EXISTS "country" TEXT,
      ADD COLUMN IF NOT EXISTS "company" TEXT,
      ADD COLUMN IF NOT EXISTS "address" TEXT,
      ADD COLUMN IF NOT EXISTS "apartment" TEXT,
      ADD COLUMN IF NOT EXISTS "city" TEXT,
      ADD COLUMN IF NOT EXISTS "state" TEXT,
      ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
    `);
    console.log('✅ orders table updated with structured checkout fields');

    // 3. Rename any existing 'Nexus Official Store' user to 'Martify Collection Official Store'
    await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET name = 'Martify Collection Official Store' 
      WHERE name = 'Nexus Official Store';
    `);
    console.log('✅ Updated Official Store name to Martify Collection Official Store');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
