import RegistrationProgramModel from "@/models/registration-program";
import { RegistrationProgramTypes } from "@/types/_types";

type ProgramPayload = Partial<RegistrationProgramTypes> & {
  registrationDeadline?: Date | string | null;
};

const RegistrationProgramDao = {
  async create(data: ProgramPayload) {
    return await RegistrationProgramModel.create(data);
  },
  async findAll() {
    return await RegistrationProgramModel.find()
      .sort({ createdAt: -1 })
      .exec();
  },
  async findActive() {
    return await RegistrationProgramModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  },
  async findById(id: string) {
    return await RegistrationProgramModel.findById(id).exec();
  },
  async findBySlug(slug: string) {
    return await RegistrationProgramModel.findOne({ slug }).exec();
  },
  async findActiveBySlug(slug: string) {
    return await RegistrationProgramModel.findOne({
      slug,
      isActive: true,
    }).exec();
  },
  async findIdsByCategory(category: string) {
    const programs = await RegistrationProgramModel.find({ category })
      .select("_id")
      .exec();
    return programs.map((p) => p._id);
  },
  async update(id: string, data: ProgramPayload) {
    return await RegistrationProgramModel.findByIdAndUpdate(id, data, {
      new: true,
    }).exec();
  },
  async deactivate(id: string) {
    return await RegistrationProgramModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    ).exec();
  },
};

export default RegistrationProgramDao;
