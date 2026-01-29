import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SmsDashboard() {
  const [msg, setMsg] = useState({ to: '', message: '' });
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('activeUser');
    if (!data) navigate('/login');
    else setUser(JSON.parse(data));
  }, [navigate]);

  const send = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: user.newNumber, ...msg })
    });
    alert("Sent!");
  };

  if (!user) return null;

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
      <div className="mb-4 p-2 bg-blue-50 text-blue-700 text-xs font-bold rounded">Sender: {user.newNumber}</div>
      <form onSubmit={send} className="space-y-4">
        <input placeholder="Recipient Number" className="w-full p-2 border" onChange={e => setMsg({...msg, to: e.target.value})} />
        <textarea placeholder="Message" className="w-full p-2 border" rows="4" onChange={e => setMsg({...msg, message: e.target.value})} />
        <button className="w-full bg-green-600 text-white py-2 rounded">Send SMS</button>
      </form>
    </div>
  );
}