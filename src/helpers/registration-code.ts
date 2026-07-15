/**
 * Resolve a short program code for registration numbers.
 * Prefer explicit programCode; otherwise derive from slug.
 *
 * Examples:
 * - programCode "RCAMP26" → RCAMP26
 * - slug "royal-camp-2026" → RC26
 * - slug "congress" → CONGR
 */
export function resolveProgramCode(input: {
  programCode?: string | null;
  slug: string;
}): string {
  const explicit = normalizeProgramCode(input.programCode);
  if (explicit) return explicit;
  return deriveProgramCodeFromSlug(input.slug);
}

export function normalizeProgramCode(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
  return cleaned.length >= 2 ? cleaned : null;
}

export function deriveProgramCodeFromSlug(slug: string): string {
  const parts = slug
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  if (parts.length === 0) return "PROG";

  const yearPart = [...parts].reverse().find((p) => /^\d{2,4}$/.test(p));
  const wordParts = parts.filter((p) => !/^\d{2,4}$/.test(p));

  let code = "";
  if (wordParts.length === 0) {
    code = "PROG";
  } else if (wordParts.length === 1) {
    code = wordParts[0].slice(0, 5).toUpperCase();
  } else {
    code = wordParts.map((w) => w[0]!.toUpperCase()).join("");
  }

  if (yearPart) {
    code += yearPart.length === 4 ? yearPart.slice(2) : yearPart;
  }

  const cleaned = code.replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return cleaned || "PROG";
}

export function formatRegistrationCode(parts: {
  programCode: string;
  year: number;
  serial: number;
}): string {
  const yy = String(parts.year % 100).padStart(2, "0");
  const serial = String(parts.serial).padStart(4, "0");
  return `PBARA/${parts.programCode}/${yy}/${serial}`;
}

export function buildRegistrationCodes(params: {
  programCode: string;
  year: number;
  startSerial: number;
  count: number;
}): string[] {
  return Array.from({ length: params.count }, (_, i) =>
    formatRegistrationCode({
      programCode: params.programCode,
      year: params.year,
      serial: params.startSerial + i,
    }),
  );
}
