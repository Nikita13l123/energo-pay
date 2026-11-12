import {http,USE_MOCKS} from './client';
import {mockAccount,mockAuth,mockCharges,mockNotifications,mockPayments,mockReadings} from '../data/mock';
import type {Account,AuthResponse,Charge,LoginRequest,Notification,Payment,Reading,RegisterRequest} from '../types';
const delay=()=>new Promise(resolve=>setTimeout(resolve,250));
const clone=<T,>(data:T):T=>structuredClone(data);
async function get<T>(url:string,mock:T):Promise<T>{if(USE_MOCKS){await delay();return clone(mock);}return (await http.get<T>(url)).data;}
export const api={
 async login(payload:LoginRequest):Promise<AuthResponse>{if(USE_MOCKS){await delay();if(!payload.accountNumber||!payload.password)throw Error('Заполните поля');return clone(mockAuth);}return (await http.post<AuthResponse>('/auth/login',payload)).data;},
 async register(payload:RegisterRequest):Promise<AuthResponse>{if(USE_MOCKS){await delay();return clone({...mockAuth,user:{...mockAuth.user,email:payload.email,accountNumber:payload.accountNumber}});}return (await http.post<AuthResponse>('/auth/register',payload)).data;},
 getAccount:()=>get<Account>('/accounts/current',mockAccount),
 getReadings:()=>get<Reading[]>('/meters/readings',mockReadings),
 async submitReading(value:number,confirmAnomaly:boolean):Promise<Reading>{if(USE_MOCKS){await delay();return {id:crypto.randomUUID(),date:new Date().toISOString().slice(0,10),value,consumption:value-mockAccount.lastReading,status:'accepted'};}return (await http.post<Reading>('/meters/readings',{value,confirmAnomaly})).data;},
 getCharges:()=>get<Charge[]>('/charges',mockCharges),
 getPayments:()=>get<Payment[]>('/payments',mockPayments),
 getNotifications:()=>get<Notification[]>('/notifications',mockNotifications),
 async createPayment(amount:number):Promise<{transactionId:string;paymentUrl?:string;status:Payment['status']}>{if(USE_MOCKS){await delay();return {transactionId:`DEMO-${crypto.randomUUID()}`,status:'processing'};}return (await http.post('/payments',{amount})).data;},
 async getReport(from:string,to:string):Promise<Blob>{if(USE_MOCKS){await delay();return new Blob([`account,reading,period\n1234567890,12345,${from} - ${to}\n`],{type:'text/csv;charset=utf-8'});}return (await http.get('/reports/readings',{params:{from,to},responseType:'blob'})).data;}
};
