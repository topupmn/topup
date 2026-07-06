import crypto from "crypto";

export function createGuestAccessToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashGuestAccessToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyGuestAccessToken(token: string, hash: string | null) {
  if (!hash) return false;
  const tokenHash = hashGuestAccessToken(token);
  const tokenBuffer = Buffer.from(tokenHash, "hex");
  const hashBuffer = Buffer.from(hash, "hex");

  if (tokenBuffer.length !== hashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, hashBuffer);
}
