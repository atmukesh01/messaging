import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginSms() {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState(''); 
  const [error, setError] = useState('');
  const [setupRedirect, setSetupRedirect] = useState(null); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSetupRedirect(null);

    try {
      const res = await fetch('http://127.0.0.1:5000/api/login-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          generatedNumber: identifier.toUpperCase().trim(),
          pin: pin 
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('activeUser', JSON.stringify(data.user));
        navigate('/sms-dashboard');
      } else if (res.status === 401) {
        setError("Entered PIN is wrong");
      } else if (res.status === 403) {
        setSetupRedirect(data.newNumber); 
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Server connection failed");
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md mx-auto mt-10 border border-slate-100">
      <h2 className="text-xl font-bold mb-2 text-slate-800 border-b pb-2 text-center uppercase tracking-tighter italic">Login Portal</h2>
      
      {!setupRedirect ? (
        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">User ID or Number</label>
            <input 
              placeholder="e.g. MUK396" 
              className="w-full p-3 border-2 border-slate-50 rounded-lg text-lg uppercase font-bold outline-none focus:border-indigo-500 transition-all" 
              value={identifier}
              onChange={e => setIdentifier(e.target.value)} 
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Secure PIN</label>
            <input 
              type="password"
              placeholder="••••" 
              maxLength="4"
              className="w-full p-3 border-2 border-slate-50 rounded-lg text-lg tracking-[0.3em] outline-none focus:border-indigo-500 text-center font-bold transition-all" 
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))} 
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
               <p className="text-red-600 text-[10px] font-black uppercase text-center">{error}</p>
            </div>
          )}

          <button className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all transform active:scale-95">
            ENTER DASHBOARD
          </button>
        </form>
      ) : (
        <div className="mt-4 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl text-center">
          <p className="text-amber-800 font-black uppercase text-xs mb-1">Account Found</p>
          <p className="text-[10px] text-amber-700 mb-4">You must setup a PIN to access this ID.</p>
          
          <div className="bg-white p-4 rounded-xl border border-amber-200 mb-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Registered Number</p>
            <span className="text-2xl font-mono font-black text-slate-900">{setupRedirect}</span>
          </div>

          <button 
            onClick={() => navigate('/verify')} 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all"
          >
            GO TO GET NEW NUMBER
          </button>
        </div>
      )}
    </div>
  );
}