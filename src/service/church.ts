import ChurchDao from "@/dao/church";
import { ChurchTypes } from "@/types/_types";

const ChurchService = {
  async createChurch(church: ChurchTypes) {
    return await ChurchDao.addChurch(church);
  },
  async createBulkChurch(church: ChurchTypes) {
    return await ChurchDao.addManyChurch(church);
  },
  async getAllChurch() {
    return await ChurchDao.getAllChurch();
  },
};

export default ChurchService;
