import { supportService } from '../src/services/support.service';
import { prisma } from '../src/config/prisma';

async function checkConv() {
  const conv = await supportService.getOrCreateSellerConversation('56d3bf57-6304-4c14-97bd-f75753113d5a');
  console.log('Ticket ID:', conv.id);
  console.log('Total messages:', conv.messages.length);
  conv.messages.slice(-10).forEach((m) => {
    console.log(`${m.createdAt.toISOString()} | [${m.senderRole}] ${m.message}`);
  });
}

checkConv()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
