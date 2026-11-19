import { expect, test } from '@playwright/test';
import { csrfHeaders, signInApi } from '../fixtures/auth';
import { claimInput } from '../fixtures/claims';
import { credentials } from '../fixtures/credentials';

test('claim persists across BFF and Claims Service and follows allowed status transitions', async ({
  request,
  playwright,
}) => {
  await signInApi(request, 'claimant');
  const input = claimInput();
  const createResponse = await request.post('/api/claims', {
    data: input,
    headers: await csrfHeaders(request),
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  const admin = await playwright.request.newContext({
    baseURL: process.env.QA_BFF_URL ?? 'http://localhost:8090',
  });
  try {
    const adminLogin = await admin.post('/api/auth/login', { data: credentials.admin });
    expect(adminLogin.status()).toBe(200);
    const adminCsrfHeaders = await csrfHeaders(admin);

    const invalidTransition = await admin.patch(`/api/admin/claims/${created.claimId}/status`, {
      data: { newStatus: 'CLOSED' },
      headers: adminCsrfHeaders,
    });
    expect(invalidTransition.status()).toBe(400);

    const firstTransition = await admin.patch(`/api/admin/claims/${created.claimId}/status`, {
      data: { newStatus: 'UNDER_REVIEW' },
      headers: adminCsrfHeaders,
    });
    expect(firstTransition.status()).toBe(200);

    const secondTransition = await admin.patch(`/api/admin/claims/${created.claimId}/status`, {
      data: { newStatus: 'APPROVED' },
      headers: adminCsrfHeaders,
    });
    expect(secondTransition.status()).toBe(200);

    const readBack = await request.get(`/api/claims/${created.claimId}`);
    expect(readBack.status()).toBe(200);
    expect(await readBack.json()).toMatchObject({
      claimId: created.claimId,
      userId: created.userId,
      status: 'APPROVED',
    });

    const adminList = await admin.get('/api/admin/claims?status=APPROVED');
    expect(adminList.status()).toBe(200);
    expect(
      (await adminList.json()).some((claim: { claimId: string }) => claim.claimId === created.claimId),
    ).toBe(true);
  } finally {
    await admin.dispose();
  }
});
