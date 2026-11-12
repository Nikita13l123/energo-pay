import axios from 'axios';
export const USE_MOCKS=import.meta.env.VITE_USE_MOCKS !== 'false';
export const http=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL || '/api',timeout:15000});
http.interceptors.request.use(config=>{const token=sessionStorage.getItem('accessToken');if(token&&!USE_MOCKS)config.headers.Authorization=`Bearer ${token}`;return config;});
http.interceptors.response.use(response=>response,error=>{if(error.response?.status===401&&!USE_MOCKS){sessionStorage.removeItem('accessToken');sessionStorage.removeItem('user');window.location.assign('/login');}return Promise.reject(error);});
