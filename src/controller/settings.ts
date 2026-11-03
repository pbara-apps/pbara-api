import { asyncHandler } from "@/helpers/async-handler";
import { getActor } from "@/helpers/request-actor";
import PaymentAccountService from "@/service/payment-account";
import SettingsService from "@/service/settings";
import { NextFunction, Request, Response } from "express";

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
  async getExecutivesWithRoles(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const executives = await SettingsService.getExecutivesWithRoles();
      return res.status(200).json({
        message: "Executives fetched successfully",
        data: executives,
      });
    } catch (error) {
      next(error);
    }
  },
  async updateExecutiveRole(req: Request, res: Response, next: NextFunction) {
    try {
      const executive = await SettingsService.updateExecutiveRole(
        req.params.id as string,
        req.body.role,
      );
      return res.status(200).json({
        message: "Executive role updated successfully",
        data: executive,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default SettingsController;
