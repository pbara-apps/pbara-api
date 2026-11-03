/**
 * Small helpers for ambassador (member) records.
 */

/** "  Tunde   ADE " → "tunde ade". Used to compare names in the duplicate check. */
export function toNameKey(fullName: string): string {
  return fullName.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Tidies spacing but keeps the person's own capitalisation: "  Tunde   Ade " → "Tunde Ade". */
export function cleanName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, " ");
}

/** 123 → "PBARA-000123". */
export function formatMemberId(seq: number): string {
  return `PBARA-${String(seq).padStart(6, "0")}`;
}

/** True when two optional dates fall on the same calendar day (UTC). */
export function isSameDay(a?: Date | null, b?: Date | null): boolean {
  if (!a || !b) return false;
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}
