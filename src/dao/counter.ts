import CounterModel from "@/models/counter";

const CounterDao = {
  /** Adds 1 to the named counter (creating it at 0 first) and returns the new value. */
  async next(key: string): Promise<number> {
    const counter = await CounterModel.findOneAndUpdate(
      { key },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true },
    ).exec();
    return counter.seq;
  },
};

export default CounterDao;
