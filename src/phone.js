export function normalizeUzPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = "998" + digits;
  else if (digits.length === 10 && digits.startsWith("0")) digits = "998" + digits.slice(1);
  return digits.slice(0, 20);
}

export function isUzPhone(value) {
  const digits = normalizeUzPhone(value);
  return digits.length === 12 && digits.startsWith("998");
}

export function displayUzPhone(value) {
  const digits = normalizeUzPhone(value);
  if (digits.length !== 12) return value || "+998 ";
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
}
