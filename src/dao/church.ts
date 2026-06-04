import ChurchModel from "@/models/church";
import { ChurchTypes } from "@/types/_types";

const ChurchDao = {
  async addChurch(church: ChurchTypes) {
    return await ChurchModel.create(church);
  },
  async addManyChurch(church: ChurchTypes) {
    return await ChurchModel.insertMany(church);
  },
  async getAllChurch() {
    return await ChurchModel.find().exec();
  },
};

export default ChurchDao;
