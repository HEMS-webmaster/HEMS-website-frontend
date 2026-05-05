import { test, expect } from '@playwright/test';

test('Workshop Manager data ingestion and auto-extraction', async ({ page }) => {
  // Navigate to the Workshop Manager locally
  await page.goto('http://localhost:3000/manager');
  
  // Wait for the UI to load
  await page.waitForSelector('text=Workshop Manager');

  // Verify that the dropdown or list of workshops includes the 14th Workshop (2022)
  const workshopElement = page.locator('text=14th');
  await expect(workshopElement).toBeVisible();

  // Click on the 14th Workshop to expand its details
  await workshopElement.first().click();

  // Wait a moment for rendering and auto-extraction to run
  await page.waitForTimeout(2000);

  // Take a screenshot
  await page.screenshot({ path: 'manager_expanded_verification.png', fullPage: true });

  const textContent = await page.content();
  const hasInstitute = textContent.includes('Institute') || textContent.includes('institute');
  const hasPresentations = textContent.includes('Presentation') || textContent.includes('session');
  
  console.log('--- UI EXPANDED RENDER CHECK ---');
  console.log('Has Institute Text?', hasInstitute);
  console.log('Has Presentations?', hasPresentations);
});
