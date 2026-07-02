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
  async getOfficeById(id: string) {
    return await OfficeDao.findById(id);
  },
  async updateOffice(id: string, office: OfficeTypes) {
    const existing = await OfficeDao.findById(id);
    if (!existing) {
      const err = new Error("Office not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return await OfficeDao.updateOffice(id, office);
  },
  async deleteOffice(id: string) {
    const existing = await OfficeDao.findById(id);
    if (!existing) {
      const err = new Error("Office not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return await OfficeDao.deleteOffice(id);
  },
  async deleteOffices(ids: string[]) {
    return await OfficeDao.deleteMany(ids);
  },
};

export default OfficeService;
