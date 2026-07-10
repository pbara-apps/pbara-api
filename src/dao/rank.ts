import RankModel from "@/models/rank";
import { RankTypes } from "@/types/_types";

const RankDao = {
  async createRank(rank: RankTypes) {
    return await RankModel.create(rank);
  },
  async createRankBulk(ranks: RankTypes[]) {
    return await RankModel.insertMany(ranks);
  },
  async findAll() {
    return await RankModel.find().sort({ name: 1 }).exec();
  },
  async findById(id: string) {
    return await RankModel.findById(id).exec();
  },
  async findByName(name: string) {
    return await RankModel.findOne({ name }).exec();
  },
  async updateRank(id: string, rank: Partial<RankTypes>) {
    return await RankModel.findByIdAndUpdate(id, rank, { new: true }).exec();
  },
  async deleteRank(id: string) {
    return await RankModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await RankModel.deleteMany({ _id: { $in: ids } }).exec();
  },
  async countAll() {
    return await RankModel.countDocuments().exec();
  },
};

export default RankDao;
