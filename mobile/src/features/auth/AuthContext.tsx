import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as authApi from '../../api/endpoints/auth';
import {
  setAuthTokenProvider,
  setOnSessionExpired,
  setOnTokensRefreshed,
} from '../../api/client';
import { User } from '../../types/api';
import * as tokenStorage from './tokenStorage';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback(async (response: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => {
    await tokenStorage.save({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    });
    setUser(response.user);
  }, []);

  const clearSession = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setAuthTokenProvider(() => tokenStorage.getAccessToken());

    setOnSessionExpired(() => {
      setUser(null);
    });

    setOnTokensRefreshed((response) => {
      setUser(response.user);
    });

    return () => {
      setAuthTokenProvider(null);
      setOnSessionExpired(null);
      setOnTokensRefreshed(null);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const stored = await tokenStorage.load();
        if (!stored) {
          return;
        }

        tokenStorage.setAccessToken(stored.accessToken);
        setUser(stored.user);

        const freshUser = await authApi.getMe();
        if (!cancelled) {
          setUser(freshUser);
          if (
            freshUser.email !== stored.user.email ||
            freshUser.displayName !== stored.user.displayName
          ) {
            await tokenStorage.save({ ...stored, user: freshUser });
          }
        }
      } catch {
        if (!cancelled) {
          await tokenStorage.clear();
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      await applySession(response);
    },
    [applySession],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const response = await authApi.register({ email, password, displayName });
      await applySession(response);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const stored = await tokenStorage.load();
    if (stored?.refreshToken) {
      try {
        await authApi.logout(stored.refreshToken);
      } catch {
        // Best-effort server logout; local session is always cleared.
      }
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
