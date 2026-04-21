import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { auth } from '@/lib/firebase/config';
import {
  getUserProfile,
  loginWithEmail,
  loginWithGoogleProvider,
  logoutUser,
  registerWithEmail,
} from '@/services/auth/authService';
import type { AuthContextValue, LoginCredentials, RegisterCredentials } from '@/types/auth';
import type { UserProfile } from '@/types/user';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setProfile(null);
      return;
    }

    const nextProfile = await getUserProfile(currentUser.uid);
    setProfile(nextProfile);
  }

  async function login(credentials: LoginCredentials) {
    await loginWithEmail(credentials);
    await refreshProfile();
  }

  async function loginWithGoogle() {
    await loginWithGoogleProvider();
    await refreshProfile();
  }

  async function register(credentials: RegisterCredentials) {
    await registerWithEmail(credentials);
    await refreshProfile();
  }

  async function logout() {
    await logoutUser();
    setProfile(null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        const nextProfile = await getUserProfile(nextUser.uid);
        setProfile(nextProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    login,
    loginWithGoogle,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

