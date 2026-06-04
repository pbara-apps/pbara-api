import ExecutiveDao from "@/dao/executive";
import { generateToken } from "@/helpers/jw-token";
import { verifyPassword } from "@/helpers/password-hasher";
import { LoginTypes } from "@/types/_types";

const AuthService = {
  async login(loginBody: LoginTypes) {
    const { email, password } = loginBody;
    const user = await ExecutiveDao.findByEmailForAuth(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }
    const token = generateToken({
      id: user._id,
      name: user.name,
      office: user.office_id,
      church: user.church_id,
    });

    const { password: _pw, ...safeUser } = user.toObject();
    return { user: safeUser, token };
  },
};

export default AuthService;
