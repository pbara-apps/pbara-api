import { getAuthUser, isSuperAdmin } from "@/helpers/auth-user";
import { NextFunction, Request, Response } from "express";

/**
 * Finance access. Use after requireAuth, which re-checks the account
 * against the database, so changes to finance access apply immediately.
 *
 * - "officer": only finance officers (Financial Secretary / Treasurer).
 * - "officer_or_super_admin": finance officers or super admins.
 */
export default function requireFinance(mode: "officer" | "officer_or_super_admin") {
  return (req: Request, res: Response, next: NextFunction) => {
    const authUser = getAuthUser(req);
    if (!authUser?.id) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }
    if (authUser.isFinance || (mode === "officer_or_super_admin" && isSuperAdmin(authUser.role))) {
      return next();
    }
    return res.status(403).json({
      message:
        mode === "officer"
          ? "Only the Financial Secretary or Treasurer can do this"
          : "Only finance officers or super admins can do this",
      status: false,
    });
  };
}
