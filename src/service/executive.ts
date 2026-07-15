import DirectorDeskDao from "@/dao/director-desk";
import ExecutiveDao from "@/dao/executive";
import { hashPassword } from "@/helpers/password-hasher";
import { DirectorDeskTypes, ExecutiveTypes } from "@/types/_types";

const ExecutiveService = {
  async createExecutive(officer: ExecutiveTypes) {
    const hashedPassword = await hashPassword(officer.password);
    return await ExecutiveDao.createExecutive({
      ...officer,
      password: hashedPassword,
    });
  },
  async getAllExecutive() {
    return await ExecutiveDao.findAll();
  },
  async getExecutiveById(id: string) {
    return await ExecutiveDao.findById(id);
  },
  async updateExecutive(id: string, officer: Partial<ExecutiveTypes>) {
    const payload = { ...officer };
    if (payload.password) {
      payload.password = await hashPassword(payload.password);
    }
    return await ExecutiveDao.updateExecutive(id, payload);
  },
  async deleteExecutive(id: string) {
    const existing = await ExecutiveDao.findById(id);
    if (!existing) {
      const err = new Error("Executive not found") as Error & {
        status?: number;
      };
      err.status = 404;
      throw err;
    }
    return await ExecutiveDao.deleteExecutive(id);
  },
  async deleteExecutives(ids: string[]) {
    return await ExecutiveDao.deleteMany(ids);
  },
  async getPublicExecutives() {
    return await ExecutiveDao.findPublic();
  },
  async createDirectorDesk(directorDesk: DirectorDeskTypes) {
    return await DirectorDeskDao.createDirectorDesk(directorDesk);
  },
};

export default ExecutiveService;
