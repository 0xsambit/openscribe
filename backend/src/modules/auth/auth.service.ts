import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler.middleware';
import { RegisterInput, LoginInput } from './auth.types';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './jwt.util';

const BCRYPT_ROUNDS = 12;

export class AuthService {
  async register(input: RegisterInput) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw AppError.conflict('A user with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(input: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Compare password
    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokenPair(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshToken(refreshTokenValue: string) {
    // Verify the refresh token JWT
    let payload;
    try {
      payload = await verifyRefreshToken(refreshTokenValue);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    // Find the stored refresh token
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenValue)
      .digest('hex');

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: payload.sub,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw AppError.unauthorized('Refresh token has been revoked or expired');
    }

    // Delete the used refresh token (single-use / rotation)
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    // Generate new token pair
    const tokens = await this.generateTokenPair(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async logout(refreshTokenValue: string, userId: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenValue)
      .digest('hex');

    // Delete the specific refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        tokenHash,
        userId,
      },
    });
  }

  async logoutAll(userId: string) {
    // Revoke all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  // --- Private helpers ---

  private async generateTokenPair(userId: string, email: string) {
    const accessToken = await generateAccessToken({ sub: userId, email });
    const refreshTokenValue = await generateRefreshToken({ sub: userId, email });

    // Store refresh token hash in database
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenValue)
      .digest('hex');

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string;
    bio: string | null;
    linkedinUrl: string | null;
    onboardingCompleted: boolean;
    preferences: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      linkedinUrl: user.linkedinUrl,
      onboardingCompleted: user.onboardingCompleted,
      preferences: user.preferences,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

export const authService = new AuthService();
