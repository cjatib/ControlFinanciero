import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  currency: 'CLP';
  onboardingCompleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

