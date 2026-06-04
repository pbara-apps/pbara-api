import DirectorDeskDao from "@/dao/director-desk";
import ExecutiveDao from "@/dao/executive";
import { hashPassword } from "@/helpers/password-hasher";
import { DirectorDeskTypes, ExecutiveTypes } from "@/types/_types";
import bcrypt from "bcryptjs";

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
  async updateExecutive(id: string, officer: ExecutiveTypes) {
    return await ExecutiveDao.updateExecutive(id, officer);
  },
  async createDirectorDesk(directorDesk: DirectorDeskTypes) {
    return await DirectorDeskDao.createDirectorDesk(directorDesk);
  },
};

export default ExecutiveService;
