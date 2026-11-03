import { FinanceController as C } from "@/controller/finance";
import requireAuth from "@/middleware/requireAuth";
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
 * Every admin role can view; finance, admin and super_admin can act.
 */
const router = express.Router();

const canView = requireRole(["super_admin", "admin", "editor", "finance", "viewer"]);
const canManage = requireRole(["super_admin", "admin", "finance"]);

router.get("/dues", [requireAuth, canView, C.listDues]);
router.post("/dues", [requireAuth, canManage, validate(createDueSchema), C.createDue]);
router.get("/dues/:id", [requireAuth, canView, validate(dueIdSchema), C.getDue]);
router.delete("/dues/:id", [requireAuth, canManage, validate(dueIdSchema), C.deleteDue]);
router.post("/dues/:id/remind", [requireAuth, canManage, validate(dueIdSchema), C.sendReminders]);

router.patch("/bills/:id", [requireAuth, canManage, validate(adjustBillSchema), C.adjustBill]);
router.get("/statement", [requireAuth, canView, validate(statementSchema), C.statement]);

router.get("/payments", [requireAuth, canView, validate(paymentListSchema), C.listPayments]);
router.post("/payments/:id/verify", [requireAuth, canManage, validate(paymentIdSchema), C.verifyPayment]);
router.post("/payments/:id/reject", [requireAuth, canManage, validate(rejectPaymentSchema), C.rejectPayment]);

export default router;
