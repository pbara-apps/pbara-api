import { verifyToken } from "@/helpers/jw-token";
import { PORTAL_TOKEN_KIND } from "@/helpers/portal-auth-user";
import { NextFunction, Request, Response } from "express";

/**
 * Association (admin) login check.
 * Chapter portal tokens are refused here, so chapter officers can never
 * reach admin-only routes even where a route only checks "logged in".
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const headerAuth = req.headers.authorization;
  const token = headerAuth?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized", status: false });
  }
  try {
    const decoded = verifyToken(token) as { data?: { kind?: string } };
    if (decoded?.data?.kind === PORTAL_TOKEN_KIND) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }
    (req as Request & { user?: unknown }).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized", status: false });
  }
};

export default requireAuth;
