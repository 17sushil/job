const { chromium } = require('playwright');
const { createRequire } = require('node:module');
const path = require('node:path');
const axios = createRequire(path.join(__dirname, '../../apps/backend/package.json'))('axios');
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
    // This diagnostic runs in Node: carry the authenticated browser cookies
    // to Axios, rather than adding a browser fetch or bearer-token fallback.
    const cookies = await page.context().cookies('http://localhost:3000');
    const response = await axios.get('http://localhost:3000/api/candidates/views', {
      headers: { Cookie: cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ') },
    });
    const res = response.data;
    console.log(JSON.stringify(res, null, 2));
  } finally {
    await browser.close();
  }
})();
