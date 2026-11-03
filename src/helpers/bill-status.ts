/**
 * The status of a bill, worked out from its numbers (never stored, so it
 * can't go stale). Checked in this order:
 *   waived → paid → awaiting verification → part paid → overdue → unpaid
 */
export type BillStatus = "waived" | "paid" | "awaiting_verification" | "part_paid" | "overdue" | "unpaid";

export function billStatus(
  bill: { waived?: boolean; amountDue: number; amountPaid: number; dueDate: Date },
  hasPendingPayment: boolean,
  now = new Date(),
): BillStatus {
  if (bill.waived) return "waived";
  if (bill.amountPaid >= bill.amountDue) return "paid";
  if (hasPendingPayment) return "awaiting_verification";
  if (bill.amountPaid > 0) return "part_paid";
  if (new Date(bill.dueDate) < now) return "overdue";
  return "unpaid";
}

/** What is still owed (never below zero; nothing is owed on a waived bill). */
export function billBalance(bill: { waived?: boolean; amountDue: number; amountPaid: number }) {
  return bill.waived ? 0 : Math.max(0, bill.amountDue - bill.amountPaid);
}

/** 42 → "RCPT-000042" */
export const formatReceiptNumber = (seq: number) => `RCPT-${String(seq).padStart(6, "0")}`;
