import ExecutiveModel from "@/models/executive";
import { ExecutiveTypes } from "@/types/_types";

const ExecutiveDao = {
  async createExecutive(officer: ExecutiveTypes) {
    const created = await ExecutiveModel.create(officer);
    return await ExecutiveModel.findById(created._id)
      .populate(["church", "office"])
      .exec();
  },
  async findAll() {
    return await ExecutiveModel.find().populate(["church", "office"]).exec();
  },
  async findByEmail(email: string) {
    return await ExecutiveModel.findOne({ email }).exec();
  },
  async findByEmailForAuth(email: string) {
    return await ExecutiveModel.findOne({ email }).select("+password").exec();
  },
  async findById(id: string) {
    return await ExecutiveModel.findById(id)
      .populate(["church", "office"])
      .exec();
  },
  async updateExecutive(id: string, officer: Partial<ExecutiveTypes>) {
    return await ExecutiveModel.findByIdAndUpdate(id, officer, { new: true })
      .populate(["church", "office"])
      .exec();
  },
  async deleteExecutive(id: string) {
    return await ExecutiveModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await ExecutiveModel.deleteMany({ _id: { $in: ids } }).exec();
  },
  async findPublic() {
    return await ExecutiveModel.find({ status: "active" })
      .populate(["church", "office"])
      .sort({ start_year: -1 })
      .exec();
  },
  async countAll() {
    return await ExecutiveModel.countDocuments().exec();
  },
  async countActive() {
    return await ExecutiveModel.countDocuments({ status: "active" }).exec();
  },
  async findRecent(limit = 5) {
    return await ExecutiveModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(["church", "office"])
      .exec();
  },
  async getDirectorDesk(officeId: string) {
    return await ExecutiveModel.findOne({
      office_id: officeId,
      status: "active",
    })
      .populate(["church", "office"])
      .exec();
  },
};

export default ExecutiveDao;
