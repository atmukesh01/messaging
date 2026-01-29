import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerifyUser() {
  const [aadhaar, setAadhaar] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1); // 1: Check Aadhaar, 2: Set PIN, 3: Success
  const [userData, setUserData] = useState(null);
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
        navigate('/'); // Redirect to Register if not found
      } else if (res.ok) {
        setUserData(data.user);
        setStep(2); // Move to Set PIN step
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Server connection failed");
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/update-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar, pin })
      });
      if (res.ok) {
        setStep(3); // Move to Success step
      } else {
        setError("Failed to set PIN");
      }
    } catch (err) {
      setError("Server connection failed");
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
      <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">
        {step === 1 ? "Verify Aadhaar" : step === 2 ? "Set Your PIN" : "Setup Complete"}
      </h2>

      {step === 1 && (
        <form onSubmit={checkAadhaarExists} className="space-y-4">
          <label className="block text-xs font-bold text-slate-600">ENTER AADHAAR NUMBER</label>
          <input 
            placeholder="XXXX XXXX XXXX" 
            className="w-full p-2 border rounded font-mono text-lg" 
            value={aadhaar} 
            onChange={handleAadhaarChange} 
            required 
          />
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">CONTINUE</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSetPin} className="space-y-4">
          <p className="text-sm text-slate-500 italic">Welcome, {userData?.name}. Please set a 4-digit PIN for your number: <b>{userData?.newNumber}</b></p>
          <input 
            type="password" 
            placeholder="Set 4-Digit PIN" 
            maxLength="4" 
            className="w-full p-2 border rounded text-center text-2xl tracking-widest"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            required
          />
          <button className="w-full bg-green-600 text-white py-2 rounded font-bold">SET PIN & FINISH</button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-4 bg-green-50 rounded-lg">
          <h1 className="text-2xl font-bold text-green-700">PIN Set Successfully!</h1>
          <p className="text-slate-600 mt-2">You can now login using your generated number.</p>
          <button onClick={() => navigate('/login')} className="mt-4 bg-slate-800 text-white px-6 py-2 rounded">Go to Login</button>
        </div>
      )}
    </div>
  );
}