import { config, validateConfig } from './config.mjs';
import { scrapeVouchersWithRetry } from './scraper.mjs';
import { readState, writeState, writeVouchers } from './state.mjs';
import { formatVouchers } from './formatter.mjs';
import { sendOrEditMessages } from './telegram.mjs';
import { generateHash } from './utils.mjs';

async function main() {
  try {
    console.log('Bắt đầu quá trình crawl...');
    validateConfig();

    const vouchers = await scrapeVouchersWithRetry();
    
    // Lưu lại toàn bộ dữ liệu ra file json để dùng làm API hoặc gắn lên web
    await writeVouchers(vouchers);

    const state = await readState();

    const currentHash = generateHash(vouchers);
    console.log(`Hash hiện tại: ${currentHash}`);
    console.log(`Hash lần trước: ${state.lastHash || 'chưa có'}`);

    if (config.ONLY_WHEN_CHANGED && state.lastHash === currentHash) {
      console.log('Danh sách voucher không thay đổi.');
      state.updatedAt = new Date().toISOString();
      await writeState(state);
      return;
    }

    const messages = formatVouchers(vouchers, config);
    const newMessageId = await sendOrEditMessages(messages, state);

    const newState = {
      telegramMessageId: config.TELEGRAM_MODE === 'edit' ? newMessageId : state.telegramMessageId,
      lastHash: currentHash,
      lastCodes: vouchers.map(v => v.code),
      updatedAt: new Date().toISOString()
    };

    await writeState(newState);
    console.log('Quá trình hoàn tất thành công!');

  } catch (error) {
    console.error('Lỗi không thể xử lý trong quá trình chạy:', error.message);
    process.exit(1);
  }
}

main();