export type DemoRole = 'claimant' | 'admin';

export interface Credentials {
  email: string;
  password: string;
}

export const credentials: Record<DemoRole, Credentials> = {
  claimant: {
    email: process.env.QA_CLAIMANT_EMAIL ?? 'claimant@demo.com',
    password: process.env.QA_CLAIMANT_PASSWORD ?? 'Claimant123!',
  },
  admin: {
    email: process.env.QA_ADMIN_EMAIL ?? 'admin@demo.com',
    password: process.env.QA_ADMIN_PASSWORD ?? 'Admin123!',
  },
};
