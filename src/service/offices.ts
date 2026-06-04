import OfficeDao from "@/dao/offices";
import { OfficeTypes } from "@/types/_types";

const OfficeService = {
  async createOffice(office: OfficeTypes) {
    return await OfficeDao.createOffice(office);
  },
  async createOfficeBulk(offices: OfficeTypes[]) {
    return await OfficeDao.createOfficeBulk(offices);
  },
  async getAllOffice() {
    return await OfficeDao.findAll();
  },
  async updateOffice(id: string, office: OfficeTypes) {
    return await OfficeDao.updateOffice(id, office);
  },
  async deleteOffice(id: string) {
    return await OfficeDao.deleteOffice(id);
  },
};

export default OfficeService;
