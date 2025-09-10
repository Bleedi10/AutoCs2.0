import type { Plan, Slot, User } from '@/types/app';

export const mockUser: User = { email: 'demo@tuapp.cl' };

export const mockPlan: Plan = {
  code: 'PRO_4',
  name: 'Pro (4 RUTs)',
  rut_quota: 4,
  active: true,
};

export const mockSlots: Slot[] = [
  { id: 1, rut: '76.543.210-5', state: 'locked' },
  { id: 2, rut: '77.888.999-K', state: 'available' },
  { id: 3, rut: '', state: 'empty' },
  { id: 4, rut: '', state: 'empty' },
];

