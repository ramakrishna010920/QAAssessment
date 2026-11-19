import { expect, test } from '@playwright/test';
import { credentials } from '../fixtures/credentials';

test('valid login returns the expected role and HTTP-only auth cookies', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: credentials.claimant,
  });

  expect(response.status()).toBe(200);
  const user = await response.json();
  expect(user).toMatchObject({
    email: credentials.claimant.email,
    role: 'CLAIMANT',
  });
  expect(user.userId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  const cookieHeaders = (await response.headersArray())
    .filter((header) => header.name.toLowerCase() === 'set-cookie')
    .map((header) => header.value);
  expect(cookieHeaders.some((value) => value.startsWith('access_token=') && /httponly/i.test(value))).toBe(true);
  expect(cookieHeaders.some((value) => value.startsWith('refresh_token=') && /httponly/i.test(value))).toBe(true);
});

test('invalid password is rejected without creating an authenticated session', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: { email: credentials.claimant.email, password: 'bad-password' },
  });

  expect(response.status()).toBe(401);
  const claimsResponse = await request.get('/api/claims');
  expect(claimsResponse.status()).toBe(401);
});

test('anonymous claims request is rejected', async ({ request }) => {
  const response = await request.get('/api/claims');
  expect(response.status()).toBe(401);
});
