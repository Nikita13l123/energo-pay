export interface User {
  id: number;
  fio: string;
  email: string;
  role: "CLIENT" | "EMPLOYEE";
  createdAt: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  fio: string;
}

export interface Account {
  userId: number;
  lastReading: number;
  tariff: number;
  balance: number;
}

export interface Reading {
  id: number;
  period: string;
  previousValue: number;
  currentValue: number;
  consumption: number;
  createdAt: string;
}

export interface Bill extends Reading {
  userId: number;
  tariff: number;
  amount: number;
  status: "UNPAID" | "PAID";
}

export interface Payment {
  id: number;
  billId: number;
  amount: number;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
}

export interface Client {
  id: number;
  fio: string;
  email: string;
}

export interface BillFilters {
  status: string;
  from: string;
  to: string;
}
