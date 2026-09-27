import { prisma } from '../src/config/prisma';

async function check() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, sellerStatus: true } });
  console.log('Users:', users);
  const tickets = await prisma.supportTicket.findMany({
    include: {
      seller: { select: { id: true, name: true, email: true } },
      messages: true
    }
  });
  console.log('Tickets count:', tickets.length);
  console.log('Tickets:', JSON.stringify(tickets, null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
