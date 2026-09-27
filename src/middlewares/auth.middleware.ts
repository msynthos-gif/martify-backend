import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { prisma } from '../config/prisma';
import { Role, SellerStatus } from '@prisma/client';

export interface AuthenticatedUser extends TokenPayload {
  sellerStatus?: SellerStatus | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch user from DB to ensure they still exist and check their status
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, sellerStatus: true, email: true },
    });

    if (!dbUser) {
      throw new UnauthorizedError('User account not found');
    }

    if (dbUser.sellerStatus === SellerStatus.BLOCKED) {
      throw new ForbiddenError('Your seller account has been blocked');
    }

    req.user = {
      userId: dbUser.id,
      role: dbUser.role,
      email: dbUser.email,
      sellerStatus: dbUser.sellerStatus,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Invalid or expired authentication token'));
    } else {
      next(error);
    }
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
}

export function requireApprovedSeller(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== Role.SELLER) {
    return next(new ForbiddenError('Only sellers can access this resource'));
  }

  if (req.user.sellerStatus !== SellerStatus.APPROVED) {
    return next(new ForbiddenError('Your seller account is pending KYC or admin approval'));
  }

  next();
}
