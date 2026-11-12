import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/service";
import { ApiError, errorMessage } from "../api/client";
import type { Credentials, Registration, User } from "../types";

interface AuthContextValue {
  user: User | null;
  login: (body: Credentials) => Promise<void>;
  register: (body: Registration) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api
      .me(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setUser(value);
      })
      .catch((error) => {
        if (
          !controller.signal.aborted &&
          !(error instanceof ApiError && error.status === 401)
        )
          setError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    const expire = () => setUser(null);
    window.addEventListener("session-expired", expire);
    return () => {
      controller.abort();
      window.removeEventListener("session-expired", expire);
    };
  }, [attempt]);

  if (loading)
    return (
      <div className="auth-page" role="status">
        Загрузка кабинета…
      </div>
    );
  if (error)
    return (
      <div className="auth-page">
        <div className="card empty" role="alert">
          <p>{error}</p>
          <button
            className="btn primary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Повторить
          </button>
        </div>
      </div>
    );

  return (
    <AuthContext.Provider
      value={{
        user,
        login: async (body) => setUser(await api.login(body)),
        register: async (body) => {
          await api.register(body);
          setUser(await api.login(body));
        },
        logout: async () => {
          await api.logout();
          setUser(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider отсутствует");
  return context;
}
