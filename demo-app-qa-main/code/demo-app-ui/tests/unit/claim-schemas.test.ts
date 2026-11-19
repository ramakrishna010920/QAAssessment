import { describe, expect, it } from 'vitest';
import {
  claimSubmissionSchema,
  step1Schema,
  step2Schema,
} from '../../src/features/claims/schemas/claim-schemas';

const validStep1 = {
  incidentDate: new Date('2020-01-01T00:00:00.000Z'),
  incidentLocation: 'Main St',
  claimAmount: 100,
};

const validStep2 = {
  description: 'A valid claim description',
};

describe('claim form schemas', () => {
  it('accepts inclusive minimum claim values', () => {
    expect(
      claimSubmissionSchema.safeParse({
        incidentDate: validStep1.incidentDate,
        incidentLocation: 'A'.repeat(5),
        claimAmount: 0.01,
        description: 'A'.repeat(10),
      }).success
    ).toBe(true);
  });

  it('accepts inclusive maximum claim values', () => {
    expect(
      claimSubmissionSchema.safeParse({
        incidentDate: validStep1.incidentDate,
        incidentLocation: 'A'.repeat(200),
        claimAmount: 1_000_000,
        description: 'A'.repeat(1000),
      }).success
    ).toBe(true);
  });

  it('rejects step-one values outside the supported bounds', () => {
    expect(
      step1Schema.safeParse({
        ...validStep1,
        incidentLocation: '1234',
      }).success
    ).toBe(false);
    expect(
      step1Schema.safeParse({
        ...validStep1,
        incidentLocation: 'A'.repeat(201),
      }).success
    ).toBe(false);
    expect(
      step1Schema.safeParse({
        ...validStep1,
        claimAmount: 0,
      }).success
    ).toBe(false);
    expect(
      step1Schema.safeParse({
        ...validStep1,
        claimAmount: 1_000_000.01,
      }).success
    ).toBe(false);
  });

  it('rejects a future incident date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    expect(
      step1Schema.safeParse({
        ...validStep1,
        incidentDate: futureDate,
      }).success
    ).toBe(false);
  });

  it('rejects descriptions outside the supported length', () => {
    expect(
      step2Schema.safeParse({ description: 'A'.repeat(9) }).success
    ).toBe(false);
    expect(
      step2Schema.safeParse({ description: 'A'.repeat(1001) }).success
    ).toBe(false);
  });

  it('accepts a complete claim assembled from valid step data', () => {
    expect(
      claimSubmissionSchema.safeParse({
        ...validStep1,
        ...validStep2,
      }).success
    ).toBe(true);
  });
});
