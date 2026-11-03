import AssociationSettingsDao from "@/dao/association-settings";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { BankDetailsTypes } from "@/types/_types";

/**
 * Payment account service — the association's single bank account.
 *
 * Programs created before this existed stored their own bank details.
 * `withPaymentAccount` replaces those with the association account when
 * one is set, so every payment screen shows the same account without the
 * website or portal needing to change.
 */

const EMPTY_ACCOUNT: BankDetailsTypes = { bankName: "", accountName: "", accountNumber: "" };

const PaymentAccountService = {
  /** The saved account, or null if it hasn't been set yet. */
  async get(): Promise<BankDetailsTypes | null> {
    const settings = await AssociationSettingsDao.get();
    const account = settings?.paymentAccount;
    return account
      ? { bankName: account.bankName, accountName: account.accountName, accountNumber: account.accountNumber }
      : null;
  },

  async update(account: BankDetailsTypes, actor: AuditActor) {
    await AssociationSettingsDao.setPaymentAccount(account);
    await logAudit({
      action: "updated",
      entityType: "settings",
      entityTitle: "Association payment account",
      actor,
      detail: `${account.bankName} · ${account.accountName} · ${account.accountNumber}`,
    });
    return await PaymentAccountService.get();
  },

  /**
   * Adds the payment account to one program or a list of programs (plain objects).
   * Order of preference: association account → the program's old stored
   * details → empty fields.
   */
  async withPaymentAccount<T extends { toObject?: () => object } | null>(programs: T | T[]) {
    const account = await PaymentAccountService.get();
    const apply = (program: T) => {
      if (!program) return program;
      const plain = (program.toObject ? program.toObject() : program) as { bankDetails?: BankDetailsTypes | null };
      return { ...plain, bankDetails: account ?? plain.bankDetails ?? EMPTY_ACCOUNT };
    };
    return Array.isArray(programs) ? programs.map(apply) : apply(programs);
  },
};

export default PaymentAccountService;
