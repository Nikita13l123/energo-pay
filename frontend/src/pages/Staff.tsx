import { useCallback, useState, type FormEvent } from "react";
import { api } from "../api/service";
import { errorMessage } from "../api/client";
import { PageTitle, State, useLoad } from "../components/Common";
import { BillTable } from "./Payments";

function ClientBills({ userId, version }: { userId: number; version: number }) {
  const loader = useCallback(
    (signal: AbortSignal) => api.clientBills(userId, signal),
    [userId, version],
  );
  const bills = useLoad(loader);
  return (
    <>
      <h2>Счета клиента</h2>
      <State {...bills} />
      {bills.data && <BillTable bills={bills.data} link={false} />}
    </>
  );
}

export function StaffPage() {
  const clients = useLoad(api.clients);
  const account = useLoad(api.account);
  const [userId, setUserId] = useState("");
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [value, setValue] = useState("");
  const [tariff, setTariff] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(0);
  const effectiveTariff = tariff || String(account.data?.tariff ?? "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const bill = await api.manualBill({
        userId: Number(userId),
        period,
        currentValue: Number(value),
        tariff: Number(effectiveTariff),
      });
      setMessage(`Выставлен счёт № ${bill.id}`);
      setVersion((old) => old + 1);
      setValue("");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveTariff(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.updateTariff(Number(effectiveTariff));
      account.reload();
      setMessage(
        "Тариф обновлён. Ранее выставленные счета сохраняют свой тариф.",
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle
        title="Клиенты и тариф"
        subtitle="Рабочее место представителя компании"
      />
      <State {...clients} />
      <State {...account} />
      <form className="card form-card" onSubmit={saveTariff}>
        <h2>Тариф для новых счетов</h2>
        <label>
          Рублей за кВт·ч
          <input
            type="number"
            required
            min="0.01"
            max="99999.99"
            step="0.01"
            value={effectiveTariff}
            onChange={(event) => setTariff(event.target.value)}
          />
        </label>
        <button className="btn" disabled={busy || !account.data}>
          Сохранить тариф
        </button>
      </form>
      <form className="card form-card spaced" onSubmit={submit}>
        <h2>Выставить счёт вручную</h2>
        <label>
          Клиент
          <select
            required
            value={userId}
            onChange={(event) => {
              setUserId(event.target.value);
              setValue("");
            }}
          >
            <option value="">Выберите клиента</option>
            {clients.data?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fio} · {client.email}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Период
            <input
              type="month"
              required
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            />
          </label>
          <label>
            Текущие показания, кВт·ч
            <input
              type="number"
              required
              min="1"
              max="999999999"
              step="1"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
        </div>
        <p className="muted">
          Используется тариф из поля выше. Предыдущие показания и сумму
          определяет сервер.
        </p>
        <button
          className="btn primary"
          disabled={busy || !clients.data || !account.data}
        >
          Выставить счёт
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      {userId && <ClientBills userId={Number(userId)} version={version} />}
    </>
  );
}
