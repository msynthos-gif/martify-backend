const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const tickets = await p.supportTicket.findMany({
    include: {
      seller: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  console.log(`Total tickets: ${tickets.length}`);
  for (const t of tickets) {
    console.log(`Ticket ${t.id} - Seller: ${t.seller?.name} (${t.seller?.email}) - Subject: "${t.subject}" - Messages: ${t.messages.length} - Updated: ${t.updatedAt}`);
  }
}

check().finally(() => p.$disconnect());
