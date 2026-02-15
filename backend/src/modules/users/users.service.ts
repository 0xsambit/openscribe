import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler.middleware';

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

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

  async updateProfile(userId: string, data: { name?: string; bio?: string; linkedinUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.linkedinUrl !== undefined && { linkedinUrl: data.linkedinUrl }),
      },
    });

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

  async updatePreferences(userId: string, preferences: Record<string, unknown>) {
    // Merge with existing preferences
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    const existingPrefs = (user.preferences as Record<string, unknown>) || {};
    const mergedPrefs = { ...existingPrefs, ...preferences };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { preferences: mergedPrefs as any },    
    });

    return {
      id: updated.id,
      preferences: updated.preferences,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async completeOnboarding(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
  }
}

export const usersService = new UsersService();
