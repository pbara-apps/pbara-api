import { asyncHandler } from "@/helpers/async-handler";
import { getActor } from "@/helpers/request-actor";
import PortalAccountService from "@/service/portal-account";

/** Association side: church counsellor logins and the Recruitment Board. */
const ChapterAdminController = {
  // Church counsellor
  getCounsellor: asyncHandler(async (req, res) => {
    const data = await PortalAccountService.getCounsellor(req.params.id as string);
    res.status(200).json({ message: "Counsellor fetched successfully", data });
  }),

  assignCounsellor: asyncHandler(async (req, res) => {
    const data = await PortalAccountService.assignCounsellor(
      req.params.id as string,
      req.body,
      getActor(req),
    );
    res.status(200).json({ message: "Counsellor saved successfully", data });
  }),

  resendCounsellorPassword: asyncHandler(async (req, res) => {
    const data = await PortalAccountService.resendCounsellorPassword(
      req.params.id as string,
      getActor(req),
    );
    res.status(200).json({ message: "One-time password reset", data });
  }),

};

export default ChapterAdminController;
