/**
 * Password-protected post unlock helper.
 *
 * Persists the visitor's password as an HTTP-only, AES-256-GCM-encrypted
 * cookie scoped per-post. On every render the post route decrypts the
 * cookie and re-calls `POST /content/post/slug/:slug/access` to fetch
 * the unredacted body — meaning the password itself is the proof of
 * unlock, never a separate signed token. Backend already
 * timing-safe-compares the password, so a leaked cookie value buys the
 * attacker only what knowing-the-password would have anyway.
 *
 * The cookie is namespaced by post id (`pw_<postId>`), so unlocking
 * one post does not implicitly unlock siblings.
 */
import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32; // AES-256
const IV_LEN = 12; // GCM standard
const TAG_LEN = 16;
const COOKIE_PREFIX = "pw_";
// 8h is long enough that a reader on a multi-post visit doesn't keep
// hitting the gate, short enough that a stolen device session lapses
// the same day. Adjust via env if needed later.
export const UNLOCK_COOKIE_MAX_AGE = 60 * 60 * 8;

/**
 * Derive a stable 32-byte key from POST_UNLOCK_SECRET so the secret
 * itself can be any printable string (env-var friendly).
 */
function getKey(): Buffer {
  const secret = process.env.POST_UNLOCK_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "POST_UNLOCK_SECRET must be set to at least 16 characters to enable password-protected post unlock",
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function cookieNameFor(postId: string): string {
  return `${COOKIE_PREFIX}${postId}`;
}

/**
 * Encrypt the visitor's password for storage in the unlock cookie.
 * Output is `base64(iv | tag | ciphertext)` so we keep a single
 * opaque cookie value.
 */
export function encryptPassword(password: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

/**
 * Inverse of `encryptPassword`. Returns `null` on any decode/auth
 * failure so the caller can treat a tampered or expired cookie the
 * same as a missing one (re-show the gate).
 */
export function decryptPassword(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const buf = Buffer.from(value, "base64url");
    if (buf.length < IV_LEN + TAG_LEN + 1) return null;
    const key = getKey();
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}
