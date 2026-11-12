import { PageTitle } from "../components/Common";
import { useAuth } from "../context/AuthContext";

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <>
      <PageTitle title="Профиль" />
      <div className="card form-card">
        <dl className="details">
          <dt>ФИО</dt>
          <dd>{user?.fio}</dd>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
          <dt>Роль</dt>
          <dd>
            {user?.role === "EMPLOYEE" ? "Представитель компании" : "Клиент"}
          </dd>
        </dl>
      </div>
    </>
  );
}
