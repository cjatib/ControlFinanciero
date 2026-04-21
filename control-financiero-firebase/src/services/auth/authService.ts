import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase/config';
import type { LoginCredentials, RegisterCredentials } from '@/types/auth';
import type { UserProfile } from '@/types/user';

function userProfileRef(uid: string) {
  return doc(db, 'users', uid);
}

function resolveProfileName(user: User, fallbackName?: string): string {
  const emailName = user.email?.split('@')[0];
  return fallbackName ?? user.displayName ?? emailName ?? 'Usuario';
}

export async function ensureUserProfile(user: User, fallbackName?: string): Promise<void> {
  const profileReference = userProfileRef(user.uid);
  const profileSnapshot = await getDoc(profileReference);

  if (!profileSnapshot.exists()) {
    await setDoc(profileReference, {
      uid: user.uid,
      name: resolveProfileName(user, fallbackName),
      email: user.email ?? '',
      currency: 'CLP',
      onboardingCompleted: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return;
  }

  await setDoc(
    profileReference,
    {
      uid: user.uid,
      name: resolveProfileName(user, profileSnapshot.data().name as string | undefined),
      email: user.email ?? '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function registerWithEmail(credentials: RegisterCredentials): Promise<void> {
  const sanitizedName = credentials.name.trim();
  const sanitizedEmail = credentials.email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, sanitizedEmail, credentials.password);

  if (sanitizedName) {
    await updateProfile(credential.user, {
      displayName: sanitizedName,
    });
  }

  await ensureUserProfile(credential.user, sanitizedName);
}

export async function loginWithEmail(credentials: LoginCredentials): Promise<void> {
  await signInWithEmailAndPassword(auth, credentials.email.trim().toLowerCase(), credentials.password);
}

export async function loginWithGoogleProvider(): Promise<void> {
  const credential = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(credential.user);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const profileSnapshot = await getDoc(userProfileRef(uid));

  if (!profileSnapshot.exists()) {
    return null;
  }

  return profileSnapshot.data() as UserProfile;
}

