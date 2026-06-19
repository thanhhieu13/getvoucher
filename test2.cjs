const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://giangon.vn/', { waitUntil: 'networkidle' });
  
  const html = await page.evaluate(() => {
     const btn = document.querySelector('[role="button"][aria-label^="Sao chép mã "]');
     if (!btn) return "No button found";
     let card = btn.parentNode.parentNode.parentNode; // guess 3 levels up
     return card.outerHTML;
  });
  console.log(html);
  await browser.close();
})();
