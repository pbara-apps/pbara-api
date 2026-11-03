import AssociationSettingsModel from "@/models/association-settings";
import { BankDetailsTypes } from "@/types/_types";

const KEY = "association";

/** Reads and writes the single association settings document. */
const AssociationSettingsDao = {
  async get() {
    return await AssociationSettingsModel.findOne({ key: KEY }).lean().exec();
  },
  async setPaymentAccount(account: BankDetailsTypes) {
    return await AssociationSettingsModel.findOneAndUpdate(
      { key: KEY },
      { $set: { paymentAccount: account } },
      { returnDocument: "after", upsert: true },
    )
      .lean()
      .exec();
  },
};

export default AssociationSettingsDao;
