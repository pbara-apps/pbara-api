import DirectorDeskDao from "@/dao/director-desk";
import ExecutiveDao from "@/dao/executive";
import AccountModel from "@/models/account";
import { DirectorDeskTypes, ExecutiveTypes } from "@/types/_types";

/**
 * A deleted executive's login (if any) stays, but loses the link and with
 * it finance access (only linked executives can be finance officers).
 */
async function unlinkAccounts(executiveIds: string[]) {
  await AccountModel.updateMany(
    { "admin.executive": { $in: executiveIds } },
    { $set: { "admin.executive": null, "admin.is_finance": false } },
  ).exec();
}

const ExecutiveService = {
  async createExecutive(officer: ExecutiveTypes) {
    return await ExecutiveDao.createExecutive(officer);
  },
  async getAllExecutive() {
    return await ExecutiveDao.findAll();
  },
  async getExecutiveById(id: string) {
    return await ExecutiveDao.findById(id);
  },
  async updateExecutive(id: string, officer: Partial<ExecutiveTypes>) {
    return await ExecutiveDao.updateExecutive(id, officer);
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
    await unlinkAccounts([id]);
    return await ExecutiveDao.deleteExecutive(id);
  },
  async deleteExecutives(ids: string[]) {
    await unlinkAccounts(ids);
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
