import ExecutiveModel from "@/models/executive";
import { ExecutiveTypes } from "@/types/_types";

const ExecutiveDao = {
  async createExecutive(officer: ExecutiveTypes) {
    return await ExecutiveModel.create(officer);
  },
  async findAll() {
    return await ExecutiveModel.find()
      .populate(["church_id", "office_id"])
      .exec();
  },
  async findByEmail(email: string) {
    return await ExecutiveModel.findOne({ email }).exec();
  },
  async findByEmailForAuth(email: string) {
    return await ExecutiveModel.findOne({ email }).select("+password").exec();
  },
  async findById(id: string) {
    return await ExecutiveModel.findById(id)
      .populate(["church_id", "office_id"])
      .exec();
  },
  async updateExecutive(id: string, officer: ExecutiveTypes) {
    await ExecutiveModel.findByIdAndUpdate(id, officer, { new: true }).exec();
  },
  async deleteExecutive(id: string) {
    await ExecutiveModel.findByIdAndDelete(id).exec();
  },
};

export default ExecutiveDao;
