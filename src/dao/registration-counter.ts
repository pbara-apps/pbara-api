import RegistrationCounterModel from "@/models/registration-counter";

const RegistrationCounterDao = {
  async nextSerial(programId: string, count = 1) {
    const updated = await RegistrationCounterModel.findOneAndUpdate(
      { programId },
      { $inc: { seq: count } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    const end = updated?.seq ?? count;
    const start = end - count + 1;
    return { start, end };
  },
};

export default RegistrationCounterDao;
