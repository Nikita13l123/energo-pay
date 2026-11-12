import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/service";
import { errorMessage } from "../api/client";
import {
  Badge,
  dateRu,
  PageTitle,
  periodRu,
  rub,
  State,
  useLoad,
} from "../components/Common";
import type { Bill, Payment } from "../types";

export function BillTable({
  bills,
  link = true,
}: {
  bills: Bill[];
  link?: boolean;
}) {
  if (!bills.length) return <p className="card empty">Счета не найдены.</p>;
  return (
    <div className="card table-scroll">
      <table>
        <thead>
          <tr>
            <th>Счёт</th>
            <th>Выставлен</th>
            <th>Период</th>
            <th>Расход, кВт·ч</th>
            <th>Тариф</th>
            <th>Сумма</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.id}>
              <td>
                {link ? (
                  <Link className="text-link" to={`/bills/${bill.id}`}>
                    № {bill.id}
                  </Link>
                ) : (
                  `№ ${bill.id}`
                )}
              </td>
              <td>{dateRu(bill.createdAt)}</td>
              <td>{periodRu(bill.period)}</td>
              <td>{bill.consumption}</td>
              <td>{rub(bill.tariff)}</td>
              <td>{rub(bill.amount)}</td>
              <td>
                <Badge status={bill.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BillsPage() {
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const invalid = Boolean(from && to && from > to);
  const loader = useCallback(
    (signal: AbortSignal) =>
      invalid ? Promise.resolve([]) : api.bills({ status, from, to }, signal),
    [status, from, to, invalid],
  );
  const bills = useLoad(loader);

  return (
    <>
      <PageTitle title="Счета" subtitle="Начисления по переданным показаниям" />
      <div className="card filters">
        <label>
          Статус
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Все счета</option>
            <option value="UNPAID">Ожидают оплаты</option>
            <option value="PAID">Оплачены</option>
          </select>
        </label>
        <label>
          Выставлены с
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          По
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <button
          className="btn"
          onClick={() => {
            setStatus("");
            setFrom("");
            setTo("");
          }}
        >
          Сбросить
        </button>
      </div>
      {invalid ? (
        <p className="error" role="alert">
          Дата начала позже даты окончания
        </p>
      ) : (
        <>
          <State {...bills} />
          {bills.data && <BillTable bills={bills.data} />}
        </>
      )}
    </>
  );
}

function PaymentTable({ payments }: { payments: Payment[] }) {
  if (!payments.length)
    return <p className="card empty">Попыток оплаты пока нет.</p>;
  return (
    <div className="card table-scroll">
      <table>
        <thead>
          <tr>
            <th>Операция</th>
            <th>Счёт</th>
            <th>Дата</th>
            <th>Сумма</th>
            <th>Результат</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>№ {payment.id}</td>
              <td>
                <Link className="text-link" to={`/bills/${payment.billId}`}>
                  № {payment.billId}
                  {payment.status === "SUCCESS" && " · Подтверждение"}
                </Link>
              </td>
              <td>{dateRu(payment.createdAt)}</td>
              <td>{rub(payment.amount)}</td>
              <td>
                <Badge status={payment.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BillPage() {
  const { id } = useParams();
  const billId = Number(id);
  const loader = useCallback(
    (signal: AbortSignal) => api.bill(billId, signal),
    [billId],
  );
  const bill = useLoad(loader);
  const payments = useLoad(api.payments);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const related =
    payments.data?.filter((payment) => payment.billId === billId) ?? [];
  const receipt = related.find((payment) => payment.status === "SUCCESS");

  async function pay(simulateFailure: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payment = await api.pay(billId, simulateFailure);
      setMessage(
        payment.status === "SUCCESS"
          ? "Счёт оплачен. Подтверждение находится ниже."
          : "Учебная ошибка оплаты. Счёт не оплачен — можно повторить попытку.",
      );
      bill.reload();
      payments.reload();
    } catch (error) {
      setError(errorMessage(error));
      bill.reload();
      payments.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link className="text-link" to="/bills">
        ← Все счета
      </Link>
      <PageTitle title={`Счёт № ${id}`} />
      <State {...bill} />
      {bill.data && (
        <section className="card form-card">
          <Badge status={bill.data.status} />
          <dl className="details">
            <dt>Период</dt>
            <dd>{periodRu(bill.data.period)}</dd>
            <dt>Выставлен</dt>
            <dd>{dateRu(bill.data.createdAt)}</dd>
            <dt>Предыдущие показания</dt>
            <dd>{bill.data.previousValue} кВт·ч</dd>
            <dt>Текущие показания</dt>
            <dd>{bill.data.currentValue} кВт·ч</dd>
            <dt>Потребление</dt>
            <dd>{bill.data.consumption} кВт·ч</dd>
            <dt>Тариф</dt>
            <dd>{rub(bill.data.tariff)} / кВт·ч</dd>
            <dt>К оплате</dt>
            <dd>
              <b>{rub(bill.data.amount)}</b>
            </dd>
          </dl>
          {bill.data.status === "UNPAID" && (
            <div className="actions">
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => pay(false)}
              >
                {busy ? "Обработка…" : "Оплатить учебный счёт"}
              </button>
              <button className="btn" disabled={busy} onClick={() => pay(true)}>
                Проверить ошибку оплаты
              </button>
            </div>
          )}
        </section>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="info-banner" role="status">
          {message}
        </p>
      )}
      <State {...payments} />
      {receipt && bill.data && (
        <section className="card form-card receipt">
          <h2>Подтверждение учебной оплаты</h2>
          <p>
            Операция № {receipt.id} · Счёт № {receipt.billId}
          </p>
          <p>
            {periodRu(bill.data.period)} · {bill.data.consumption} кВт·ч
          </p>
          <p>
            <b>{rub(receipt.amount)}</b> · {dateRu(receipt.createdAt)}
          </p>
          <p className="muted">
            Деньги не списывались. Не является фискальным чеком.
          </p>
          <button className="btn no-print" onClick={() => window.print()}>
            Распечатать
          </button>
        </section>
      )}
      <h2>Попытки оплаты</h2>
      {payments.data && <PaymentTable payments={related} />}
    </>
  );
}

export function HistoryPage() {
  const payments = useLoad(api.payments);
  return (
    <>
      <PageTitle
        title="История платежей"
        subtitle="Все попытки оплаты, начиная с последних"
      />
      <State {...payments} />
      {payments.data && <PaymentTable payments={payments.data} />}
    </>
  );
}
