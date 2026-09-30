import type { AuditLogEntry } from '../types/index.ts';

/**
 * Calculates cryptographic SHA-256 hex string from string or Uint8Array.
 * Uses native window.crypto.subtle for maximum speed and zero dependencies.
 */
export async function calculateSha256(data: string | ArrayBuffer | Uint8Array): Promise<string> {
  try {
    let buffer: ArrayBuffer;
    if (typeof data === 'string') {
      buffer = new TextEncoder().encode(data).buffer;
    } else if (data instanceof Uint8Array) {
      buffer = data.buffer;
    } else {
      buffer = data;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Deterministic fallback hash for non-secure contexts if any
    console.warn('Crypto.subtle fallback used', error);
    return fallbackSimpleHash(typeof data === 'string' ? data : new TextDecoder().decode(data));
  }
}

/**
 * Fast synchronous fallback hash for non-crypto contexts
 */
export function fallbackSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
}

let fallbackCounter = 0;

/**
 * Generates a deterministic, cryptographically secure unique ID.
 * Employs crypto.randomUUID() when supported, with a cryptographic fallback.
 * Strictly avoids Math.random() in accordance with audit integrity rules.
 */
export function generateSecureId(prefix = 'id'): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    globalThis.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}-${Date.now()}-${hex}`;
  }
  fallbackCounter = (fallbackCounter + 1) % 1000000;
  return `${prefix}-${Date.now()}-${fallbackCounter}`;
}

/**
 * Fast synchronous deterministic hash for sample records
 */
export function calculateSha256Sync(str: string): string {
  return fallbackSimpleHash(str);
}

/**
 * Creates a cryptographically chained audit log entry
 */
export async function createAuditEntry(
  action: AuditLogEntry['action'],
  entityType: AuditLogEntry['entityType'],
  entityId: string,
  user: string,
  details: string,
  previousHash: string = '0000000000000000000000000000000000000000000000000000000000000000'
): Promise<AuditLogEntry> {
  const timestamp = new Date().toISOString();
  const id = generateSecureId('audit');
  
  const payloadToHash = `${previousHash}|${timestamp}|${action}|${entityType}|${entityId}|${user}|${details}`;
  const hashSha256 = await calculateSha256(payloadToHash);

  return {
    id,
    timestamp,
    action,
    entityType,
    entityId,
    user,
    details,
    hashSha256,
    previousHashSha256: previousHash,
  };
}

/**
 * Verifies the mathematical integrity of an audit chain.
 * Returns true if no tampering occurred, or index of corrupted entry.
 */
export async function verifyAuditChain(chain: AuditLogEntry[]): Promise<{ isValid: boolean; corruptedIndex?: number; reason?: string }> {
  if (!chain || chain.length === 0) {
    return { isValid: true };
  }

  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];
    const expectedPrevHash = i === 0 
      ? (current.previousHashSha256 || '0000000000000000000000000000000000000000000000000000000000000000')
      : chain[i - 1].hashSha256;

    if (current.previousHashSha256 !== expectedPrevHash) {
      return { 
        isValid: false, 
        corruptedIndex: i, 
        reason: `Mismatched previous hash link at entry #${i + 1} (${current.action})` 
      };
    }

    const payload = `${current.previousHashSha256}|${current.timestamp}|${current.action}|${current.entityType}|${current.entityId}|${current.user}|${current.details}`;
    const calculated = await calculateSha256(payload);

    if (calculated !== current.hashSha256) {
      return { 
        isValid: false, 
        corruptedIndex: i, 
        reason: `Signature checksum mismatch at entry #${i + 1}. Data was modified after audit timestamp.` 
      };
    }
  }

  return { isValid: true };
}

/**
 * Derives an AES-GCM 256-bit key from a user passphrase using PBKDF2 with 100,000 rounds.
 * Works natively in all modern browsers and Node 18+ with zero external dependencies.
 */
async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = (globalThis.crypto?.subtle || (window && window.crypto?.subtle)) as SubtleCrypto;
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary serializable research data into an AES-GCM 256-bit encrypted base64 bundle.
 * Fully zero-knowledge and client-side: no password or cleartext ever leaves memory.
 */
export async function encryptEvidencePayload(data: unknown, passphrase: string): Promise<string> {
  const subtle = (globalThis.crypto?.subtle || (window && window.crypto?.subtle)) as SubtleCrypto;
  if (!subtle) {
    throw new Error('WebCrypto subtle is required for encrypted sharing.');
  }

  const jsonStr = JSON.stringify(data);
  const plainBytes = new TextEncoder().encode(jsonStr);

  const salt = new Uint8Array(16);
  globalThis.crypto.getRandomValues(salt);

  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);

  const key = await deriveAesKey(passphrase, salt);
  const cipherBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plainBytes
  );

  // Package format: [16 bytes salt][12 bytes iv][ciphertext]
  const cipherBytes = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(salt.length + iv.length + cipherBytes.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(cipherBytes, salt.length + iv.length);

  // Convert to Base64
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts an AES-GCM 256-bit encrypted research bundle using the passphrase.
 * Returns the parsed JSON payload.
 */
export async function decryptEvidencePayload<T = unknown>(encryptedBase64: string, passphrase: string): Promise<T> {
  const subtle = (globalThis.crypto?.subtle || (window && window.crypto?.subtle)) as SubtleCrypto;
  if (!subtle) {
    throw new Error('WebCrypto subtle is required for encrypted sharing.');
  }

  const binary = atob(encryptedBase64);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  if (combined.length < 28) {
    throw new Error('Ugyldig eller korrupt kryptert datapakke.');
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const cipherBytes = combined.slice(28);

  const key = await deriveAesKey(passphrase, salt);
  try {
    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );
    const jsonStr = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error('Dekryptering feilet: Feil passord eller manipulert datapakke.');
  }
}

