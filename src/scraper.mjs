import { chromium } from 'playwright';
import { sleep } from './utils.mjs';
import { config } from './config.mjs';
import fs from 'fs/promises';
import path from 'path';

export async function scrapeVouchersWithRetry() {
  let attempt = 0;
  while (attempt < config.MAX_RETRIES) {
    attempt++;
    try {
      console.log(`[Lần thử ${attempt}/${config.MAX_RETRIES}] Đang khởi chạy crawler...`);
      return await scrapeVouchers();
    } catch (error) {
      console.error(`Lỗi crawler ở lần thử ${attempt}:`, error.message);
      if (attempt >= config.MAX_RETRIES) {
        throw error;
      }
      const delayMs = attempt * 2000;
      console.log(`Đợi ${delayMs}ms trước khi thử lại...`);
      await sleep(delayMs);
    }
  }
}

async function scrapeVouchers() {
  const browser = await chromium.launch({ headless: config.HEADLESS });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`Truy cập ${config.SOURCE_URL}...`);
    await page.goto(config.SOURCE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: config.PAGE_TIMEOUT
    });

    console.log('Đang chờ phần nội dung "Mã giảm giá đang hoạt động"...');
    await page.waitForFunction(() => {
      return document.body.innerText.toLowerCase().includes('mã giảm giá đang hoạt động');
    }, { timeout: config.PAGE_TIMEOUT });

    console.log('Đang chờ thông báo tải dữ liệu biến mất...');
    try {
      await page.waitForFunction(() => {
        return !document.body.innerText.toLowerCase().includes('đang tải dữ liệu voucher');
      }, { timeout: 15000 });
    } catch (e) {
      console.log('Không tìm thấy thông báo tải dữ liệu hoặc đã bị ẩn.');
    }

    console.log('Chờ thêm 3 giây để dữ liệu render hoàn tất...');
    await sleep(3000);

    console.log('Trích xuất dữ liệu voucher...');
    const vouchers = await page.evaluate(() => {
      const results = [];
      const buttons = document.querySelectorAll('[role="button"][aria-label^="Sao chép mã "]');
      
      buttons.forEach(btn => {
        const ariaLabel = btn.getAttribute('aria-label') || '';
        const code = ariaLabel.replace(/^Sao chép mã\s*/i, '').trim();
        
        if (!code) return;

        // Thẻ card là cha cấp 3 của button
        let card = btn.parentNode?.parentNode?.parentNode;
        const rawText = card ? card.innerText : '';

        const ignoreKeywords = ['Hết lượt', 'Đã hết', 'Hết mã', 'Không còn lượt'];
        if (ignoreKeywords.some(kw => rawText.includes(kw))) {
          return;
        }

        let discount = '';
        let maxDiscount = '';
        let minimumOrder = '';
        let usagePercent = null;
        let platform = '';

        const discountMatch = rawText.match(/Giảm\s*([\d\.]+(K|đ|%))/i);
        if (discountMatch) discount = discountMatch[1];
        
        const maxMatch = rawText.match(/Tối đa\s*([\d\.]+(K|đ))/i);
        if (maxMatch) maxDiscount = maxMatch[1];

        const minOrderMatch = rawText.match(/Đơn tối thiểu\s*([\d\.]+(K|đ)?|0đ)/i);
        if (minOrderMatch) minimumOrder = minOrderMatch[1];

        const usageMatch = rawText.match(/(?:Đã dùng[\s]*(\d+)%)|(?:(\d+)%\s*đã dùng)/i);
        if (usageMatch) usagePercent = parseInt(usageMatch[1] || usageMatch[2], 10);

        // Theo yêu cầu: Chỉ lấy mã FACEBOOK có mức giảm 22%
        if (rawText.toUpperCase().includes('FACEBOOK') && discount !== '22%') {
          return;
        }

        results.push({
          code,
          platform,
          discount,
          maxDiscount,
          minimumOrder,
          usagePercent,
          status: 'active',
          rawText
        });
      });

      return results;
    });

    console.log(`Đã tìm thấy ${vouchers.length} mã (chưa lọc trùng).`);

    const uniqueVouchersMap = new Map();
    vouchers.forEach(v => {
      if (!uniqueVouchersMap.has(v.code)) {
        uniqueVouchersMap.set(v.code, v);
      }
    });

    const uniqueVouchers = Array.from(uniqueVouchersMap.values());
    console.log(`Còn lại ${uniqueVouchers.length} mã sau khi lọc trùng và bỏ mã hết lượt.`);

    // Luôn luôn chèn mã Instagram hardcode theo yêu cầu
    uniqueVouchers.unshift({
      code: 'METAPAR2IGNEWD22300',
      platform: 'Instagram',
      discount: '22%',
      maxDiscount: '300K',
      minimumOrder: '50K',
      usagePercent: 64,
      status: 'active',
      rawText: ''
    });

    return uniqueVouchers;

  } catch (error) {
    console.error('Đã xảy ra lỗi trong quá trình crawl!');
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logsDir, { recursive: true });
      await page.screenshot({ path: path.join(logsDir, 'error-screenshot.png'), fullPage: true });
      const html = await page.content();
      await fs.writeFile(path.join(logsDir, 'error-page.html'), html);
      console.log('Đã lưu screenshot và html vào thư mục logs.');
    } catch (saveError) {
      console.error('Không thể lưu ảnh/html lỗi:', saveError.message);
    }
    throw error;
  } finally {
    console.log('Đang đóng browser...');
    await browser.close();
  }
}