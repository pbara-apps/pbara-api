import PatronModel from "@/models/patron";
import { PatronTypes } from "@/types/_types";

const PatronDao = {
  async create(patron: PatronTypes) {
    return await PatronModel.create(patron);
  },
  async findAll() {
    return await PatronModel.find()
      .sort({ sort_order: 1, createdAt: -1 })
      .exec();
  },
  async findPublic() {
    return await PatronModel.find({ status: "active" })
      .sort({ sort_order: 1, createdAt: -1 })
      .exec();
  },
  async findById(id: string) {
    return await PatronModel.findById(id).exec();
  },
  async update(id: string, patron: Partial<PatronTypes>) {
    return await PatronModel.findByIdAndUpdate(id, patron, { new: true }).exec();
  },
  async delete(id: string) {
    return await PatronModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await PatronModel.deleteMany({ _id: { $in: ids } }).exec();
  },
};

export default PatronDao;
