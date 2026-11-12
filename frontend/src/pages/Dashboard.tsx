import { Link } from "react-router-dom";
import { ArrowRight, Activity, CreditCard } from "lucide-react";
import { api } from "../api/service";
import { PageTitle, rub, State, useLoad } from "../components/Common";

export function Dashboard() {
  const account = useLoad(api.account);
  return (
    <>
      <PageTitle
        title="Обзор кабинета"
        subtitle="Показания счётчика и оплата электроэнергии"
      />
      <State {...account} />
      {account.data && (
        <>
          <div className="stat-grid">
            <div className="card stat">
              <span>К оплате</span>
              <strong>{rub(account.data.balance)}</strong>
              <Link to="/bills" className="btn primary">
                Открыть счета <ArrowRight size={16} />
              </Link>
            </div>
            <div className="card stat">
              <span>Последние показания</span>
              <strong>
                {account.data.lastReading.toLocaleString("ru-RU")}{" "}
                <small>кВт·ч</small>
              </strong>
              <span className="muted">
                Начальное значение нового счётчика — 0
              </span>
            </div>
            <div className="card stat">
              <span>Текущий тариф</span>
              <strong>{rub(account.data.tariff)}</strong>
              <span className="muted">за 1 кВт·ч</span>
            </div>
          </div>
          <h2>Действия</h2>
          <div className="quick-grid">
            <Link className="card quick" to="/readings">
              <Activity />
              Передать показания
            </Link>
            <Link className="card quick" to="/bills">
              <CreditCard />
              Посмотреть счета
            </Link>
          </div>
        </>
      )}
    </>
  );
}
