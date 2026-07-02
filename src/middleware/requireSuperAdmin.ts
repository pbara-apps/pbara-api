import ExecutiveDao from "@/dao/executive";
import { getAuthUser, isSuperAdmin } from "@/helpers/auth-user";
import { NextFunction, Request, Response } from "express";

const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authUser = getAuthUser(req);
  if (!authUser?.id) {
    return res.status(401).json({ message: "Unauthorized", status: false });
  }

  if (isSuperAdmin(authUser.role)) {
    return next();
  }

  const executive = await ExecutiveDao.findById(authUser.id);
  if (executive && isSuperAdmin(executive.role)) {
    return next();
  }

  return res.status(403).json({
    message: "Only super admins can perform this action",
    status: false,
  });
};

export default requireSuperAdmin;
