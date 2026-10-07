const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/login');
    // fill login
    const emailLocator = page.locator('input[type="email"]');
    if (await emailLocator.count() > 0) {
       await emailLocator.fill('recruiter@company.com');
    }
    const pwdLocator = page.locator('input[type="password"]');
    if (await pwdLocator.count() > 0) {
       await pwdLocator.fill('password123');
    }
    const btn = page.locator('button[type="submit"]');
    if (await btn.count() > 0) {
       await btn.click();
       await page.waitForTimeout(2000);
    }
    
    // hit API
    const res = await page.evaluate(async () => {
      const response = await fetch('/api/candidates/views');
      return await response.json();
    });
    console.log(JSON.stringify(res, null, 2));
  } finally {
    await browser.close();
  }
})();
