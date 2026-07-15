import bcrypt from "bcryptjs";

/** bcrypt cost is 2^rounds — keep this in a practical range (10–12 is typical). */
const parsed = Number(process.env.SALT_ROUND);
const saltRound =
  Number.isFinite(parsed) && parsed >= 4 && parsed <= 15 ? parsed : 10;

export const hashPassword = async (password: string) => {
  const bcryptSalt = await bcrypt.genSalt(saltRound);
  return await bcrypt.hash(password, bcryptSalt);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
) => {
  return await bcrypt.compare(password, hashedPassword);
};
