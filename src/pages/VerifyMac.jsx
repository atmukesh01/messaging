import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerifyUser() {
  const [aadhaar, setAadhaar] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1); 
  const [userData, setUserData] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAadhaarChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    if (formatted.length <= 14) setAadhaar(formatted);
  };

  const checkAadhaarExists = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/check-aadhaar-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar })
      });
      const data = await res.json();
      
      if (res.status === 404) {
        navigate('/'); 
      } else if (res.ok) {
        setUserData(data.user);
        setIsExistingUser(data.hasPin);
        setStep(2);
      } else {
        setError(data.message);
      }
    } catch (err) { setError("Server error"); }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    const endpoint = isExistingUser ? 'api/login-number' : 'api/update-pin';
    const payload = isExistingUser 
      ? { generatedNumber: userData.customId, pin } 
      : { aadhaar, pin };

    try {
      const res = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        if (isExistingUser) {
          localStorage.setItem('activeUser', JSON.stringify(data.user));
          navigate('/sms-dashboard');
        } else {
          setStep(3);
        }
      } else {
        setError(data.message);
      }
    } catch (err) { setError("Action failed"); }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2 text-center uppercase tracking-tighter">
        {step === 3 ? "Success" : step === 1 ? "Identity Check" : isExistingUser ? "Welcome Back" : "Security Setup"}
      </h2>

      {step === 1 && (
        <form onSubmit={checkAadhaarExists} className="space-y-4">
          <label className="block text-[10px] font-black text-slate-500 uppercase">Aadhaar Number</label>
          <input placeholder="XXXX XXXX XXXX" className="w-full p-3 border rounded font-mono text-lg outline-none focus:ring-2 focus:ring-slate-900" value={aadhaar} onChange={handleAadhaarChange} required />
          {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
          <button className="w-full bg-slate-900 text-white py-3 rounded font-bold">VERIFY IDENTITY</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleAction} className="space-y-4">
          <div className={`p-4 rounded-lg border ${isExistingUser ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200'}`}>
            <p className={`text-sm font-bold ${isExistingUser ? 'text-amber-700' : 'text-indigo-700'}`}>
              {isExistingUser ? "Account already active!" : `Verified: ${userData?.name}`}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {isExistingUser ? "Enter PIN to login." : "Create a 4-digit PIN to activate your ID."}
            </p>
          </div>

          <input type="password" placeholder="PIN" maxLength="4" className="w-full p-3 border rounded text-center text-3xl tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-slate-900" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required />
          
          {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
          
          <button className={`w-full text-white py-4 rounded-lg font-black transition-all ${isExistingUser ? 'bg-amber-600' : 'bg-slate-900'}`}>
            {isExistingUser ? "LOGIN" : "ACTIVATE NOW"}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-sm font-black text-slate-400 uppercase tracking-widest">Registration Successful</h1>
          <p className="text-slate-600 text-xs mt-1">Save your User ID for future logins</p>
          
          <div className="my-8 p-6 bg-slate-900 rounded-2xl shadow-2xl transform scale-110 border-4 border-white ring-2 ring-slate-900">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Your Login ID</p>
            <h3 className="text-5xl font-black text-white tracking-tighter italic">
              {userData?.customId}
            </h3>
          </div>

          <button onClick={() => navigate('/login')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-200 transition-all">
            GO TO LOGIN
          </button>
        </div>
      )}
    </div>
  );
}