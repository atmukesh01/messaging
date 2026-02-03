import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SmsDashboard() {
  const [activeTab, setActiveTab] = useState('send');
  const [msg, setMsg] = useState({ to: '', message: '' });
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('activeUser');
    if (!data) navigate('/login');
    else setUser(JSON.parse(data));
  }, [navigate]);

  const handleSend = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: user.newNumber, ...msg })
    });
    alert("Message sent successfully!");
    setMsg({ to: '', message: '' });
  };

  const logout = () => {
    localStorage.removeItem('activeUser');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="font-black text-xl tracking-tighter">SMS PORTAL</h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{user.newNumber}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'send', label: 'Send Message' },
            { id: 'inbox', label: 'Inbox' },
            { id: 'sent', label: 'Sent Items' },
            { id: 'pending', label: 'Pending' },
            { id: 'deleted', label: 'Trash' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-2 rounded transition-colors text-sm font-medium ${
                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button onClick={logout} className="p-4 text-xs font-bold text-red-400 border-t border-slate-800 hover:bg-slate-800">
          LOGOUT
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-auto">
        <header className="bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
        </header>

        <main className="p-8 max-w-4xl">
          {activeTab === 'send' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border max-w-md">
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">RECIPIENT</label>
                  <input 
                    placeholder="10-digit number" 
                    className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500" 
                    value={msg.to}
                    onChange={e => setMsg({...msg, to: e.target.value.replace(/\D/g, '')})} 
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">MESSAGE</label>
                  <textarea 
                    placeholder="Write your message here..." 
                    className="w-full p-2 border rounded h-32 outline-none focus:ring-2 focus:ring-blue-500" 
                    value={msg.message}
                    onChange={e => setMsg({...msg, message: e.target.value})} 
                    required
                  />
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold transition-all">
                  SEND SMS
                </button>
              </form>
            </div>
          )}

          {activeTab !== 'send' && (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <div className="text-slate-300 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700">No Messages Found</h3>
              <p className="text-slate-400 text-sm">Your {activeTab} folder is currently empty.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}