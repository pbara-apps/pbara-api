import ExecutiveDao from "@/dao/executive";
import { generateToken } from "@/helpers/jw-token";
import { hashPassword, verifyPassword } from "@/helpers/password-hasher";
import { LoginTypes } from "@/types/_types";

type ProfileUpdatePayload = {
  image?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  description?: string;
  password?: string;
};

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
      role: user.role ?? "admin",
    });

    const { password: _pw, ...safeUser } = user.toObject();
    return { user: safeUser, token };
  },

  async getProfile(executiveId: string) {
    const user = await ExecutiveDao.findById(executiveId);
    if (!user) {
      const error = new Error("Profile not found") as Error & {
        status?: number;
      };
      error.status = 404;
      throw error;
    }
    const { password: _pw, ...safeUser } = user.toObject();
    return safeUser;
  },

  async updateProfile(executiveId: string, payload: ProfileUpdatePayload) {
    const user = await ExecutiveDao.findById(executiveId);
    if (!user) {
      const error = new Error("Profile not found") as Error & {
        status?: number;
      };
      error.status = 404;
      throw error;
    }

    const updatePayload: Record<string, unknown> = {};

    if (payload.name !== undefined) updatePayload.name = payload.name;
    if (payload.phone !== undefined) updatePayload.phone = payload.phone;
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.description !== undefined) {
      updatePayload.description = payload.description;
    }
    if (payload.image !== undefined) {
      updatePayload.image = payload.image ?? null;
    }
    if (payload.email !== undefined) {
      updatePayload.email = payload.email.trim() || null;
    }
    if (payload.password) {
      updatePayload.password = await hashPassword(payload.password);
    }

    const updated = await ExecutiveDao.updateExecutive(
      executiveId,
      updatePayload,
    );
    if (!updated) {
      const error = new Error("Unable to update profile") as Error & {
        status?: number;
      };
      error.status = 500;
      throw error;
    }

    const { password: _pw, ...safeUser } = updated.toObject();
    return safeUser;
  },
};

export default AuthService;
