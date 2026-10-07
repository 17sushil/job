const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage();
    console.log('Navigating to register...');
    await page.goto('http://localhost:3000/register');
    console.log('Filling form...');
    
    // There are some variants for labels, maybe name? Let's just click the inputs
    await page.getByLabel(/First name/i).fill('Test').catch(() => {});
    await page.getByLabel(/Last name/i).fill('User').catch(() => {});
    await page.getByPlaceholder(/first/i).fill('Test').catch(() => {});
    await page.getByPlaceholder(/last/i).fill('User').catch(() => {});
    await page.getByPlaceholder(/email/i).fill('test2@example.com').catch(() => {});
    await page.getByPlaceholder(/password/i).fill('password123').catch(() => {});
    
    // Some forms don't have first/last name
    // Let's try simpler locators
    const inputs = await page.locator('input').all();
    for (let i=0; i<inputs.length; i++) {
        const type = await inputs[i].getAttribute('type');
        const name = await inputs[i].getAttribute('name');
        if (type === 'email' || name === 'email') await inputs[i].fill('test3@example.com');
        if (type === 'password' || name === 'password') await inputs[i].fill('password123');
        if (name === 'firstName') await inputs[i].fill('Test');
        if (name === 'lastName') await inputs[i].fill('User');
        if (name === 'name') await inputs[i].fill('Test User');
    }
    
    // If there is a role selector, pick Recruiter
    try {
        await page.getByRole('combobox').selectOption({ label: 'Recruiter' });
    } catch(e) {}
    try {
        await page.locator('input[type="radio"][value="recruiter"]').click();
    } catch(e) {}
    
    console.log('Clicking submit...');
    await page.locator('button[type="submit"]').click();
    console.log('Waiting for navigation...');
    await page.waitForURL('**/dashboard**', {timeout: 5000});
    
    console.log('Taking screenshot...');
    await page.waitForTimeout(2000);
    await page.screenshot({path: 'dashboard.png', fullPage: true});
    console.log('Successfully registered and captured dashboard.');
  } catch (err) {
    console.error(err);
    await browser.contexts()[0].pages()[0].screenshot({path: 'dashboard-error.png', fullPage: true});
  } finally {
    await browser.close();
  }
})();
