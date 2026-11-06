import { ACTOR_SELECT } from "@/models/account";
import BillModel from "@/models/bill";
import DueModel from "@/models/due";
import PaymentModel from "@/models/payment";

/**
 * Database queries for dues, bills and payments.
 */

const BILL_POPULATE = [
  { path: "due", select: "title type period chargeBasis amount billTo" },
  { path: "church", select: "name" },
  { path: "chapter", select: "name" },
];

export const DueDao = {
  async create(data: Record<string, unknown>) {
    return await DueModel.create(data);
  },
  async findById(id: string) {
    return await DueModel.findById(id).exec();
  },
  async listAll() {
    return await DueModel.find().sort({ createdAt: -1 }).lean().exec();
  },
  async deleteById(id: string) {
    return await DueModel.findByIdAndDelete(id).exec();
  },
};

export const BillDao = {
  async createMany(docs: Record<string, unknown>[]) {
    if (docs.length === 0) return [];
    return await BillModel.insertMany(docs);
  },
  async findById(id: string) {
    return await BillModel.findById(id).populate(BILL_POPULATE).exec();
  },
  async findByDue(dueId: string) {
    return await BillModel.find({ due: dueId }).populate(BILL_POPULATE).sort({ createdAt: 1 }).lean().exec();
  },
  async findByDues(dueIds: string[]) {
    return await BillModel.find({ due: { $in: dueIds } }).lean().exec();
  },
  /**
   * Bills a chapter portal user can see: their chapters' bills and, for a
   * counsellor, the church's own bills.
   */
  async findForPortal(chapterIds: string[], churchId: string | null) {
    const or: Record<string, unknown>[] = [{ billTo: "chapter", chapter: { $in: chapterIds } }];
    if (churchId) or.push({ billTo: "church", church: churchId });
    return await BillModel.find({ $or: or }).populate(BILL_POPULATE).sort({ dueDate: -1 }).lean().exec();
  },
  /** All bills for one chapter or one church (statement). */
  async findForStatement(filter: { chapterId?: string; churchId?: string }) {
    const query: Record<string, unknown> = filter.chapterId
      ? { billTo: "chapter", chapter: filter.chapterId }
      : { billTo: "church", church: filter.churchId };
    return await BillModel.find(query).populate(BILL_POPULATE).sort({ dueDate: 1 }).lean().exec();
  },
  async update(id: string, data: Record<string, unknown>) {
    return await BillModel.findByIdAndUpdate(id, data, { returnDocument: "after" }).exec();
  },
  async addToPaid(id: string, amount: number) {
    return await BillModel.findByIdAndUpdate(id, { $inc: { amountPaid: amount } }, { returnDocument: "after" }).exec();
  },
  async deleteByDue(dueId: string) {
    return await BillModel.deleteMany({ due: dueId }).exec();
  },
};

export const PaymentDao = {
  async create(data: Record<string, unknown>) {
    return await PaymentModel.create(data);
  },
  async findById(id: string) {
    return await PaymentModel.findById(id).exec();
  },
  async findByBills(billIds: string[]) {
    return await PaymentModel.find({ bill: { $in: billIds } })
      .populate("submittedBy", ACTOR_SELECT)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  },
  /** Payments waiting for (or past) verification, with their bill details. */
  async listByStatus(status: "pending" | "verified" | "rejected") {
    return await PaymentModel.find({ status })
      .populate({ path: "bill", populate: BILL_POPULATE })
      .populate("submittedBy", `${ACTOR_SELECT} phone`)
      .sort({ createdAt: status === "pending" ? 1 : -1 })
      .limit(500)
      .lean()
      .exec();
  },
  async countByDue(billIds: string[]) {
    return await PaymentModel.countDocuments({ bill: { $in: billIds } }).exec();
  },
  async update(id: string, data: Record<string, unknown>) {
    return await PaymentModel.findByIdAndUpdate(id, data, { returnDocument: "after" }).exec();
  },
};
