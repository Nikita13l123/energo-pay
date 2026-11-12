import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  CreditCard,
  House,
  LogOut,
  Menu,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api/client";

const navigation = [
  { to: "/", label: "Обзор", icon: House },
  { to: "/readings", label: "Показания", icon: Activity },
  { to: "/bills", label: "Счета", icon: CreditCard },
  { to: "/payments", label: "История платежей", icon: CreditCard },
  { to: "/profile", label: "Профиль", icon: UserRound },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const initials = user?.fio
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-icon">
            <Zap size={24} />
          </span>
          <span>
            <b>ЭнергоПэй</b>
            <small>Личный кабинет</small>
          </span>
          <button
            className="close-mobile"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
          >
            <X />
          </button>
        </div>
        <nav aria-label="Основное меню">
          {navigation
            .filter((item) => user?.role === "CLIENT" || item.to === "/profile")
            .map((item) => (
              <NavLink
                key={item.to}
                end={item.to === "/"}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `navlink ${isActive ? "active" : ""}`
                }
              >
                <item.icon size={19} />
                {item.label}
              </NavLink>
            ))}
          {user?.role === "EMPLOYEE" && (
            <NavLink
              to="/staff"
              onClick={() => setOpen(false)}
              className="navlink"
            >
              <Users size={19} />
              Клиенты и тариф
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          {error && <p role="alert">{error}</p>}
          <button onClick={signOut} disabled={busy}>
            <LogOut size={18} />
            {busy ? "Выход…" : "Выйти"}
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button
            className="menu-mobile"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
            aria-expanded={open}
          >
            <Menu />
          </button>
          <span className="top-caption">Оплата электроэнергии</span>
          <div className="top-right">
            <span className="avatar">{initials}</span>
            <span className="top-user">{user?.fio}</span>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      {open && (
        <button
          className="overlay"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
