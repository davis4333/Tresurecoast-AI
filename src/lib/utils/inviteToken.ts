import { randomBytes } from "crypto";

const INVITE_TOKEN_PREFIX = "inv_";
const INVITE_TOKEN_PATTERN = /^inv_[0-9a-f]{32}$/;

export function generateInviteToken(): string {
  const hex = randomBytes(16).toString("hex");
  return `${INVITE_TOKEN_PREFIX}${hex}`;
}

export function isValidInviteTokenFormat(token: string): boolean {
  return INVITE_TOKEN_PATTERN.test(token);
}

export function getInviteExpiry(days: number): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

export function isInviteExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
