import { verifyToken } from "@/helpers/jw-token";
import { NextFunction, Request, Response } from "express";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  next();
  // const headerAuth = req.headers.authorization;
  // const token = headerAuth?.split(" ")[1];
  // if (!token) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }
  // try {
  //   const decoded = verifyToken(token);
  //   (req as any).user = decoded;
  //   next();
  // } catch (error) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }
};

export default requireAuth;
