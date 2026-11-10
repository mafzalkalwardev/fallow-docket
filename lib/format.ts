const UPPER_TOKENS = new Set([
  "LLC",
  "INC",
  "LP",
  "LLP",
  "LLLP",
  "DBA",
  "CO",
  "PC",
  "PA",
  "USA",
  "US",
]);

export function displayName(value: string | undefined): string {
  const trimmed = (value ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed
    .toLowerCase()
    .split(" ")
    .map((word) => {
      const letters = word.replace(/[^a-z]/gi, "");
      if (!letters) return word;
      if (UPPER_TOKENS.has(letters.toUpperCase()) || letters.length <= 2) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function displayClass(value: string | undefined): string {
  if (!value) return "";
  return value
    .split(";")
    .map((part) => displayName(part))
    .filter(Boolean)
    .join(" · ");
}

export function formatPhone(raw: string | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits || /^0+$/.test(digits)) return "";
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length !== 10) return raw.trim();
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

export function cleanEmail(raw: string | undefined): string {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value.includes("@") || value.startsWith("@") || value.endsWith("@")) return "";
  return value;
}

export function formatYmd(raw: string | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length !== 8) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export function intOrNull(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const number = Number(raw);
  if (!Number.isFinite(number)) return null;
  return Math.trunc(number);
}

export function formatCoverage(raw: string | undefined): string {
  const amount = intOrNull(raw);
  if (amount == null) return "Not reported";
  if (amount <= 0) return "None on file";
  const dollars = amount < 100000 ? amount * 1000 : amount;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function joinAddress(parts: Array<string | undefined>): string {
  return parts
    .map((part) => displayName(part))
    .filter(Boolean)
    .join(", ");
}

export function formatMc(docket: string | undefined): string {
  const cleaned = (docket ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const match = cleaned.match(/^([A-Z]+)0*(\d+)$/);
  if (!match) return cleaned;
  return `${match[1]}-${match[2]}`;
}

export function stripDot(value: string | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/^0+/, "") || "0";
}

export function firstValue(values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}
