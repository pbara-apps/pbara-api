import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
export const generateToken = (
  data: any,
  expiresIn: SignOptions["expiresIn"] = "72h",
) => {
  return jwt.sign({ data }, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
