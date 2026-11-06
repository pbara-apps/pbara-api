import { asyncHandler } from "@/helpers/async-handler";
import { getActor } from "@/helpers/request-actor";
import AccountService from "@/service/account";

/** Admin logins, managed by super admins. */
const AccountController = {
  listAdmins: asyncHandler(async (_req, res) => {
    const data = await AccountService.listAdminAccounts();
    res.status(200).json({ message: "Accounts fetched", data });
  }),
  executivesWithoutAccount: asyncHandler(async (_req, res) => {
    const data = await AccountService.listExecutivesWithoutAccount();
    res.status(200).json({ message: "Executives fetched", data });
  }),
  createAdmin: asyncHandler(async (req, res) => {
    const data = await AccountService.createAdminAccount(req.body, getActor(req));
    res.status(201).json({
      message: data.created ? "Account created and login details sent" : "Admin access added to the existing account",
      data,
    });
  }),
  updateAdmin: asyncHandler(async (req, res) => {
    const data = await AccountService.updateAdminAccess(req.params.id as string, req.body, getActor(req));
    res.status(200).json({ message: "Account updated", data });
  }),
  resendPassword: asyncHandler(async (req, res) => {
    const data = await AccountService.resendAdminPassword(req.params.id as string, getActor(req));
    res.status(200).json({ message: "One-time password sent", data });
  }),
};

export default AccountController;
