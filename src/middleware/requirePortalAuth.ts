import PortalUserDao from "@/dao/portal-user";
import { PASSWORD_CHANGE_REQUIRED, readAccountId } from "@/helpers/account-token";
import { getPortalUser, setPortalUser } from "@/helpers/portal-auth-user";
import type { PortalRole } from "@/models/portal-user";
import { NextFunction, Request, Response } from "express";

/**
 * Chapter portal login check.
 *
 * Accepts the shared account token, then reloads the account so that a
 * replaced or removed officer loses access immediately, not when their
 * token expires. Accounts without active chapter access are refused.
 */
export async function requirePortalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = readAccountId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized", status: false });
  }

  try {
    const user = await PortalUserDao.findById(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }
    setPortalUser(req, {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role as PortalRole,
      churchId: String(user.church),
      chapterId: user.chapter ? String(user.chapter) : null,
      hasChangedPassword: user.has_changed_password,
      aliases: user.aliases,
    });
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Blocks the portal until the one-time password has been replaced.
 * The portal app reacts to code PASSWORD_CHANGE_REQUIRED by showing
 * the change-password screen.
 */
export function requirePasswordChanged(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!getPortalUser(req).hasChangedPassword) {
    return res.status(403).json(PASSWORD_CHANGE_REQUIRED);
  }
  return next();
}

/** Allows only the given portal roles, e.g. requirePortalRole(["counsellor"]). */
export function requirePortalRole(roles: PortalRole[]) {
  const allowed = new Set(roles);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowed.has(getPortalUser(req).role)) {
      return res.status(403).json({
        message: "You are not allowed to perform this action",
        status: false,
      });
    }
    return next();
  };
}
