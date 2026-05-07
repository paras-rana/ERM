import { useEffect, useState } from 'react';
import { AuthContext } from './authContextValue';
import { WORKSPACES, isValidWorkspace } from '../lib/workspace';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const AUTH_STORAGE_KEY = import.meta.env.VITE_AUTH_STORAGE_KEY ?? 'riskapp.erm.auth';
const ACTIVE_WORKSPACE_STORAGE_KEY = 'riskapp.active-workspace';
const APP_WORKSPACE = WORKSPACES.ERM;

function readStoredSession() {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function readActiveWorkspace() {
  const workspace = window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
  return isValidWorkspace(workspace) ? workspace : null;
}

function normalizeSession(session) {
  if (!session) return null;

  return {
    ...session,
    workspace: isValidWorkspace(session.workspace) ? session.workspace : APP_WORKSPACE,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => normalizeSession(readStoredSession()));
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    async function validateSession() {
      const stored = normalizeSession(readStoredSession());
      const activeWorkspace = readActiveWorkspace();

      if (activeWorkspace && activeWorkspace !== APP_WORKSPACE) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        setSession(null);
        setAuthReady(true);
        return;
      }

      if (!stored?.token) {
        setSession(null);
        setAuthReady(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${stored.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const nextSession = normalizeSession({
          ...stored,
          user: data.user,
        });

        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        setSession(null);
      } finally {
        setAuthReady(true);
      }
    }

    void validateSession();
  }, []);

  async function login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    const nextSession = normalizeSession({
      token: data.token,
      user: data.user,
      expiresAt: data.expiresAt,
      workspace: APP_WORKSPACE,
    });

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, APP_WORKSPACE);
    setSession(nextSession);
    return nextSession;
  }

  function setWorkspace(workspace) {
    if (workspace !== APP_WORKSPACE) return;

    setSession((currentSession) => {
      if (!currentSession) return currentSession;

      const nextSession = {
        ...currentSession,
        workspace,
      };
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
      return nextSession;
    });
  }

  function logout() {
    if (readActiveWorkspace() === APP_WORKSPACE) {
      window.localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        authReady,
        isAuthenticated: Boolean(session?.token),
        token: session?.token ?? '',
        user: session?.user ?? null,
        expiresAt: session?.expiresAt ?? null,
        workspace: session?.workspace ?? APP_WORKSPACE,
        login,
        logout,
        setWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
