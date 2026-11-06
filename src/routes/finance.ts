import { FinanceController as C } from "@/controller/finance";
import requireAuth from "@/middleware/requireAuth";
import requireFinance from "@/middleware/requireFinance";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import {
  adjustBillSchema,
  createDueSchema,
  dueIdSchema,
  paymentIdSchema,
  paymentListSchema,
  rejectPaymentSchema,
  statementSchema,
} from "@/schema/finance";
import express from "express";

/**
 * Dues, levies and payment verification. Mounted at /finance.
 * Every admin role can view. Finance officers (is_finance) and super admins
 * manage dues and bills; only finance officers verify or reject payments.
 */
const router = express.Router();

const canView = requireRole(["super_admin", "admin", "editor", "finance", "viewer"]);
const canManage = requireFinance("officer_or_super_admin");
const canApprove = requireFinance("officer");

router.get("/dues", [requireAuth, canView, C.listDues]);
router.post("/dues", [requireAuth, canManage, validate(createDueSchema), C.createDue]);
router.get("/dues/:id", [requireAuth, canView, validate(dueIdSchema), C.getDue]);
router.delete("/dues/:id", [requireAuth, canManage, validate(dueIdSchema), C.deleteDue]);
router.post("/dues/:id/remind", [requireAuth, canManage, validate(dueIdSchema), C.sendReminders]);

router.patch("/bills/:id", [requireAuth, canManage, validate(adjustBillSchema), C.adjustBill]);
router.get("/statement", [requireAuth, canView, validate(statementSchema), C.statement]);

router.get("/payments", [requireAuth, canView, validate(paymentListSchema), C.listPayments]);
router.post("/payments/:id/verify", [requireAuth, canApprove, validate(paymentIdSchema), C.verifyPayment]);
router.post("/payments/:id/reject", [requireAuth, canApprove, validate(rejectPaymentSchema), C.rejectPayment]);

export default router;
