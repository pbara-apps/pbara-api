import RankDao from "@/dao/rank";
import { RankTypes } from "@/types/_types";

const RankService = {
  async createRank(rank: RankTypes) {
    return await RankDao.createRank(rank);
  },
  async createRankBulk(ranks: RankTypes[]) {
    return await RankDao.createRankBulk(ranks);
  },
  async getAllRanks() {
    return await RankDao.findAll();
  },
  async getRankById(id: string) {
    return await RankDao.findById(id);
  },
  async updateRank(id: string, rank: Partial<RankTypes>) {
    const existing = await RankDao.findById(id);
    if (!existing) {
      const err = new Error("Rank not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return await RankDao.updateRank(id, rank);
  },
  async deleteRank(id: string) {
    const existing = await RankDao.findById(id);
    if (!existing) {
      const err = new Error("Rank not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return await RankDao.deleteRank(id);
  },
  async deleteRanks(ids: string[]) {
    return await RankDao.deleteMany(ids);
  },
};

export default RankService;
