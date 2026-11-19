import { expect, test } from '@playwright/test';
import { credentials } from '../fixtures/credentials';
import { signInUi } from '../fixtures/auth';

test('claimant can sign in and reaches their claims screen', async ({ page }) => {
  await signInUi(page, 'claimant');
  await expect(page.getByRole('heading', { name: 'My Claims' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit New Claim' })).toBeVisible();
});

test('invalid credentials stay on login and show a useful error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.claimant.email);
  await page.locator('#password').fill('incorrect-password');
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page.getByText('Invalid email or password', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
