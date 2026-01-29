import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Register from './pages/Register';
import VerifyMac from './pages/VerifyMac';
import LoginSms from './pages/LoginSms';
import SmsDashboard from './pages/SmsDashboard';

function Navigation() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const navContainerClass = isHome
    ? "flex flex-col items-center justify-center min-h-screen space-y-8"
    : "flex flex-row items-center justify-center py-6 bg-white shadow-md w-full sticky top-0 z-50 transition-all duration-500";

  const linkClass = isHome
    ? "text-4xl font-black text-blue-600 hover:text-blue-800 tracking-tighter transition-all duration-300 hover:scale-110"
    : "text-lg font-bold text-blue-600 hover:text-blue-800 mx-6 transition-all duration-300";

  return (
    <nav className={navContainerClass}>
      <div className={!isHome ? "flex flex-row" : "flex flex-col items-center space-y-6"}>
        <Link to="/register" className={linkClass}>REGISTER</Link>
        <Link to="/verify" className={linkClass}>GET NEW NUMBER</Link>
        <Link to="/login" className={linkClass}>SEND SMS</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
        <Navigation />

        <div className="flex-grow flex items-center justify-center p-8">
          <Routes>
            <Route path="/" element={null} /> {/* No content on home, nav stays centered */}
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyMac />} />
            <Route path="/login" element={<LoginSms />} />
            <Route path="/sms-dashboard" element={<SmsDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;