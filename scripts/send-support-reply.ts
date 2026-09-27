import { supportService } from '../src/services/support.service';
import { prisma } from '../src/config/prisma';

async function sendSupportMsg() {
  const reply = await supportService.sendSupportReply(
    '96d4705a-0ac3-4acb-bf85-4fae21b01538',
    'Hello dfsgdfgh! This is Nexus Support. We are here to help you.'
  );
  console.log('Support reply sent successfully!');
  console.log('Created message:', reply.id, reply.senderRole, reply.message);
}

sendSupportMsg()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
