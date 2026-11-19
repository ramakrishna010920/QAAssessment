import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { credentials, type DemoRole } from './credentials';

export async function signInApi(
  request: APIRequestContext,
  role: DemoRole,
): Promise<void> {
  const response = await request.post('/api/auth/login', {
    data: credentials[role],
  });
  expect(response.status(), `login as ${role}`).toBe(200);
}

export async function csrfHeaders(request: APIRequestContext): Promise<Record<string, string>> {
  const response = await request.get('/api/auth/csrf');
  expect(response.status()).toBe(200);
  const csrf = (await response.json()) as { token: string; headerName: string };
  expect(csrf.token).toBeTruthy();
  expect(csrf.headerName).toBeTruthy();
  return { [csrf.headerName]: csrf.token };
}

export async function signInUi(page: Page, role: DemoRole): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials[role].email);
  await page.locator('#password').fill(credentials[role].password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(role === 'admin' ? /\/admin\/dashboard$/ : /\/claims$/);
  await page.waitForLoadState('load');
}
