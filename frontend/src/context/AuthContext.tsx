import {createContext,useContext,useState,type ReactNode} from 'react';
import {api} from '../api/service';
import type {LoginRequest,RegisterRequest,User} from '../types';
interface AuthContextValue{user:User|null;login:(v:LoginRequest)=>Promise<void>;register:(v:RegisterRequest)=>Promise<void>;logout:()=>void}
const AuthContext=createContext<AuthContextValue|null>(null);
function storedUser():User|null{try{return JSON.parse(sessionStorage.getItem('user')||'null') as User|null;}catch{return null;}}
export function AuthProvider({children}:{children:ReactNode}){const [user,setUser]=useState<User|null>(storedUser);async function apply(auth:{accessToken:string;user:User}){sessionStorage.setItem('accessToken',auth.accessToken);sessionStorage.setItem('user',JSON.stringify(auth.user));setUser(auth.user);}return <AuthContext.Provider value={{user,login:async v=>apply(await api.login(v)),register:async v=>apply(await api.register(v)),logout:()=>{sessionStorage.removeItem('accessToken');sessionStorage.removeItem('user');setUser(null);}}}>{children}</AuthContext.Provider>}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw Error('AuthProvider отсутствует');return ctx;}
