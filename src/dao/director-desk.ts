import DirectorDeskModel from "@/models/director-desk";
import { DirectorDeskTypes } from "@/types/_types";

const DirectorDeskDao = {
  async createDirectorDesk(directorDesk: DirectorDeskTypes) {
    return await DirectorDeskModel.create(directorDesk);
  },
  async getActiveDirectorDesk() {
    return await DirectorDeskModel.find({ current: true })
      .populate("director_id")
      .exec();
  },
  async getDirectorDesk(directorId: string) {
    return await DirectorDeskModel.find({ director_id: directorId })
      .populate("director_id")
      .exec();
  },
  async updateDirectorDesk(
    directorId: string,
    directorDesk: DirectorDeskTypes,
  ) {
    return await DirectorDeskModel.findByIdAndUpdate(directorId, directorDesk, {
      new: true,
    });
  },
};

export default DirectorDeskDao;
