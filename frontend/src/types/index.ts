export type Role = 'subscriber' | 'operator' | 'admin';
export interface User { id:string; fullName:string; email:string; role:Role; accountNumber:string }
export interface Account { number:string; address:string; balance:number; tariff:number; meterNumber:string; lastReading:number; averageConsumption:number }
export interface Reading { id:string; date:string; value:number; consumption:number; status:'accepted'|'pending' }
export interface Charge { id:string; period:string; amount:number; paid:number; status:'paid'|'unpaid' }
export interface Payment { id:string; date:string; amount:number; status:'paid'|'processing'|'rejected'; transactionId:string }
export interface Notification { id:string; title:string; text:string; date:string }
export interface LoginRequest { accountNumber:string; password:string }
export interface RegisterRequest { accountNumber:string; email:string; password:string; consent:boolean }
export interface AuthResponse { accessToken:string; user:User }
