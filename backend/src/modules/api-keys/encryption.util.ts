import crypto from 'crypto';
import { env } from '../../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a per-user encryption key from the master key + user ID using HKDF.
 * This ensures that even if one user's key is compromised, others remain safe.
 */
function deriveKey(userId: string): Buffer {
  const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');
  return Buffer.from(crypto.hkdfSync('sha256', masterKey, userId, 'openscribe-api-keys', 32));
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypt an API key using AES-256-GCM with a per-user derived key.
 */
export function encryptApiKey(plaintext: string, userId: string): EncryptedData {
  const key = deriveKey(userId);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt an API key using AES-256-GCM with a per-user derived key.
 */
export function decryptApiKey(encrypted: EncryptedData, userId: string): string {
  const key = deriveKey(userId);
  const iv = Buffer.from(encrypted.iv, 'hex');
  const authTag = Buffer.from(encrypted.authTag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

/**
 * Mask an API key for display (show only last 4 characters).
 */
export function maskApiKey(key: string): string {
  if (key.length <= 4) return '****';
  return '****' + key.slice(-4);
}
