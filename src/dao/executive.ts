import type { ExecutiveRole } from "@/helpers/auth-user";
import ExecutiveModel from "@/models/executive";
import { ExecutiveTypes } from "@/types/_types";

const POPULATE_FIELDS = ["church", "office", "rank"] as const;

const ExecutiveDao = {
  async createExecutive(officer: ExecutiveTypes) {
    const created = await ExecutiveModel.create(officer);
    return await ExecutiveModel.findById(created._id)
      .populate([...POPULATE_FIELDS])
      .exec();
  },
  /** Ids of every executive with the given role (e.g. all super admins). */
  async findIdsByRole(role: ExecutiveRole) {
    const docs = await ExecutiveModel.find({ role }).select("_id").lean().exec();
    return docs.map((d) => String(d._id));
  },
  async findAll() {
    return await ExecutiveModel.find().populate([...POPULATE_FIELDS]).exec();
  },
  async findByEmail(email: string) {
    return await ExecutiveModel.findOne({ email }).exec();
  },
  async findByEmailForAuth(email: string) {
    return await ExecutiveModel.findOne({ email })
      .select("+password")
      .populate([...POPULATE_FIELDS])
      .exec();
  },
  async findById(id: string) {
    return await ExecutiveModel.findById(id)
      .populate([...POPULATE_FIELDS])
      .exec();
  },
  async updateExecutive(id: string, officer: Partial<ExecutiveTypes>) {
    return await ExecutiveModel.findByIdAndUpdate(id, officer, { returnDocument: "after" })
      .populate([...POPULATE_FIELDS])
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
      .populate([...POPULATE_FIELDS])
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
      .populate([...POPULATE_FIELDS])
      .exec();
  },
  async getDirectorDesk(officeId: string) {
    return await ExecutiveModel.findOne({
      office_id: officeId,
      status: "active",
    })
      .populate([...POPULATE_FIELDS])
      .exec();
  },
};

export default ExecutiveDao;
