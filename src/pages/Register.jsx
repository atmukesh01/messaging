import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', mobile: '', aadhaar: '', mac: '', provider: 'Airtel' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setError('');

    if (name === 'mac') {
      let cleanValue = value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
      let formatted = cleanValue.match(/.{1,2}/g)?.join(':') || cleanValue;
      if (formatted.length <= 17) {
        setForm({ ...form, mac: formatted });
      }
    } 
    else if (name === 'aadhaar') {
      let cleanValue = value.replace(/\D/g, '');
      let formatted = cleanValue.match(/.{1,4}/g)?.join(' ') || cleanValue;
      if (formatted.length <= 14) {
        setForm({ ...form, aadhaar: formatted });
      }
    }
    else if (name === 'name') {
      const onlyChars = value.replace(/[^a-zA-Z\s]/g, '');
      setForm({ ...form, name: onlyChars });
    }
    else {
      const onlyDigits = value.replace(/\D/g, '');
      setForm({ ...form, [name]: onlyDigits });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Registration Successful!");
        navigate('/verify');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
      <div className="mb-6 border-b pb-2">
        <h2 className="text-xl font-bold text-slate-800">User Details</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {/* NAME FIELD */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">FULL NAME</label>
          <input 
            name="name" 
            placeholder="Enter your name" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            value={form.name} 
            onChange={handleInputChange} 
            required 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">MOBILE NUMBER</label>
          <input 
            name="mobile" 
            placeholder="Enter 10 digits" 
            maxLength="10" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            value={form.mobile} 
            onChange={handleInputChange} 
            required 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">AADHAAR NUMBER</label>
          <input 
            name="aadhaar" 
            placeholder="XXXX XXXX XXXX" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
            value={form.aadhaar} 
            onChange={handleInputChange} 
            required 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">DEVICE MAC ADDRESS</label>
          <input 
            name="mac" 
            placeholder="XX:XX:XX:XX:XX:XX" 
            className="w-full p-2 border rounded font-mono focus:ring-2 focus:ring-blue-500 outline-none" 
            value={form.mac} 
            onChange={handleInputChange} 
            required 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">NETWORK PROVIDER</label>
          <select 
            name="provider" 
            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
            value={form.provider} 
            onChange={e => setForm({...form, provider: e.target.value})}
          >
            <option value="Airtel">Airtel (98)</option>
            <option value="Jio">Jio (63)</option>
            <option value="Vi">Vi (80)</option>
          </select>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2 rounded font-bold uppercase text-white transition-all ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Processing...' : 'Register User'}
        </button>
      </form>
    </div>
  );
}