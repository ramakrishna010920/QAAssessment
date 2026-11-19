import { expect, test } from '@playwright/test';
import { signInUi } from '../fixtures/auth';

async function openWizard(page: Parameters<typeof signInUi>[0]): Promise<void> {
  await signInUi(page, 'claimant');
  await page.goto('/claims/new');
  await expect(page.getByRole('heading', { name: 'Incident Details' })).toBeVisible();
}

test('rejects below-minimum values and future incident dates', async ({ page }) => {
  await openWizard(page);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await page.locator('#incidentDate').fill(tomorrow.toISOString().slice(0, 10));
  await page.locator('#incidentLocation').fill('ABCD');
  await page.locator('#claimAmount').fill('0');

  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await expect(page.getByText('Incident date cannot be in the future')).toBeVisible();
  await expect(page.getByText('Location must be at least 5 characters')).toBeVisible();
  await expect(page.getByText('Claim amount must be at least $0.01')).toBeVisible();
});

test('accepts inclusive lower bounds and maximum description length', async ({ page }) => {
  await openWizard(page);
  await page.locator('#incidentDate').fill(new Date().toISOString().slice(0, 10));
  await page.locator('#incidentLocation').fill('12345');
  await page.locator('#claimAmount').fill('0.01');
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Supporting Details' })).toBeVisible();
  await page.locator('#description').fill('x'.repeat(1000));
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Review Your Claim' })).toBeVisible();
  await expect(page.getByText('$0.01')).toBeVisible();
});
