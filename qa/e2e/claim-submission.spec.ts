import { expect, test } from '@playwright/test';
import { signInUi } from '../fixtures/auth';
import { claimInput } from '../fixtures/claims';

test('claimant submits a claim and sees the persisted claim in My Claims', async ({ page }) => {
  const input = claimInput();
  await signInUi(page, 'claimant');
  await page.getByRole('button', { name: 'Submit New Claim' }).click();
  await expect(page).toHaveURL(/\/claims\/new$/);

  await page.locator('#incidentDate').fill(input.incidentDate);
  await page.locator('#incidentLocation').fill(input.incidentLocation);
  await page.locator('#claimAmount').fill(String(input.claimAmount));
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await page.locator('#description').fill(input.description);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review Your Claim' })).toBeVisible();
  await expect(page.getByText(input.incidentLocation)).toBeVisible();
  await expect(page.getByText(input.description)).toBeVisible();

  await page.getByTestId('wizard-step-3').getByRole('button', { name: 'Submit Claim', exact: true }).click();
  await expect(page.getByText(/Claim submitted successfully!/)).toBeVisible();
  await expect(page).toHaveURL(/\/claims$/);
  await expect(page.getByRole('row').filter({ hasText: input.description })).toBeVisible();
});

test('administrator can navigate dashboard, claims, and user management', async ({ page }) => {
  await signInUi(page, 'admin');
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

  await page.getByRole('button', { name: 'Claims', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Claims Management' })).toBeVisible();

  await page.getByRole('button', { name: 'Users', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
});
