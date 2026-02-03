import { useState } from 'react';

export default function FetchNum() {
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFetch = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setCopied(false);
    
    try {
      const res = await fetch('http://127.0.0.1:5000/api/fetch-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customId: userId.toUpperCase().trim() })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResult(data.newNumber);
      } else {
        setError(data.message || "ID not found");
      }
    } catch (err) {
      setError("Server connection failed. Check if backend is running.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">FIND MY NUMBER</h2>
        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Identify your assigned 10-digit number</p>
      </div>

      <form onSubmit={handleFetch} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest text-center">Enter User ID</label>
          <input 
            placeholder="MUK396" 
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-2xl uppercase outline-none focus:border-blue-600 focus:bg-white text-center transition-all"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>

        <button className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all transform active:scale-95">
          FETCH NUMBER
        </button>
      </form>

      {result && (
        <div className="mt-8 animate-in fade-in zoom-in duration-300">
          <div 
            onClick={copyToClipboard}
            className="group relative cursor-pointer p-6 bg-blue-600 rounded-2xl text-center border-4 border-white ring-4 ring-blue-600 shadow-2xl transition-all hover:bg-blue-700"
          >
            <p className="text-blue-200 text-[10px] font-black uppercase mb-1">
              {copied ? "COPIED TO CLIPBOARD!" : "CLICK TO COPY NUMBER"}
            </p>
            <p className="text-4xl font-black text-white tracking-widest">{result}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-3 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-600 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>
        </div>
      )}
    </div>
  );
}