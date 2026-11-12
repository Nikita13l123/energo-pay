import {useEffect,useState} from 'react';
export const rub=(value:number)=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB'}).format(value);
export const dateRu=(value:string)=>new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU');
export function useLoad<T>(loader:()=>Promise<T>){const [data,setData]=useState<T|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);useEffect(()=>{let alive=true;loader().then(v=>{if(alive)setData(v);}).catch(e=>{if(alive)setError(e instanceof Error?e.message:'Ошибка загрузки');}).finally(()=>{if(alive)setLoading(false);});return ()=>{alive=false;};},[]);return {data,setData,error,loading};}
export function State({loading,error}:{loading:boolean;error:string}){if(loading)return <div className="card">Загрузка данных…</div>;if(error)return <div className="error">{error}</div>;return null;}
export function PageTitle({title,subtitle}:{title:string;subtitle?:string}){return <div className="page-title"><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>}
export function Badge({status}:{status:string}){const names:Record<string,string>={paid:'Оплачено',unpaid:'Не оплачено',processing:'В обработке',rejected:'Отклонено',accepted:'Принято',pending:'Ожидает'};return <span className={`badge ${status}`}>{names[status]||status}</span>}
