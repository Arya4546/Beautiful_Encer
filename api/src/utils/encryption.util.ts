import crypto from 'crypto';

/**
 * Encryption utility for securely storing sensitive data like access tokens
 * Uses AES-256-GCM encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  return key;
}

/**
 * Derive a key from the encryption key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  const encryptionKey = getEncryptionKey();
  return crypto.pbkdf2Sync(encryptionKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a string value
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:encrypted:tag (all base64 encoded)
 */
export function encrypt(text: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, encrypted data, and tag
    return `${salt.toString('base64')}:${iv.toString('base64')}:${encrypted}:${tag.toString('base64')}`;
  } catch (error) {
    console.error('[Encryption] Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string
 * @param encryptedData - Encrypted string in format: salt:iv:encrypted:tag
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const salt = Buffer.from(parts[0], 'base64');
    const iv = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    const tag = Buffer.from(parts[3], 'base64');
    
    const key = deriveKey(salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash a value using SHA-256 (one-way, for comparison purposes)
 * @param text - Text to hash
 * @returns Hashed value in hex format
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
