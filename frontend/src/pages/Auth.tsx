import { useState, type FormEvent } from "react";
import { Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api/client";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fio, setFio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login({ email: email.trim(), password });
      else await register({ fio: fio.trim(), email: email.trim(), password });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Zap size={28} />
        <div>
          <b>ЭнергоПэй</b>
          <small>Личный кабинет</small>
        </div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h1>{mode === "login" ? "Вход в кабинет" : "Создать аккаунт"}</h1>
        <div className="tabs">
          {(["login", "register"] as const).map((value) => (
            <button
              key={value}
              type="button"
              disabled={busy}
              aria-pressed={mode === value}
              className={mode === value ? "selected" : ""}
              onClick={() => {
                setMode(value);
                setError("");
                setPassword("");
              }}
            >
              {value === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>
        {mode === "register" && (
          <label>
            ФИО
            <input
              required
              maxLength={50}
              autoComplete="name"
              value={fio}
              onChange={(event) => setFio(event.target.value)}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            required
            maxLength={100}
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            maxLength={30}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {mode === "register" && (
            <span className="muted">От 8 до 30 символов</span>
          )}
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary full" disabled={busy}>
          {busy
            ? "Подождите…"
            : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
        </button>
        <p className="hint">Учебный сервис оплаты электроэнергии</p>
      </form>
    </div>
  );
}
