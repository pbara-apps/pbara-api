import { asyncHandler } from "@/helpers/async-handler";
import { getActor } from "@/helpers/request-actor";
import PaymentAccountService from "@/service/payment-account";

const SettingsController = {
  /** The association bank account (public: shown wherever people pay). */
  getPaymentAccount: asyncHandler(async (_req, res) => {
    const data = await PaymentAccountService.get();
    res.status(200).json({ message: "Payment account fetched", data });
  }),
  updatePaymentAccount: asyncHandler(async (req, res) => {
    const data = await PaymentAccountService.update(req.body, getActor(req));
    res.status(200).json({ message: "Payment account saved", data });
  }),
};

export default SettingsController;
