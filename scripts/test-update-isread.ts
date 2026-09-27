import { prisma } from '../src/config/prisma';

async function testUpdate() {
  try {
    const count = await prisma.supportMessage.updateMany({
      where: {
        ticketId: '96d4705a-0ac3-4acb-bf85-4fae21b01538',
        senderRole: 'SELLER',
        isRead: false,
      } as any,
      data: {
        isRead: true,
        readAt: new Date(),
      } as any,
    });
    console.log('Update result:', count);
  } catch (err) {
    console.error('Error updating:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();
