import { verifyToken } from "@/helpers/jw-token";
import { NextFunction, Request, Response } from "express";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const headerAuth = req.headers.authorization;
  const token = headerAuth?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized", status: false });
  }
  try {
    const decoded = verifyToken(token);
    (req as Request & { user?: unknown }).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized", status: false });
  }
};

export default requireAuth;
