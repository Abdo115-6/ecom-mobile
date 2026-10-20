// Moroccan mobile/landline numbers: 05/06/07 + 8 digits, also typed as +212 / 00212 / 212.
// Returns the number as 0XXXXXXXXX, or null when it cannot be a valid Moroccan number.
export function normalizeMoroccanPhone(input: string): string | null {
  let digits = (input || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('212')) digits = '0' + digits.slice(3);
  if (digits.length === 9 && /^[567]/.test(digits)) digits = '0' + digits;
  return /^0[567]\d{8}$/.test(digits) ? digits : null;
}

export const PHONE_ERROR_MESSAGE = 'Numéro invalide. Exemple : 06 12 34 56 78 (رقم الهاتف غير صحيح)';
