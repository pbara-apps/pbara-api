import { generateToken, verifyToken } from "@/helpers/jw-token";
import { Request } from "express";

/**
 * One token per signed-in account, accepted by both the admin and chapter
 * APIs. Each API re-loads the account and checks it has that kind of access.
 * Tokens from before the shared Account model (other `kind`s) are refused.
 */
export const ACCOUNT_TOKEN_KIND = "account";

export function issueAccountToken(account: { id: string; name: string }, hasAdminAccess: boolean) {
  return generateToken(
    { id: account.id, name: account.name, kind: ACCOUNT_TOKEN_KIND },
    hasAdminAccess ? "72h" : "12h",
  );
}

/** The account id in the request's bearer token, or null if missing/invalid. */
export function readAccountId(req: Request): string | null {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const decoded = verifyToken(token) as { data?: { kind?: string; id?: string } };
    if (decoded?.data?.kind !== ACCOUNT_TOKEN_KIND || !decoded.data.id) return null;
    return String(decoded.data.id);
  } catch {
    return null;
  }
}

export const PASSWORD_CHANGE_REQUIRED = {
  message: "Please change your one-time password to continue",
  code: "PASSWORD_CHANGE_REQUIRED",
  status: false,
} as const;
