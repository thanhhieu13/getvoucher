const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://t.me/s/taglivefor_kol', { waitUntil: 'networkidle' });
  const html = await page.evaluate(() => document.body.innerText);
  console.log(html);
  await browser.close();
})();
