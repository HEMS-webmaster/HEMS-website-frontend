import { test, expect } from '@playwright/test';

test('dump console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });
  
  await page.goto('http://localhost:3000/manager');
  await page.waitForTimeout(3000);
  
  console.log('--- CONSOLE ERRORS ---');
  errors.forEach(e => console.log(e));
});
