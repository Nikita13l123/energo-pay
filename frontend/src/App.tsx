import {Navigate,Route,Routes} from 'react-router-dom';
import {Layout} from './components/Layout';
import {useAuth} from './context/AuthContext';
import {AuthPage} from './pages/Auth';
import {Dashboard} from './pages/Dashboard';
import {Readings} from './pages/Readings';
import {ChargesPage,HistoryPage,PaymentPage} from './pages/Payments';
import {AccountsPage,NotificationsPage,OperatorPage,ProfilePage,ReceiptsPage,ReportsPage} from './pages/Other';
function Protected(){const {user}=useAuth();return user?<Layout/>:<Navigate to="/login" replace/>}
function Staff({children}:{children:React.ReactNode}){const {user}=useAuth();return user?.role==='operator'||user?.role==='admin'?<>{children}</>:<Navigate to="/" replace/>}
export default function App(){const {user}=useAuth();return <Routes><Route path="/login" element={user?<Navigate to="/" replace/>:<AuthPage/>}/><Route element={<Protected/>}><Route index element={<Dashboard/>}/><Route path="accounts" element={<AccountsPage/>}/><Route path="readings" element={<Readings/>}/><Route path="charges" element={<ChargesPage/>}/><Route path="payment" element={<PaymentPage/>}/><Route path="history" element={<HistoryPage/>}/><Route path="receipts" element={<ReceiptsPage/>}/><Route path="notifications" element={<NotificationsPage/>}/><Route path="profile" element={<ProfilePage/>}/><Route path="operator" element={<Staff><OperatorPage/></Staff>}/><Route path="reports" element={<Staff><ReportsPage/></Staff>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
