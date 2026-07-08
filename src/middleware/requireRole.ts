import { getAuthUser, type ExecutiveRole } from "@/helpers/auth-user";
import { NextFunction, Request, Response } from "express";

export default function requireRole(allowedRoles: ExecutiveRole[]) {
  const allowed = new Set<ExecutiveRole>(allowedRoles);

  return (req: Request, res: Response, next: NextFunction) => {
    const authUser = getAuthUser(req);
    if (!authUser?.id) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    if (!allowed.has(authUser.role)) {
      return res.status(403).json({
        message: "You are not allowed to perform this action",
        status: false,
      });
    }

    return next();
  };
}
