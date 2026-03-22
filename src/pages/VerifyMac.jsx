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
  
  // FIX: Centralized API URL for hotspot/network access
  const API_URL = import.meta.env.VITE_API_URL || 'http://10.178.83.49:5000';

  const handleAadhaarChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    if (formatted.length <= 14) setAadhaar(formatted);
  };

  const checkAadhaarExists = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // FIX: Changed 'http://localhost:5000' to `${API_URL}`
      const res = await fetch(`${API_URL}/api/login-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedNumber: aadhaar, pin: "" }) 
      });
      const data = await res.json();
      
      if (res.status === 403) {
        // New User: Store Aadhaar so we can save it later
        setUserData({ 
            newNumber: data.newNumber, 
            customId: data.customId,
            aadhaar: aadhaar // Keep track of Aadhaar
        });
        setIsExistingUser(false);
        setStep(2);
      } else if (res.status === 401 || res.ok) {
        setIsExistingUser(true);
        setStep(2);
      } else {
        alert("Aadhaar not found. Please register first.");
        navigate('/register');
      }
    } catch (err) { 
      setError("Server connection failed. Check hotspot."); 
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isExistingUser ? 'api/login-number' : 'api/setup-pin';
    
    const payload = isExistingUser 
      ? { generatedNumber: aadhaar, pin } 
      : { 
          newNumber: userData.newNumber, 
          pin, 
          customId: userData.customId, 
          aadhaar: userData.aadhaar 
        };

    try {
      // FIX: Changed 'http://localhost:5000' to `${API_URL}`
      const res = await fetch(`${API_URL}/${endpoint}`, {
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
        setError(data.message || "Action failed. Check your PIN.");
      }
    } catch (err) { 
        setError("Operation failed. Try again."); 
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md mx-auto mt-10 border border-slate-100">
      <h2 className="text-2xl font-black mb-6 text-slate-800 border-b pb-4 text-center uppercase tracking-tighter">
        {step === 3 ? "Activation Success" : step === 1 ? "Identity Check" : "Secure Your ID"}
      </h2>

      {step === 1 && (
        <form onSubmit={checkAadhaarExists} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Enter Registered Aadhaar</label>
            <input placeholder="XXXX XXXX XXXX" className="w-full p-4 border-2 border-slate-50 rounded-xl font-mono text-2xl text-center outline-none focus:border-slate-900 transition-all" value={aadhaar} onChange={handleAadhaarChange} required />
          </div>
          {error && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded">{error}</p>}
          <button className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-black transition-all shadow-lg active:scale-95">
            VERIFY IDENTITY
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleAction} className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 text-center">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Status: Identity Verified</p>
            <h3 className="text-3xl font-black text-slate-900 mb-1">{isExistingUser ? "Login Required" : "Setup PIN"}</h3>
          </div>

          <div>
            <label className="block text-[10px] font-black text-center text-slate-500 uppercase tracking-widest mb-2">
              {isExistingUser ? "Enter your 4-digit PIN" : "Create your 4-digit PIN"}
            </label>
            <input type="password" placeholder="••••" maxLength="4" className="w-full p-4 border-2 border-slate-50 rounded-xl text-center text-4xl tracking-[0.5em] font-black outline-none focus:border-blue-600 transition-all" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required />
          </div>
          
          {error && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded">{error}</p>}
          
          <button className={`w-full text-white py-4 rounded-xl font-black shadow-lg transition-all transform active:scale-95 ${isExistingUser ? 'bg-blue-600' : 'bg-slate-900'}`}>
            {isExistingUser ? "LOGIN TO DASHBOARD" : "ACTIVATE ACCOUNT"}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase italic">ID Activated</h3>
          <p className="text-slate-500 text-xs font-bold mt-2">Your secure PIN has been set successfully.</p>
          <button onClick={() => setStep(1)} className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-black shadow-xl hover:bg-blue-700 transition-all">
            GO TO LOGIN
          </button>
        </div>
      )}
    </div>
  );
}