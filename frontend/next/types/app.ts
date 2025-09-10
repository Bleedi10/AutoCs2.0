export type User = {
  email: string;
};

export type Plan = {
  code: string;
  name: string;
  rut_quota: number;
  active: boolean;
};

export type Slot = {
  id: number;
  rut: string;
  state: 'empty' | 'available' | 'locked';
};

