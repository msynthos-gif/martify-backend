import { supportService } from '../src/services/support.service';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';

async function testTickSystem() {
  console.log('Testing WhatsApp Tick and Read Status System...');
  
  // Find a seller
  const seller = await prisma.user.findFirst({
    where: { role: Role.SELLER },
  });
  if (!seller) {
    throw new Error('No seller found');
  }

  // 1. Seller sends a new message
  console.log(`1. Seller (${seller.name}) sending a message...`);
  const sent = await supportService.sendSellerMessage(seller.id, 'Testing grey tick until read ' + Date.now());
  console.log('Message created with isRead:', sent.isRead);
  if (sent.isRead !== false) {
    throw new Error('New seller message should have isRead = false');
  }

  // 2. Check Support getTickets unread count
  const ticketsBefore = await supportService.getTickets(seller.id, Role.SUPPORT);
  const myTicket = ticketsBefore.find((t: any) => t.sellerId === seller.id);
  console.log('Unread count on support side before reading:', (myTicket as any)?.unreadCount);
  if (((myTicket as any)?.unreadCount || 0) < 1) {
    throw new Error('Unread count should be at least 1');
  }

  // 3. Support opens the conversation (getTicketById)
  console.log('2. Support opens conversation (getTicketById)...');
  const opened = await supportService.getTicketById(sent.ticketId, 'support-agent-id', Role.SUPPORT);
  const readMsg = opened.messages.find((m: any) => m.id === sent.id);
  console.log('Message isRead after Support opened:', readMsg?.isRead);
  if (readMsg?.isRead !== true) {
    throw new Error('Message should be marked isRead = true after support opened ticket');
  }

  // 4. Check Support getTickets unread count after opening
  const ticketsAfter = await supportService.getTickets(seller.id, Role.SUPPORT);
  const myTicketAfter = ticketsAfter.find((t: any) => t.sellerId === seller.id);
  console.log('Unread count on support side after reading:', (myTicketAfter as any)?.unreadCount);

  // 5. Seller fetches their conversation -> verify message is now read (Blue tick)
  console.log('3. Seller fetches conversation...');
  const sellerConv = await supportService.getOrCreateSellerConversation(seller.id);
  const sellerMsg = sellerConv.messages.find((m: any) => m.id === sent.id);
  console.log('Seller sees message isRead:', sellerMsg?.isRead);
  if (sellerMsg?.isRead !== true) {
    throw new Error('Seller should now see isRead = true (Blue double tick)');
  }

  console.log('\n✅ ALL TICK AND READ STATUS TESTS PASSED PERFECTLY!');
}

testTickSystem()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
