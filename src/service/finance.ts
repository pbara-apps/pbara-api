import AmbassadorDao from "@/dao/ambassador";
import ChapterDao from "@/dao/chapter";
import ChurchDao from "@/dao/church";
import CounterDao from "@/dao/counter";
import { BillDao, DueDao, PaymentDao } from "@/dao/finance";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import type { ExecutiveRole } from "@/helpers/auth-user";
import { billBalance, billStatus, formatReceiptNumber } from "@/helpers/bill-status";
import { httpError } from "@/helpers/http-error";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import ChapterService from "@/service/chapter";
import NotificationService from "@/service/notification";
import PaymentAccountService from "@/service/payment-account";

/**
 * Finance service — dues, levies, bills and payments.
 *
 * Flow:
 * 1. Finance creates a Due → one Bill per targeted chapter (or church).
 * 2. Chapters/churches see their bills, pay into the association account
 *    and upload proof → a pending Payment (part payments allowed).
 * 3. Finance verifies (adds to amountPaid, issues a receipt number) or
 *    rejects with a reason.
 * Finance can waive or change a single bill (with a reason) and remind
 * everyone who still owes.
 */

const FINANCE_ROLES: ExecutiveRole[] = ["finance", "super_admin", "admin"];
const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
const refId = (ref: unknown) => String((ref as { _id?: unknown })?._id ?? ref);
const refName = (ref: unknown) => (ref as { name?: string })?.name ?? "";

export type DueInput = {
  title: string;
  description?: string | null;
  type: "due" | "levy";
  billTo: "chapter" | "church";
  chargeBasis: "flat" | "per_member";
  amount: number;
  period?: string | null;
  dueDate: string;
  appliesTo: "all" | "selected";
  churchIds?: string[];
  chapterIds?: string[];
};

type Target = { church: string; chapter: string | null; name: string };

/**
 * Who gets a bill:
 * - billTo "chapter": active chapters — all of them, or the selected
 *   chapters plus every chapter in the selected churches.
 * - billTo "church": active churches — all, or the selected ones.
 */
async function resolveTargets(input: DueInput): Promise<Target[]> {
  const selectedChurches = new Set(input.churchIds ?? []);
  const selectedChapters = new Set(input.chapterIds ?? []);

  if (input.billTo === "church") {
    const churches = await ChurchDao.getPublicChurches(); // active churches
    return churches
      .filter((c) => input.appliesTo === "all" || selectedChurches.has(String(c._id)))
      .map((c) => ({ church: String(c._id), chapter: null, name: c.name }));
  }

  const chapters = await ChapterDao.listAll({ status: "active" });
  return chapters
    .filter(
      (c) =>
        input.appliesTo === "all" ||
        selectedChapters.has(String(c._id)) ||
        selectedChurches.has(refId(c.church)),
    )
    .map((c) => ({ church: refId(c.church), chapter: String(c._id), name: c.name }));
}

/** Adds status, balance and pending-payment info to bills. */
async function withStatus<T extends { _id: unknown; waived?: boolean; amountDue: number; amountPaid: number; dueDate: Date }>(
  bills: T[],
) {
  const payments = await PaymentDao.findByBills(bills.map((b) => String(b._id)));
  return bills.map((bill) => {
    const own = payments.filter((p) => String(p.bill) === String(bill._id));
    const pendingAmount = own.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
    return {
      ...bill,
      status: billStatus(bill, pendingAmount > 0),
      balance: billBalance(bill),
      pendingAmount,
      payments: own,
    };
  });
}

/** Tells the people responsible for a bill (chapter officers, or the church counsellor). */
async function notifyBillHolders(
  bills: { billTo?: string; chapter?: unknown; church?: unknown }[],
  content: { type: string; title: string; message: string },
) {
  // insertMany returns documents typed loosely; normalise to plain fields.
  bills = bills.map((b) => ({ billTo: b.billTo, chapter: b.chapter, church: b.church }));
  const chapterBills = bills.filter((b) => b.billTo === "chapter");
  const churchBills = bills.filter((b) => b.billTo === "church");
  for (const b of chapterBills) {
    await NotificationService.notifyChapterOfficers([refId(b.chapter)], [refId(b.church)], {
      ...content,
      link: "/chapter/dues",
    });
  }
  if (churchBills.length > 0) {
    await NotificationService.notifyCounsellors(churchBills.map((b) => refId(b.church)), {
      ...content,
      link: "/chapter/dues",
    });
  }
}

const FinanceService = {
  // ─── Dues (finance) ──────────────────────────────────────────────────────

  async createDue(input: DueInput, actor: AuditActor) {
    if (input.appliesTo === "selected" && !input.churchIds?.length && !input.chapterIds?.length) {
      throw httpError(400, "Select at least one church or chapter");
    }
    const targets = await resolveTargets(input);
    if (targets.length === 0) throw httpError(400, "No active chapters or churches match this selection");

    // Per-member: count active members now; this number is fixed on the bill.
    let counts = new Map<string, number>();
    if (input.chargeBasis === "per_member") {
      counts =
        input.billTo === "chapter"
          ? await AmbassadorDao.countActiveByChapters(targets.map((t) => t.chapter!))
          : await AmbassadorDao.countActiveByChurches(targets.map((t) => t.church));
    }

    const due = await DueDao.create({
      ...input,
      description: input.description?.trim() || null,
      period: input.period?.trim() || null,
      dueDate: new Date(`${input.dueDate}T23:59:59`),
      targetChurches: input.churchIds ?? [],
      targetChapters: input.chapterIds ?? [],
      createdBy: actor.id ?? null,
    });

    const bills = targets
      .map((t) => {
        const memberCount =
          input.chargeBasis === "per_member" ? (counts.get(t.chapter ?? t.church) ?? 0) : null;
        const amountDue = input.chargeBasis === "per_member" ? input.amount * memberCount! : input.amount;
        return {
          due: due._id,
          billTo: input.billTo,
          church: t.church,
          chapter: t.chapter,
          memberCount,
          amountDue,
          dueDate: due.dueDate,
        };
      })
      // A per-member bill for a chapter with no active members would be ₦0 — skip it.
      .filter((b) => b.amountDue > 0);

    const created = await BillDao.createMany(bills);
    await logAudit({
      action: "created",
      entityType: "due",
      entityId: String(due._id),
      entityTitle: due.title,
      actor,
      detail: `${created.length} bill(s) created`,
    });
    await notifyBillHolders(created, {
      type: "due.created",
      title: `New ${input.type}: ${input.title}`,
      message: `A new ${input.type} has been billed to you. Due by ${due.dueDate.toDateString()}.`,
    });
    return { due, billsCreated: created.length, skipped: targets.length - created.length };
  },

  /** Every due with collection totals: expected, collected, outstanding, paid count. */
  async listDues() {
    const dues = await DueDao.listAll();
    const bills = await BillDao.findByDues(dues.map((d) => String(d._id)));
    return dues.map((due) => {
      const own = bills.filter((b) => String(b.due) === String(due._id));
      const live = own.filter((b) => !b.waived);
      const expected = live.reduce((s, b) => s + b.amountDue, 0);
      const collected = own.reduce((s, b) => s + b.amountPaid, 0);
      return {
        ...due,
        summary: {
          bills: own.length,
          expected,
          collected,
          outstanding: live.reduce((s, b) => s + billBalance(b), 0),
          paidInFull: live.filter((b) => b.amountPaid >= b.amountDue).length,
          waived: own.length - live.length,
        },
      };
    });
  },

  /** One due with every bill, its status and payments. */
  async getDue(id: string) {
    const due = await DueDao.findById(id);
    if (!due) throw httpError(404, "Due not found");
    return { due, bills: await withStatus(await BillDao.findByDue(id)) };
  },

  /** Deleting is only allowed before any payment has been submitted. */
  async deleteDue(id: string, actor: AuditActor) {
    const due = await DueDao.findById(id);
    if (!due) throw httpError(404, "Due not found");
    const bills = await BillDao.findByDue(id);
    if ((await PaymentDao.countByDue(bills.map((b) => String(b._id)))) > 0) {
      throw httpError(409, "Payments have been made against this due, so it can't be deleted");
    }
    await BillDao.deleteByDue(id);
    await DueDao.deleteById(id);
    await logAudit({ action: "deleted", entityType: "due", entityId: id, entityTitle: due.title, actor });
  },

  /** Waive a bill, or change what it asks for. A reason is always recorded. */
  async adjustBill(billId: string, input: { waived?: boolean; amountDue?: number; note: string }, actor: AuditActor) {
    const bill = await BillDao.findById(billId);
    if (!bill) throw httpError(404, "Bill not found");
    if (input.amountDue !== undefined && input.amountDue < bill.amountPaid) {
      throw httpError(400, `The amount can't be less than what has already been paid (${naira(bill.amountPaid)})`);
    }
    const updated = await BillDao.update(billId, {
      ...(input.waived !== undefined ? { waived: input.waived } : {}),
      ...(input.amountDue !== undefined ? { amountDue: input.amountDue } : {}),
      adjustmentNote: input.note,
    });
    const place = refName(bill.chapter) || refName(bill.church);
    await logAudit({
      action: "updated",
      entityType: "due",
      entityId: billId,
      entityTitle: `${refName(bill.due)} — ${place}`,
      actor,
      detail: input.waived ? `Waived: ${input.note}` : `Adjusted: ${input.note}`,
    });
    return updated;
  },

  /** Notifies everyone on this due who still owes money. */
  async sendReminders(dueId: string) {
    const { due, bills } = await FinanceService.getDue(dueId);
    const owing = bills.filter((b) => b.balance > 0 && b.status !== "awaiting_verification");
    for (const bill of owing) {
      await notifyBillHolders([bill], {
        type: "due.reminder",
        title: `Reminder: ${due.title}`,
        message: `${naira(bill.balance)} is still outstanding${bill.status === "overdue" ? " and overdue" : ""}. Due ${new Date(bill.dueDate).toDateString()}.`,
      });
    }
    return { reminded: owing.length };
  },

  /** All bills and payments for one chapter or church. */
  async statement(filter: { chapterId?: string; churchId?: string }) {
    if (!filter.chapterId && !filter.churchId) throw httpError(400, "Choose a chapter or a church");
    const bills = await withStatus(await BillDao.findForStatement(filter));
    const totals = {
      billed: bills.filter((b) => !b.waived).reduce((s, b) => s + b.amountDue, 0),
      paid: bills.reduce((s, b) => s + b.amountPaid, 0),
      outstanding: bills.reduce((s, b) => s + b.balance, 0),
    };
    return { bills, totals };
  },

  // ─── Payments (finance) ──────────────────────────────────────────────────

  async listPayments(status: "pending" | "verified" | "rejected") {
    return await PaymentDao.listByStatus(status);
  },

  async verifyPayment(paymentId: string, actor: AuditActor) {
    const payment = await PaymentDao.findById(paymentId);
    if (!payment || payment.status !== "pending") throw httpError(404, "Pending payment not found");

    const receiptNumber = formatReceiptNumber(await CounterDao.next("receipt"));
    await PaymentDao.update(paymentId, {
      status: "verified",
      receiptNumber,
      reviewedBy: actor.id ?? null,
      reviewedAt: new Date(),
    });
    const bill = await BillDao.addToPaid(String(payment.bill), payment.amount);
    const full = await BillDao.findById(String(payment.bill));

    await logAudit({
      action: "updated",
      entityType: "payment",
      entityId: paymentId,
      entityTitle: receiptNumber,
      actor,
      detail: `Verified ${naira(payment.amount)} for ${refName(full?.due)}`,
    });
    if (full) {
      await notifyBillHolders([full], {
        type: "payment.verified",
        title: "Payment confirmed",
        message: `${naira(payment.amount)} for ${refName(full.due)} was confirmed. Receipt ${receiptNumber}.${
          bill && billBalance(bill) > 0 ? ` Balance: ${naira(billBalance(bill))}.` : " Fully paid."
        }`,
      });
    }
    return { receiptNumber };
  },

  async rejectPayment(paymentId: string, note: string, actor: AuditActor) {
    const payment = await PaymentDao.findById(paymentId);
    if (!payment || payment.status !== "pending") throw httpError(404, "Pending payment not found");
    await PaymentDao.update(paymentId, {
      status: "rejected",
      reviewNote: note,
      reviewedBy: actor.id ?? null,
      reviewedAt: new Date(),
    });
    const bill = await BillDao.findById(String(payment.bill));
    await logAudit({
      action: "updated",
      entityType: "payment",
      entityId: paymentId,
      entityTitle: refName(bill?.due) || "Payment",
      actor,
      detail: `Rejected: ${note}`,
    });
    if (bill) {
      await notifyBillHolders([bill], {
        type: "payment.rejected",
        title: "Payment not confirmed",
        message: `Your ${naira(payment.amount)} payment for ${refName(bill.due)} was not confirmed. Reason: ${note}`,
      });
    }
  },

  // ─── Chapter portal ──────────────────────────────────────────────────────

  /**
   * Bills a portal user can see, with status and payments, plus the
   * association account to pay into. Counsellors also see church bills.
   */
  async portalBills(user: PortalAuthUser, chapterId?: string) {
    const chapterIds = await ChapterService.resolveChapterIds(user, chapterId);
    const churchId = user.role === "counsellor" ? user.churchId : null;
    const bills = await withStatus(await BillDao.findForPortal(chapterIds, churchId));
    return { bills, paymentAccount: await PaymentAccountService.get() };
  },

  /** Records a payment towards a bill; it waits for finance to verify it. */
  async submitPayment(
    user: PortalAuthUser,
    input: { billId: string; amount: number; paidOn: string; reference?: string | null; proofUrl: string },
  ) {
    const bill = await BillDao.findById(input.billId);
    if (!bill) throw httpError(404, "Bill not found");

    // Access: chapter bills → officers of that chapter (or the counsellor);
    // church bills → the counsellor only.
    if (bill.billTo === "church") {
      if (user.role !== "counsellor" || refId(bill.church) !== user.churchId) throw httpError(404, "Bill not found");
    } else {
      await ChapterService.resolveChapterIds(user, refId(bill.chapter));
    }

    const [withInfo] = await withStatus([bill.toObject()]);
    const payable = withInfo.balance - withInfo.pendingAmount;
    if (payable <= 0) throw httpError(400, "Nothing left to pay on this bill (or payments are awaiting confirmation)");
    if (input.amount > payable) throw httpError(400, `The most you can pay now is ${naira(payable)}`);

    const payment = await PaymentDao.create({
      bill: input.billId,
      amount: input.amount,
      paidOn: new Date(input.paidOn),
      reference: input.reference?.trim() || null,
      proofUrl: input.proofUrl,
      submittedBy: user.id,
    });
    await NotificationService.notifyExecutiveRoles(FINANCE_ROLES, {
      type: "payment.submitted",
      title: "Payment to verify",
      message: `${refName(bill.chapter) || refName(bill.church)} paid ${naira(input.amount)} for ${refName(bill.due)}.`,
      link: "/admin/dues?tab=payments",
    });
    return payment;
  },
};

export default FinanceService;
