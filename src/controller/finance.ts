import { asyncHandler } from "@/helpers/async-handler";
import { getPortalUser } from "@/helpers/portal-auth-user";
import { getActor } from "@/helpers/request-actor";
import FinanceService from "@/service/finance";

/** Finance endpoints (admin side) and the chapter portal's dues endpoints. */
export const FinanceController = {
  createDue: asyncHandler(async (req, res) => {
    const data = await FinanceService.createDue(req.body, getActor(req));
    res.status(201).json({ message: `Due created; ${data.billsCreated} bill(s) sent`, data });
  }),
  listDues: asyncHandler(async (_req, res) => {
    res.status(200).json({ message: "Dues fetched", data: await FinanceService.listDues() });
  }),
  getDue: asyncHandler(async (req, res) => {
    res.status(200).json({ message: "Due fetched", data: await FinanceService.getDue(req.params.id as string) });
  }),
  deleteDue: asyncHandler(async (req, res) => {
    await FinanceService.deleteDue(req.params.id as string, getActor(req));
    res.status(200).json({ message: "Due deleted", data: null });
  }),
  sendReminders: asyncHandler(async (req, res) => {
    const data = await FinanceService.sendReminders(req.params.id as string);
    res.status(200).json({ message: `Reminder sent to ${data.reminded}`, data });
  }),
  adjustBill: asyncHandler(async (req, res) => {
    const data = await FinanceService.adjustBill(req.params.id as string, req.body, getActor(req));
    res.status(200).json({ message: "Bill updated", data });
  }),
  statement: asyncHandler(async (req, res) => {
    const data = await FinanceService.statement({
      chapterId: req.query.chapterId as string | undefined,
      churchId: req.query.churchId as string | undefined,
    });
    res.status(200).json({ message: "Statement fetched", data });
  }),
  listPayments: asyncHandler(async (req, res) => {
    const status = (req.query.status as "pending" | "verified" | "rejected" | undefined) ?? "pending";
    res.status(200).json({ message: "Payments fetched", data: await FinanceService.listPayments(status) });
  }),
  verifyPayment: asyncHandler(async (req, res) => {
    const data = await FinanceService.verifyPayment(req.params.id as string, getActor(req));
    res.status(200).json({ message: `Payment verified — receipt ${data.receiptNumber}`, data });
  }),
  rejectPayment: asyncHandler(async (req, res) => {
    await FinanceService.rejectPayment(req.params.id as string, req.body.note, getActor(req));
    res.status(200).json({ message: "Payment rejected", data: null });
  }),
};

export const PortalFinanceController = {
  bills: asyncHandler(async (req, res) => {
    const data = await FinanceService.portalBills(getPortalUser(req), req.query.chapterId as string | undefined);
    res.status(200).json({ message: "Bills fetched", data });
  }),
  submitPayment: asyncHandler(async (req, res) => {
    const data = await FinanceService.submitPayment(getPortalUser(req), req.body);
    res.status(201).json({ message: "Payment sent for confirmation", data });
  }),
};
