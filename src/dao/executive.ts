import ExecutiveModel from "@/models/executive";
import { ExecutiveTypes } from "@/types/_types";

const POPULATE_FIELDS = ["church", "office", "rank"] as const;

/**
 * Old login fields that may still be on executive records from before
 * accounts existed. Never return them (the public site reads executives).
 */
const HIDDEN = "-password -role -is_finance";

const ExecutiveDao = {
  async createExecutive(officer: ExecutiveTypes) {
    const created = await ExecutiveModel.create(officer);
    return await ExecutiveModel.findById(created._id)
      .select(HIDDEN)
      .populate([...POPULATE_FIELDS])
      .exec();
  },
  async findAll() {
    return await ExecutiveModel.find()
      .select(HIDDEN).populate([...POPULATE_FIELDS]).exec();
  },
  async findByEmail(email: string) {
    return await ExecutiveModel.findOne({ email })
      .select(HIDDEN).exec();
  },
  async findById(id: string) {
    return await ExecutiveModel.findById(id)
      .select(HIDDEN)
      .populate([...POPULATE_FIELDS])
      .exec();
  },
  async updateExecutive(id: string, officer: Partial<ExecutiveTypes>) {
    return await ExecutiveModel.findByIdAndUpdate(id, officer, { returnDocument: "after" })
      .select(HIDDEN)
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
      .select(HIDDEN)
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
      .select(HIDDEN)
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
      .select(HIDDEN)
      .populate([...POPULATE_FIELDS])
      .exec();
  },
};

export default ExecutiveDao;
