export const MN_PHONE_DIGIT_LENGTH = 8;

export function extractMongolianPhoneDigits(phone: string): string {
  const compact = phone.replace(/[\s()-]/g, "");

  if (compact.startsWith("+976")) {
    return compact.slice(4).replace(/\D/g, "");
  }

  if (compact.startsWith("976")) {
    return compact.slice(3).replace(/\D/g, "");
  }

  return compact.replace(/\D/g, "");
}

export function isValidMongolianPhone(phone: string): boolean {
  return extractMongolianPhoneDigits(phone).length === MN_PHONE_DIGIT_LENGTH;
}

export function getMongolianPhoneError(phone: string): string | null {
  const digits = extractMongolianPhoneDigits(phone);

  if (!digits) {
    return "Утасны дугаар оруулна уу";
  }

  if (digits.length !== MN_PHONE_DIGIT_LENGTH) {
    return `Утасны дугаар яг ${MN_PHONE_DIGIT_LENGTH} оронтой байх ёстой`;
  }

  return null;
}

export function normalizeMongolianPhone(phone: string): string | null {
  if (!isValidMongolianPhone(phone)) {
    return null;
  }

  const digits = extractMongolianPhoneDigits(phone);
  return `+976${digits}`;
}

export function formatPhoneDigitsInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, MN_PHONE_DIGIT_LENGTH);
}
