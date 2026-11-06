import { getAuthUser, isSuperAdmin } from "@/helpers/auth-user";
import { NextFunction, Request, Response } from "express";

/** Use after requireAuth (which re-checks the role against the database). */
const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authUser = getAuthUser(req);
  if (!authUser?.id) {
    return res.status(401).json({ message: "Unauthorized", status: false });
  }
  if (isSuperAdmin(authUser.role)) return next();
  return res.status(403).json({
    message: "Only super admins can perform this action",
    status: false,
  });
};

export default requireSuperAdmin;
