import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/service";
import { errorMessage } from "../api/client";
import {
  dateRu,
  PageTitle,
  periodRu,
  rub,
  State,
  useLoad,
} from "../components/Common";

export function Readings() {
  const account = useLoad(api.account);
  const readings = useLoad(api.readings);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [billId, setBillId] = useState<number | null>(null);
  const consumption = account.data
    ? Number(value) - account.data.lastReading
    : 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!account.data || busy) return;
    setError("");
    setBillId(null);
    if (!Number.isSafeInteger(Number(value)) || consumption <= 0) {
      setError("Введите целое значение больше предыдущих показаний");
      return;
    }
    setBusy(true);
    try {
      const bill = await api.submitReading(Number(value));
      setBillId(bill.id);
      setValue("");
      account.reload();
      readings.reload();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle
        title="Показания счётчика"
        subtitle="Одна передача за текущий календарный месяц. Счёт формируется автоматически."
      />
      <State {...account} />
      {account.data && (
        <form className="card form-card" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Предыдущие показания, кВт·ч
              <input readOnly value={account.data.lastReading} />
            </label>
            <label>
              Текущие показания, кВт·ч
              <input
                type="number"
                required
                min={account.data.lastReading + 1}
                max={999999999}
                step={1}
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </label>
          </div>
          {value && consumption > 0 && (
            <p>
              Расход: {consumption} кВт·ч · К оплате:{" "}
              {rub(consumption * account.data.tariff)}
            </p>
          )}
          <button className="btn primary" disabled={busy}>
            {busy ? "Сохранение…" : "Передать показания"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {billId && (
        <p role="status" className="success">
          Показания сохранены.{" "}
          <Link className="text-link" to={`/bills/${billId}`}>
            Открыть счёт № {billId}
          </Link>
        </p>
      )}
      <h2>История показаний</h2>
      <State {...readings} />
      {readings.data &&
        (readings.data.length ? (
          <div className="card table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Период</th>
                  <th>Дата передачи</th>
                  <th>Предыдущие</th>
                  <th>Текущие</th>
                  <th>Расход, кВт·ч</th>
                </tr>
              </thead>
              <tbody>
                {readings.data.map((reading) => (
                  <tr key={reading.id}>
                    <td>{periodRu(reading.period)}</td>
                    <td>{dateRu(reading.createdAt)}</td>
                    <td>{reading.previousValue}</td>
                    <td>{reading.currentValue}</td>
                    <td>{reading.consumption}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="card empty">
            Показаний пока нет. Передайте первое значение счётчика.
          </p>
        ))}
    </>
  );
}
