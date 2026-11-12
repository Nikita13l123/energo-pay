import { request } from "./client";
import type {
  Account,
  Bill,
  BillFilters,
  Client,
  Credentials,
  Payment,
  Reading,
  Registration,
  User,
} from "../types";

export const api = {
  me: (signal?: AbortSignal) => request<User>("/auth/me", { signal }),
  login: (body: Credentials) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: Registration) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  account: (signal?: AbortSignal) => request<Account>("/account", { signal }),
  readings: (signal?: AbortSignal) =>
    request<Reading[]>("/readings", { signal }),
  submitReading: (value: number) =>
    request<Bill>("/readings", {
      method: "POST",
      body: JSON.stringify({ value }),
    }),
  bills: (filters: BillFilters, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (value) params.set(key, value);
    return request<Bill[]>(`/bills?${params}`, { signal });
  },
  bill: (id: number, signal?: AbortSignal) =>
    request<Bill>(`/bills/${id}`, { signal }),
  payments: (signal?: AbortSignal) =>
    request<Payment[]>("/payments", { signal }),
  pay: (id: number, simulateFailure: boolean) =>
    request<Payment>(`/bills/${id}/payments`, {
      method: "POST",
      body: JSON.stringify({ simulateFailure }),
    }),
  clients: (signal?: AbortSignal) =>
    request<Client[]>("/staff/clients", { signal }),
  clientBills: (userId: number, signal?: AbortSignal) =>
    request<Bill[]>(`/staff/bills?userId=${userId}`, { signal }),
  manualBill: (body: {
    userId: number;
    period: string;
    currentValue: number;
    tariff: number;
  }) =>
    request<Bill>("/staff/bills", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTariff: (tariff: number) =>
    request<void>("/staff/tariff", {
      method: "PUT",
      body: JSON.stringify({ tariff }),
    }),
};
