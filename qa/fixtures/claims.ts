import { randomUUID } from 'node:crypto';

export interface ClaimInput {
  incidentDate: string;
  incidentLocation: string;
  description: string;
  claimAmount: number;
}

export function claimInput(overrides: Partial<ClaimInput> = {}): ClaimInput {
  const nonce = randomUUID();
  return {
    incidentDate: new Date().toISOString().slice(0, 10),
    incidentLocation: `QA ${nonce.slice(0, 8)}`,
    description: `QA test claim ${nonce}`,
    claimAmount: 125.5,
    ...overrides,
  };
}
