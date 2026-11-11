import type { ClientSession } from "mongoose";
import CounterModel from "@/models/counter";

const CounterDao = {
  /** Adds 1 to the named counter (creating it at 0 first) and returns the new value. */
  async next(key: string, session?: ClientSession): Promise<number> {
    return (await CounterDao.reserve(key, 1, session)).first;
  },
  /**
   * Reserves `count` numbers in one atomic step and returns the first one.
   * The caller owns first … first + count - 1. Inside a transaction the
   * numbers are given back if it aborts, so no gaps are left.
   */
  async reserve(key: string, count: number, session?: ClientSession): Promise<{ first: number }> {
    const counter = await CounterModel.findOneAndUpdate(
      { key },
      { $inc: { seq: count } },
      { returnDocument: "after", upsert: true, session },
    ).exec();
    return { first: counter.seq - count + 1 };
  },
};

export default CounterDao;
