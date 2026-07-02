import OfficeModel from "@/models/offices";

interface Office {
  name?: string;
  description?: string;
}

const OfficeDao = {
  async createOffice(office: Office) {
    return await OfficeModel.create(office);
  },
  async createOfficeBulk(offices: Office[]) {
    return await OfficeModel.insertMany(offices);
  },
  async findAll() {
    return await OfficeModel.find().exec();
  },
  async findById(id: string) {
    return await OfficeModel.findById(id).exec();
  },
  async updateOffice(id: string, office: Office) {
    return await OfficeModel.findByIdAndUpdate(id, office, { new: true }).exec();
  },
  async deleteOffice(id: string) {
    return await OfficeModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await OfficeModel.deleteMany({ _id: { $in: ids } }).exec();
  },
  async countAll() {
    return await OfficeModel.countDocuments().exec();
  },
  async findByName(name: string) {
    return await OfficeModel.findOne({ name }).exec();
  },
};

export default OfficeDao;
