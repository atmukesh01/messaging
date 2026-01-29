import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginSms() {
  const [num, setNum] = useState('');
  const [pin, setPin] = useState(''); // New state for PIN
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/login-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send both the number and the pin
        body: JSON.stringify({ 
          generatedNumber: num,
          pin: pin 
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('activeUser', JSON.stringify(data.user));
        navigate('/sms-dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Server connection failed");
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
      <h2 className="text-xl font-bold mb-2 text-slate-800 border-b pb-2">Step 3: SMS Login</h2>
      <p className="text-xs text-slate-500 mb-6">Enter your generated credentials to access the dashboard.</p>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Generated Number</label>
          <input 
            placeholder="10-digit number" 
            maxLength="10"
            className="w-full p-2 border rounded text-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={num}
            onChange={e => setNum(e.target.value.replace(/\D/g, ''))} 
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Secure PIN</label>
          <input 
            type="password"
            placeholder="4-digit PIN" 
            maxLength="4"
            className="w-full p-2 border rounded text-lg tracking-[0.3em] focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))} 
            required
          />
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded">
             <p className="text-red-500 text-xs font-bold text-center">{error}</p>
          </div>
        )}

        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
          ENTER DASHBOARD
        </button>
      </form>
    </div>
  );
}