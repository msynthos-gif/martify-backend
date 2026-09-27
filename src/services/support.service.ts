import { prisma } from '../config/prisma';
import { CreateTicketInput } from '../validators/support.schema';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { Role, SenderRole, TicketStatus } from '@prisma/client';

export class SupportService {
  /**
   * Get or create the single continuous conversation thread for a seller
   */
  async getOrCreateSellerConversation(sellerId: string) {
    let ticket = await prisma.supportTicket.findFirst({
      where: { sellerId },
      include: {
        seller: { select: { id: true, name: true, email: true, phone: true, sellerStatus: true, kycStatus: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      ticket = await prisma.supportTicket.create({
        data: {
          sellerId,
          subject: 'Support Conversation',
          status: TicketStatus.OPEN,
        },
        include: {
          seller: { select: { id: true, name: true, email: true, phone: true, sellerStatus: true, kycStatus: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } else {
      // Mark any unread messages from SUPPORT / ADMIN as read since the SELLER is reading them
      await prisma.supportMessage.updateMany({
        where: {
          ticketId: ticket.id,
          senderRole: SenderRole.SUPPORT,
          isRead: false,
        } as any,
        data: {
          isRead: true,
          readAt: new Date(),
        } as any,
      });
      ticket.messages = ticket.messages.map((m: any) =>
        m.senderRole === SenderRole.SUPPORT ? { ...m, isRead: true } : m
      );
    }

    return ticket;
  }

  /**
   * Get seller conversation without auto-creating if empty
   */
  async getSellerConversation(sellerId: string) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { sellerId },
      include: {
        seller: { select: { id: true, name: true, email: true, phone: true, sellerStatus: true, kycStatus: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (ticket) {
      await prisma.supportMessage.updateMany({
        where: {
          ticketId: ticket.id,
          senderRole: SenderRole.SUPPORT,
          isRead: false,
        } as any,
        data: {
          isRead: true,
          readAt: new Date(),
        } as any,
      });
      ticket.messages = ticket.messages.map((m: any) =>
        m.senderRole === SenderRole.SUPPORT ? { ...m, isRead: true } : m
      );
    }

    return ticket;
  }

  /**
   * Send a message from a seller in their single continuous conversation.
   * Finds existing thread or auto-creates one.
   */
  async sendSellerMessage(sellerId: string, messageText: string) {
    if (!messageText || !messageText.trim()) {
      throw new BadRequestError('Message cannot be empty');
    }

    let ticket = await prisma.supportTicket.findFirst({
      where: { sellerId },
    });

    if (!ticket) {
      ticket = await prisma.supportTicket.create({
        data: {
          sellerId,
          subject: 'Support Conversation',
          status: TicketStatus.OPEN,
        },
      });
    } else {
      // Mark any unread messages from support as read
      await prisma.supportMessage.updateMany({
        where: {
          ticketId: ticket.id,
          senderRole: SenderRole.SUPPORT,
          isRead: false,
        } as any,
        data: {
          isRead: true,
          readAt: new Date(),
        } as any,
      });

      if (ticket.status === TicketStatus.RESOLVED) {
        // Re-open if resolved so support agents see active reply in triage
        await prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { status: TicketStatus.OPEN },
        });
      }
    }

    const createdMsg = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderRole: SenderRole.SELLER,
        message: messageText.trim(),
        isRead: false,
      } as any,
    });

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
    });

    const fullConversation = await this.getOrCreateSellerConversation(sellerId);

    return {
      ...createdMsg,
      conversation: fullConversation,
    };
  }

  /**
   * Send a reply from Support/Admin to a specific conversation
   */
  async sendSupportReply(ticketId: string, messageText: string) {
    if (!messageText || !messageText.trim()) {
      throw new BadRequestError('Message cannot be empty');
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundError('Conversation not found');
    }

    // Mark previous seller messages as read since support is replying
    await prisma.supportMessage.updateMany({
      where: {
        ticketId: ticket.id,
        senderRole: SenderRole.SELLER,
        isRead: false,
      } as any,
      data: {
        isRead: true,
        readAt: new Date(),
      } as any,
    });

    const createdMsg = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderRole: SenderRole.SUPPORT,
        message: messageText.trim(),
        isRead: false,
      } as any,
    });

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
    });

    const fullConversation = await this.getTicketById(ticket.id, ticket.sellerId, Role.SUPPORT);

    return {
      ...createdMsg,
      conversation: fullConversation,
    };
  }

  /**
   * Legacy createTicket: redirected to single continuous chat model
   */
  async createTicket(sellerId: string, input: CreateTicketInput) {
    const text = input.orderId
      ? `Regarding order #${input.orderId.slice(0, 8).toUpperCase()}: ${input.message}`
      : input.message;
    return this.sendSellerMessage(sellerId, text);
  }

  /**
   * Get all conversations for Support Dashboard (one entry per seller, sorted by latest message)
   */
  async getTickets(userId: string, role: Role) {
    if (role === Role.SELLER) {
      const conv = await this.getSellerConversation(userId);
      return conv ? [conv] : [];
    }

    // For SUPPORT / ADMIN: ensure every registered seller has a conversation thread
    const allSellers = await prisma.user.findMany({
      where: { role: Role.SELLER },
      select: { id: true },
    });

    for (const s of allSellers) {
      const existing = await prisma.supportTicket.findUnique({
        where: { sellerId: s.id },
      });
      if (!existing) {
        await prisma.supportTicket.create({
          data: {
            sellerId: s.id,
            subject: 'Support Conversation',
            status: TicketStatus.OPEN,
          },
        });
      }
    }

    // Return all seller conversations sorted by latest activity
    const tickets = await prisma.supportTicket.findMany({
      include: {
        seller: { select: { id: true, name: true, email: true, phone: true, sellerStatus: true, kycStatus: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // latest message preview snippet
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute unread count for each ticket from SELLER
    const unreadCounts = await (prisma.supportMessage as any).groupBy({
      by: ['ticketId'],
      where: {
        senderRole: SenderRole.SELLER,
        isRead: false,
      },
      _count: { id: true },
    });

    const unreadMap = new Map<string, number>();
    for (const uc of unreadCounts) {
      unreadMap.set(uc.ticketId, uc._count.id);
    }

    return tickets.map((t) => ({
      ...t,
      unreadCount: unreadMap.get(t.id) || 0,
    }));
  }

  async getTicketById(ticketId: string, userId: string, role: Role) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        seller: { select: { id: true, name: true, email: true, phone: true, sellerStatus: true, kycStatus: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Conversation not found');
    }

    if (role === Role.SELLER && ticket.sellerId !== userId) {
      throw new ForbiddenError('You do not have permission to view this conversation');
    }

    // Mark messages as read based on who is viewing
    if (role === Role.SUPPORT || role === Role.ADMIN) {
      await (prisma.supportMessage as any).updateMany({
        where: {
          ticketId,
          senderRole: SenderRole.SELLER,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      ticket.messages = ticket.messages.map((m: any) =>
        m.senderRole === SenderRole.SELLER ? { ...m, isRead: true } : m
      );
    } else if (role === Role.SELLER) {
      await (prisma.supportMessage as any).updateMany({
        where: {
          ticketId,
          senderRole: SenderRole.SUPPORT,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      ticket.messages = ticket.messages.map((m: any) =>
        m.senderRole === SenderRole.SUPPORT ? { ...m, isRead: true } : m
      );
    }

    return ticket;
  }

  async addMessage(ticketId: string, userId: string, role: Role, messageText: string) {
    if (role === Role.SELLER) {
      return this.sendSellerMessage(userId, messageText);
    }
    return this.sendSupportReply(ticketId, messageText);
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundError('Conversation not found');
    }

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        seller: { select: { id: true, name: true, email: true, phone: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }
}

export const supportService = new SupportService();
