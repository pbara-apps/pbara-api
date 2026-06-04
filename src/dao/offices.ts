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
  async updateOffice(id: string, office: Office) {
    return await OfficeModel.updateOne({ _id: id }, office).exec();
  },
  async deleteOffice(id: string) {
    await OfficeModel.findByIdAndDelete(id).exec();
  },
};

export default OfficeDao;
