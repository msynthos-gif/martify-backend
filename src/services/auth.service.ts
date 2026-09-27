import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { RegisterInput, LoginInput } from '../validators/auth.schema';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../utils/errors';
import { signToken } from '../utils/jwt';
import { Role, SellerStatus, KycStatus } from '@prisma/client';

export class AuthService {
  async registerSeller(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        phone: input.phone,
        role: Role.SELLER,
        sellerStatus: SellerStatus.PENDING,
        kycStatus: KycStatus.NOT_SUBMITTED,
        availableStock: 0,
        isDemoAccount: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        sellerStatus: true,
        kycStatus: true,
        availableStock: true,
        balanceOnHold: true,
        balanceAvailable: true,
        createdAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return { user, token };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.sellerStatus === SellerStatus.BLOCKED) {
      throw new ForbiddenError('Your account has been blocked by an administrator');
    }

    if (input.expectedRole && user.role !== input.expectedRole) {
      if (input.expectedRole === Role.SELLER && (user.role === Role.SUPPORT || user.role === Role.ADMIN)) {
        throw new ForbiddenError('Access denied: Please use the Support or Admin portal to sign in.');
      }
      if (input.expectedRole === Role.ADMIN) {
        throw new ForbiddenError('Access denied: You do not have administrator privileges.');
      }
      throw new ForbiddenError(
        `Access denied: Account role '${user.role}' cannot sign in through this portal.`
      );
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      sellerStatus: user.sellerStatus,
      kycStatus: user.kycStatus,
      kycDocumentUrl: user.kycDocumentUrl,
      availableStock: user.availableStock,
      balanceOnHold: user.balanceOnHold,
      balanceAvailable: user.balanceAvailable,
      isDemoAccount: user.isDemoAccount,
      createdAt: user.createdAt,
    };

    return { user: sanitizedUser, token };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        sellerStatus: true,
        kycStatus: true,
        kycDocumentUrl: true,
        availableStock: true,
        balanceOnHold: true,
        balanceAvailable: true,
        isDemoAccount: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    if (user.sellerStatus === SellerStatus.BLOCKED) {
      throw new ForbiddenError('Your account has been blocked');
    }

    return user;
  }
}

export const authService = new AuthService();
