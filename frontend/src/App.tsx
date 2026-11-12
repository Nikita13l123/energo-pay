import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { AuthPage } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { BillsPage, BillPage, HistoryPage } from "./pages/Payments";
import { Readings } from "./pages/Readings";
import { ProfilePage } from "./pages/Profile";
import { StaffPage } from "./pages/Staff";

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route
          index
          element={
            user?.role === "EMPLOYEE" ? (
              <Navigate to="/staff" replace />
            ) : (
              <Dashboard />
            )
          }
        />
        <Route path="readings" element={<Readings />} />
        <Route path="bills" element={<BillsPage />} />
        <Route path="bills/:id" element={<BillPage />} />
        <Route path="payments" element={<HistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="staff"
          element={
            user?.role === "EMPLOYEE" ? (
              <StaffPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
