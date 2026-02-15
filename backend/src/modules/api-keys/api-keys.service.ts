import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler.middleware';
import { encryptApiKey, decryptApiKey, maskApiKey } from './encryption.util';
import { CreateApiKeyInput, UpdateApiKeyInput } from './api-keys.types';
import type { AiProvider, ApiKey } from '@prisma/client';

export class ApiKeysService {
  async addKey(userId: string, input: CreateApiKeyInput) {
    // Encrypt the API key
    const encrypted = encryptApiKey(input.apiKey, userId);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        provider: input.provider as AiProvider,
        encryptedKey: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        modelName: input.modelName,
      },
    });

    return {
      id: apiKey.id,
      provider: apiKey.provider,
      modelName: apiKey.modelName,
      isActive: apiKey.isActive,
      maskedKey: maskApiKey(input.apiKey),
      createdAt: apiKey.createdAt.toISOString(),
    };
  }

  async listKeys(userId: string) {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((key: ApiKey) => {
      // Decrypt to get last 4 chars for masking
      let maskedKey = '****';
      try {
        const decrypted = decryptApiKey(
          { ciphertext: key.encryptedKey, iv: key.iv, authTag: key.authTag },
          userId
        );
        maskedKey = maskApiKey(decrypted);
      } catch {
        // If decryption fails, just show ****
      }

      return {
        id: key.id,
        provider: key.provider,
        modelName: key.modelName,
        isActive: key.isActive,
        maskedKey,
        createdAt: key.createdAt.toISOString(),
      };
    });
  }

  async updateKey(userId: string, keyId: string, input: UpdateApiKeyInput) {
    const existing = await prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!existing) {
      throw AppError.notFound('API key not found');
    }

    const updateData: Record<string, unknown> = {};

    if (input.apiKey) {
      const encrypted = encryptApiKey(input.apiKey, userId);
      updateData.encryptedKey = encrypted.ciphertext;
      updateData.iv = encrypted.iv;
      updateData.authTag = encrypted.authTag;
    }

    if (input.modelName !== undefined) {
      updateData.modelName = input.modelName;
    }

    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
    }

    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: updateData,
    });

    return {
      id: updated.id,
      provider: updated.provider,
      modelName: updated.modelName,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async deleteKey(userId: string, keyId: string) {
    const existing = await prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!existing) {
      throw AppError.notFound('API key not found');
    }

    await prisma.apiKey.delete({ where: { id: keyId } });
  }

  /**
   * Get the decrypted API key for a specific provider (internal use only).
   */
  async getDecryptedKey(userId: string, provider?: string): Promise<{ apiKey: string; modelName: string; provider: string } | null> {
    const where: Record<string, unknown> = { userId, isActive: true };
    if (provider) {
      where.provider = provider;
    }

    const key = await prisma.apiKey.findFirst({
      where: where as any,
      orderBy: { updatedAt: 'desc' },
    });

    if (!key) return null;

    const decrypted = decryptApiKey(
      { ciphertext: key.encryptedKey, iv: key.iv, authTag: key.authTag },
      userId
    );

    return {
      apiKey: decrypted,
      modelName: key.modelName,
      provider: key.provider,
    };
  }
}

export const apiKeysService = new ApiKeysService();
