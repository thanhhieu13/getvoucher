import 'dotenv/config';

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  SOURCE_URL: process.env.SOURCE_URL || 'https://giangon.vn/',
  TELEGRAM_MODE: process.env.TELEGRAM_MODE || 'edit',
  ONLY_WHEN_CHANGED: process.env.ONLY_WHEN_CHANGED !== 'false',
  HEADLESS: process.env.HEADLESS !== 'false',
  PAGE_TIMEOUT: parseInt(process.env.PAGE_TIMEOUT, 10) || 60000,
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES, 10) || 3,
  TIMEZONE: process.env.TIMEZONE || 'Asia/Ho_Chi_Minh',
};

export function validateConfig() {
  if (!config.TELEGRAM_BOT_TOKEN) {
    throw new Error('Thiếu biến môi trường TELEGRAM_BOT_TOKEN');
  }
  if (!config.TELEGRAM_CHAT_ID) {
    throw new Error('Thiếu biến môi trường TELEGRAM_CHAT_ID');
  }
}