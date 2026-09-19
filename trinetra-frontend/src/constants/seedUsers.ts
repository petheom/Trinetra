import type { UserRole } from '../context/TriNetraContext';

export interface RegisteredOfficer {
  badgeId: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  region: string;
}

export const DEFAULT_USERS: RegisteredOfficer[] = [
  {
    name: 'Inspector Rajesh Varma',
    badgeId: 'INSP-GJ-2041',
    passwordHash: 'GovPass#2026',
    role: 'Field Officer',
    region: 'Gujarat',
  },
  {
    name: 'Director Amit Trivedi',
    badgeId: 'ADMIN-HQ-01',
    passwordHash: 'admin123',
    role: 'Admin',
    region: 'Delhi (NCT)',
  },
  {
    name: 'Inspector Sunita Sharma',
    badgeId: 'INSP-MH-118',
    passwordHash: 'GovPass#2026',
    role: 'Field Officer',
    region: 'Maharashtra',
  },
  {
    name: 'Inspector K. Ramanathan',
    badgeId: 'INSP-TN-504',
    passwordHash: 'GovPass#2026',
    role: 'Field Officer',
    region: 'Tamil Nadu',
  },
  {
    name: 'Inspector Vikram Malhotra',
    badgeId: 'INSP-UP-902',
    passwordHash: 'GovPass#2026',
    role: 'Field Officer',
    region: 'Uttar Pradesh',
  },
];
