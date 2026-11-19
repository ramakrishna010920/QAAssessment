import { expect, test } from '@playwright/test';
import { csrfHeaders, signInApi } from '../fixtures/auth';
import { claimInput } from '../fixtures/claims';

test('minimum valid claim is created and can be read back', async ({ request }) => {
  await signInApi(request, 'claimant');
  const claim = claimInput({
    incidentLocation: 'ABCDE',
    description: '1234567890',
    claimAmount: 0.01,
  });
  const createResponse = await request.post('/api/claims', {
    data: claim,
    headers: await csrfHeaders(request),
  });

  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();
  expect(created).toMatchObject({
    incidentDate: claim.incidentDate,
    incidentLocation: claim.incidentLocation,
    description: claim.description,
    claimAmount: claim.claimAmount,
    status: 'SUBMITTED',
  });
  expect(created.claimId).toBeTruthy();

  const readResponse = await request.get(`/api/claims/${created.claimId}`);
  expect(readResponse.status()).toBe(200);
  expect(await readResponse.json()).toMatchObject({
    claimId: created.claimId,
    userId: created.userId,
    claimAmount: 0.01,
  });

  const listResponse = await request.get('/api/claims');
  expect(listResponse.status()).toBe(200);
  expect((await listResponse.json()).some((item: { claimId: string }) => item.claimId === created.claimId)).toBe(true);
});

test('maximum supported claim values are accepted', async ({ request }) => {
  await signInApi(request, 'claimant');
  const claim = claimInput({
    incidentLocation: 'L'.repeat(200),
    description: 'D'.repeat(1000),
    claimAmount: 1_000_000,
  });
  const response = await request.post('/api/claims', {
    data: claim,
    headers: await csrfHeaders(request),
  });

  expect(response.status()).toBe(201);
  expect(await response.json()).toMatchObject({
    incidentLocation: claim.incidentLocation,
    description: claim.description,
    claimAmount: 1_000_000,
  });
});

test('claim validation rejects out-of-range values', async ({ request }) => {
  await signInApi(request, 'claimant');
  const baseClaim = claimInput();
  const invalidCases = [
    { incidentDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) },
    { incidentLocation: 'ABCD' },
    { description: 'too short' },
    { claimAmount: 0 },
    { claimAmount: 1_000_000.01 },
  ];
  const headers = await csrfHeaders(request);

  for (const invalidFields of invalidCases) {
    const response = await request.post('/api/claims', {
      data: { ...baseClaim, ...invalidFields },
      headers,
    });
    expect(response.status(), JSON.stringify(invalidFields)).toBe(400);
  }
});

test('claimant cannot access admin APIs', async ({ request }) => {
  await signInApi(request, 'claimant');
  expect((await request.get('/api/admin/dashboard/stats')).status()).toBe(403);
  expect((await request.get('/api/admin/users')).status()).toBe(403);
});

test('claim mutation without CSRF token is rejected', async ({ request }) => {
  await signInApi(request, 'claimant');
  const response = await request.post('/api/claims', { data: claimInput() });
  expect(response.status()).toBe(403);
});
