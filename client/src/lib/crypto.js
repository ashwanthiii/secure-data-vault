// Client-side authenticated encryption via the Web Crypto API.
// If crypto.subtle is unavailable, these helpers throw instead of pretending the file is protected.
function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateAccessCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint8Array(8));
  const code = Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
  return formatAccessCode(code);
}

export function normalizeAccessCode(value) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8);
}

export function formatAccessCode(value) {
  const normalized = normalizeAccessCode(value);
  return normalized.length > 4 ? `${normalized.slice(0, 4)}-${normalized.slice(4)}` : normalized;
}

export async function encryptFile(file) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure file processing is not available in this browser.');
  }

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

  const packed = new Uint8Array(4 + iv.length + ciphertext.byteLength);
  packed.set([0x53, 0x46, 0x54, 0x31]);
  packed.set(iv, 4);
  packed.set(new Uint8Array(ciphertext), 16);

  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return {
    blob: new Blob([packed], { type: 'application/octet-stream' }),
    fileKeyB64: bytesToBase64(rawKey),
  };
}

export async function decryptFile(packedBuffer, fileKeyB64) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Unable to open this file. The file may be invalid or unavailable.');
  }

  const packed = new Uint8Array(packedBuffer);
  if (packed.length < 32 || packed[0] !== 0x53 || packed[1] !== 0x46 || packed[2] !== 0x54 || packed[3] !== 0x31) {
    throw new Error('Unable to open this file. The file may be invalid or unavailable.');
  }

  const iv = packed.subarray(4, 16);
  const ciphertext = packed.subarray(16);
  const binary = atob(fileKeyB64);
  const rawKey = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) rawKey[i] = binary.charCodeAt(i);

  const key = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['decrypt']);
  try {
    return await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  } catch {
    throw new Error('Unable to open this file. The file may be invalid or unavailable.');
  }
}

export function extractShareToken(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value, window.location.origin);
    const parts = url.pathname.split('/').filter(Boolean);
    const shareIndex = parts.indexOf('share');
    if (shareIndex >= 0 && parts[shareIndex + 1]) {
      return decodeURIComponent(parts[shareIndex + 1]);
    }
  } catch {
    // Not a full URL; treat the whole value as a token.
  }
  const match = value.match(/share\/([^/?#]+)/i);
  if (match) return decodeURIComponent(match[1]);
  return value;
}
