import type { FullConfig } from '@playwright/test';

async function check(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3_000) });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const uiUrl = process.env.QA_UI_URL ?? 'http://localhost:3001';
  const bffUrl = process.env.QA_BFF_URL ?? 'http://localhost:8090';
  const claimsUrl = process.env.QA_CLAIMS_URL ?? 'http://localhost:8080';
  const keycloakUrl = process.env.QA_KEYCLOAK_URL ?? 'http://localhost:8180';
  const prerequisites = [
    [`${uiUrl}/login`, 'UI'],
    [`${bffUrl}/actuator/health`, 'BFF'],
    [`${claimsUrl}/actuator/health`, 'Claims Service'],
    [`${keycloakUrl}/realms/demo-app/.well-known/openid-configuration`, 'Keycloak'],
  ] as const;
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const results = await Promise.all(prerequisites.map(async ([url]) => check(url)));
    if (results.every(Boolean)) return;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  const unavailable = await Promise.all(
    prerequisites.map(async ([url, service]) => (await check(url) ? null : `${service}: ${url}`)),
  );
  throw new Error(
    `QA stack is not ready. Start the Docker Compose stack first.\n${unavailable.filter(Boolean).join('\n')}`,
  );
}
