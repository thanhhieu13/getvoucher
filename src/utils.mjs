import crypto from 'crypto';

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateHash(vouchers) {
  const dataToHash = vouchers.map(v => ({
    code: v.code,
    discount: v.discount,
    maxDiscount: v.maxDiscount,
    minimumOrder: v.minimumOrder,
    status: v.status
  }));
  return crypto.createHash('sha256').update(JSON.stringify(dataToHash)).digest('hex');
}

export function escapeHTML(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getCurrentTime(timezone) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());
}