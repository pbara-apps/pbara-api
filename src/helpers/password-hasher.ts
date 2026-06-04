import bcrypt from "bcryptjs";

const saltRound = Number(process.env.SALT_ROUND) || 10;
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
