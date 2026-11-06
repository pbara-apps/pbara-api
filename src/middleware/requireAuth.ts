import AccountDao from "@/dao/account";
import { PASSWORD_CHANGE_REQUIRED, readAccountId } from "@/helpers/account-token";
import { setAuthUser } from "@/helpers/auth-user";
import { NextFunction, Request, Response } from "express";

/**
 * Admin portal login check.
 *
 * Re-loads the account on every request, so removed access or a changed
 * role applies immediately. Accounts without admin access (chapter-only)
 * are refused.
 */
async function loadAdmin(req: Request, res: Response, next: NextFunction, allowTempPassword: boolean) {
  const accountId = readAccountId(req);
  if (!accountId) return res.status(401).json({ message: "Unauthorized", status: false });

  try {
    const account = await AccountDao.findById(accountId);
    if (!account?.isActive || !account.admin?.active) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }
    setAuthUser(req, {
      id: String(account._id),
      name: account.name,
      role: account.admin.role,
      isFinance: Boolean(account.admin.executive && account.admin.is_finance),
      executiveId: account.admin.executive ? String(account.admin.executive) : undefined,
      hasChangedPassword: account.has_changed_password,
      aliases: (account.aliases ?? []).map(String),
    });
    if (!allowTempPassword && !account.has_changed_password) {
      return res.status(403).json(PASSWORD_CHANGE_REQUIRED);
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => loadAdmin(req, res, next, false);

/** Same as requireAuth, but lets someone with a one-time password through (profile, change password). */
export const requireAuthAllowTempPassword = (req: Request, res: Response, next: NextFunction) =>
  loadAdmin(req, res, next, true);

export default requireAuth;

/**
 * Any signed-in account, whatever its access (admin and/or chapter). Used for
 * the shared session and change-password endpoints. Sets `req.accountId`.
 */
export async function requireAccount(req: Request, res: Response, next: NextFunction) {
  const accountId = readAccountId(req);
  if (!accountId) return res.status(401).json({ message: "Unauthorized", status: false });
  try {
    const account = await AccountDao.findById(accountId);
    if (!account?.isActive) return res.status(401).json({ message: "Unauthorized", status: false });
    (req as Request & { accountId?: string }).accountId = String(account._id);
    return next();
  } catch (error) {
    return next(error);
  }
}

export const getAccountId = (req: Request) => String((req as Request & { accountId?: string }).accountId);
