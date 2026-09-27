import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { supportService } from '../services/support.service';

export class SupportController {
  // Get logged-in seller's single conversation
  async getSellerConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const conversation = await supportService.getOrCreateSellerConversation(sellerId);

      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  // Send message from logged-in seller (finds or creates thread)
  async sendSellerMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const result = await supportService.sendSellerMessage(sellerId, req.body.message);

      res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        data: result.conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  // Legacy createTicket fallback
  async createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const result = await supportService.createTicket(sellerId, req.body);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: result.conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  // List conversations (Support/Admin see all seller chats, Seller sees own)
  async getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tickets = await supportService.getTickets(req.user!.userId, req.user!.role);

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get specific conversation with messages
  async getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.getTicketById(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  // Post message to conversation thread (Support / Admin replying, or Seller replying)
  async addMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let result: any;
      if (req.user!.role === Role.SELLER) {
        result = await supportService.sendSellerMessage(
          req.user!.userId,
          req.body.message
        );
      } else {
        result = await supportService.sendSupportReply(
          req.params.id,
          req.body.message
        );
      }

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: {
          id: result.id,
          ticketId: result.ticketId,
          senderRole: result.senderRole,
          message: result.message,
          createdAt: result.createdAt,
          conversation: result.conversation,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update conversation status (Support / Admin only)
  async updateTicketStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await supportService.updateTicketStatus(req.params.id, req.body.status);

      res.status(200).json({
        success: true,
        message: `Status updated to ${req.body.status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const supportController = new SupportController();
