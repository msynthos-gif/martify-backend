import { prisma } from '../src/config/prisma';

async function run() {
  try {
    console.log('Adding isRead and readAt columns to support_messages...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE support_messages 
      ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN DEFAULT false;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE support_messages 
      ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP;
    `);
    console.log('Columns added successfully!');
    
    // Check table info
    const sample = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'support_messages';
    `);
    console.log('Columns in support_messages:', sample);
  } catch (e) {
    console.error('Migration error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
