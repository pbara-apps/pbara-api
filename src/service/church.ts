import ChurchDao from "@/dao/church";
import { ChurchTypes } from "@/types/_types";

const ChurchService = {
  async createChurch(church: ChurchTypes) {
    return await ChurchDao.addChurch(church);
  },
  async createBulkChurch(church: ChurchTypes) {
    return await ChurchDao.addManyChurch(church);
  },
  async getAllChurch() {
    return await ChurchDao.getAllChurch();
  },
  async getPublicChurches() {
    return await ChurchDao.getPublicChurches();
  },
  async getChurchById(id: string) {
    return await ChurchDao.findById(id);
  },
  async updateChurch(id: string, church: Partial<ChurchTypes>) {
    const existing = await ChurchDao.findById(id);
    if (!existing) {
      const err = new Error("Chapter not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return await ChurchDao.updateChurch(id, church);
  },
  async deleteChurch(id: string) {
    const existing = await ChurchDao.findById(id);
    if (!existing) {
      const err = new Error("Chapter not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return await ChurchDao.deleteChurch(id);
  },
  async deleteChurches(ids: string[]) {
    return await ChurchDao.deleteMany(ids);
  },
};

export default ChurchService;
