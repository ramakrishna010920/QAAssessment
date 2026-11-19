import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

import { ClaimsEmptyState } from '../../src/features/claims/components/claims-empty-state';

describe('ClaimsEmptyState', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('explains that the user has no claims and offers a next step', () => {
    render(<ClaimsEmptyState />);

    expect(
      screen.getByRole('heading', { name: 'No claims yet' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You haven't submitted any insurance claims/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit Your First Claim' })
    ).toBeEnabled();
  });

  it('takes the user to the new-claim flow when they choose to submit', async () => {
    const user = userEvent.setup();
    render(<ClaimsEmptyState />);

    await user.click(
      screen.getByRole('button', { name: 'Submit Your First Claim' })
    );

    expect(push).toHaveBeenCalledWith('/claims/new');
  });
});
