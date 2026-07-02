import ChurchModel from "@/models/church";
import { ChurchTypes } from "@/types/_types";

const ChurchDao = {
  async addChurch(church: ChurchTypes) {
    return await ChurchModel.create(church);
  },
  async addManyChurch(church: ChurchTypes) {
    return await ChurchModel.insertMany(church);
  },
  async getAllChurch() {
    return await ChurchModel.find().sort({ chapter: 1 }).exec();
  },
  async getPublicChurches() {
    return await ChurchModel.find({ status: "active" })
      .sort({ chapter: 1 })
      .exec();
  },
  async findById(id: string) {
    return await ChurchModel.findById(id).exec();
  },
  async updateChurch(id: string, church: Partial<ChurchTypes>) {
    return await ChurchModel.findByIdAndUpdate(id, church, { new: true }).exec();
  },
  async deleteChurch(id: string) {
    return await ChurchModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await ChurchModel.deleteMany({ _id: { $in: ids } }).exec();
  },
  async countAll() {
    return await ChurchModel.countDocuments().exec();
  },
  async countActive() {
    return await ChurchModel.countDocuments({ status: "active" }).exec();
  },
  async findRecent(limit = 5) {
    return await ChurchModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  },
};

export default ChurchDao;
