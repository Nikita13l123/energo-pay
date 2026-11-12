import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../api/client";

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
});
export const rub = (value: number) => money.format(value);
export const dateRu = (value: string) =>
  new Date(value).toLocaleString("ru-RU");
export const periodRu = (value: string) =>
  new Date(`${value}-01T12:00:00`).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

export function useLoad<T>(loader: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setError("");
    loader(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loader, version]);

  return { data, error, loading, reload };
}

export function State({
  loading,
  error,
  reload,
}: {
  loading: boolean;
  error: string;
  reload?: () => void;
}) {
  if (loading)
    return (
      <p role="status" className="card empty">
        Загрузка…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="card empty">
        <p className="error">{error}</p>
        {reload && (
          <button className="btn" onClick={reload}>
            Повторить
          </button>
        )}
      </div>
    );
  return null;
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="page-title">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

const statuses = {
  PAID: ["Оплачен", "paid"],
  UNPAID: ["Ожидает оплаты", "unpaid"],
  SUCCESS: ["Успешно", "paid"],
  FAILED: ["Ошибка", "rejected"],
} as const;

export function Badge({ status }: { status: keyof typeof statuses }) {
  const [label, className] = statuses[status];
  return <span className={`badge ${className}`}>{label}</span>;
}
