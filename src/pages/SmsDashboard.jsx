import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SmsDashboard() {
  const [activeTab, setActiveTab] = useState('compose');
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [recipients, setRecipients] = useState(['']); 
  const [selectedGroup, setSelectedGroup] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://10.178.83.49:5000';
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('activeUser');
    if (!data) navigate('/login');
    else setUser(JSON.parse(data));
  }, [navigate]);

  const fetchData = async () => {
    if (!user || !user.newNumber) return;
    try {
      const gRes = await fetch(`${API_URL}/api/groups/${user.newNumber}`);
      if (gRes.ok) setGroups(await gRes.json());
      
      const endpoints = {
        inbox: `inbox/${user.newNumber}`,
        sent: `sent/${user.newNumber}`,
        scheduled: `scheduled/${user.newNumber}`,
        trash: `trash/${user.newNumber}`
      };

      const endpoint = endpoints[activeTab];
      if (endpoint) {
        const res = await fetch(`${API_URL}/api/${endpoint}`);
        if (res.ok) setMessages(await res.json());
      } else {
        setMessages([]);
      }
    } catch (e) { console.error("Fetch Error:", e); }
  };

  useEffect(() => { fetchData(); }, [activeTab, user]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recent";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleClearTrash = async () => {
    if (!window.confirm("Permanently delete all messages in trash? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/api/clear-trash/${user.newNumber}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        alert("Trash cleared successfully");
      }
    } catch (e) { console.error("Error clearing trash:", e); }
  };

  const handleRecipientChange = (index, val) => {
    const newRecs = [...recipients];
    newRecs[index] = val.replace(/\D/g, '');
    if (index === recipients.length - 1 && val !== '' && recipients.length < 10) newRecs.push('');
    setRecipients(newRecs);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    let toList = [];
    
    if (selectedGroup) {
      const group = groups.find(g => g.id === parseInt(selectedGroup));
      toList = group ? group.members.split(',').map(m => m.trim()) : [];
    } else {
      toList = recipients.filter(r => r.trim() !== '');
    }

    if (toList.length === 0 || !messageBody.trim()) return alert("Incomplete Details");

    try {
        const res = await fetch(`${API_URL}/api/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: user.newNumber, toList, message: messageBody, scheduledTime })
        });

        const data = await res.json();

        if (res.ok) {
            alert(scheduledTime ? "Scheduled Successfully!" : "Message Sent!");
            setRecipients(['']); setSelectedGroup(''); setMessageBody(''); setScheduledTime('');
            setActiveTab(scheduledTime ? 'scheduled' : 'sent');
            fetchData();
        } else {
            // This will show the error if numbers aren't registered
            alert(`Error: ${data.message}`);
        }
    } catch (err) {
        alert("Server connection failed");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Move to trash?")) return;
    const res = await fetch(`${API_URL}/api/delete-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, userNumber: user.newNumber })
    });
    if (res.ok) fetchData();
  };

  const getLimits = () => {
    const now = new Date();
    const max = new Date();
    max.setDate(now.getDate() + 30);
    const pad = (n) => n.toString().padStart(2, '0');
    const f = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { min: f(now), max: f(max) };
  };
  const limits = getLimits();

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-slate-200 font-sans overflow-hidden">
      <div className="w-64 bg-slate-900 text-white flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black italic text-blue-500">SMS PORTAL</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {['compose', 'inbox', 'sent', 'scheduled', 'trash', 'groups'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`w-full text-left px-4 py-3 rounded-xl uppercase text-[10px] font-black tracking-widest transition-all ${activeTab === t ? 'bg-blue-600' : 'text-slate-500 hover:bg-slate-800'}`}
            > {t.replace('-', ' ')} </button>
          ))}
          <div className="mt-8 border-t border-slate-800 pt-4">
            <button onClick={() => { localStorage.removeItem('activeUser'); navigate('/login'); }}
              className="w-full text-left px-4 py-3 rounded-xl uppercase text-[10px] font-black tracking-widest text-red-500 hover:bg-red-900/20"
            > Terminate </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-8 py-4 shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black uppercase italic text-slate-800">{activeTab}</h2>
            {activeTab === 'trash' && messages.length > 0 && (
              <button onClick={handleClearTrash} className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95">
                Empty Trash
              </button>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">My Number</p>
            <p className="font-mono font-bold text-blue-600">{user.newNumber}</p>
          </div>
        </header>

        <main className="flex-1 p-6 bg-slate-100 overflow-hidden flex flex-col items-center">
          {activeTab === 'compose' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-6xl h-full max-h-[550px] border flex gap-8 overflow-hidden">
              <div className="w-1/3 border-r pr-8 flex flex-col">
                <div className="mb-6">
                  <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Select Group</label>
                  <select 
                    value={selectedGroup} 
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl font-bold text-sm outline-none text-slate-700 appearance-none"
                  >
                    <option value="">Choose group</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.group_name}</option>
                    ))}
                  </select>
                </div>

                <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest">
                    {selectedGroup ? 'Group Members' : 'Recipients (Up to 10)'}
                </label>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {selectedGroup ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs font-mono text-slate-500 break-words">
                        {groups.find(g => g.id === parseInt(selectedGroup))?.members}
                    </div>
                  ) : (
                    recipients.map((r, i) => (
                      <input key={i} className="w-full p-3 bg-slate-50 rounded-lg font-bold text-sm outline-none border focus:border-blue-500"
                        placeholder={`Number ${i+1}`} value={r} onChange={(e) => handleRecipientChange(i, e.target.value)} maxLength="10" />
                    ))
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                    <label className="text-[10px] font-black text-blue-600 uppercase">Set Schedule (Optional)</label>
                    <input type="datetime-local" min={limits.min} max={limits.max} value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full p-3 bg-blue-50 rounded-lg mt-1 font-bold text-xs outline-none" />
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <textarea className="flex-1 w-full p-6 bg-slate-50 rounded-2xl font-medium outline-none border focus:border-blue-500 resize-none"
                  placeholder="Type message..." value={messageBody} onChange={(e) => setMessageBody(e.target.value)} />
                <button onClick={handleSend} className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">
                    {scheduledTime ? "Schedule Message" : "Dispatch Now"}
                </button>
              </div>
            </div>
          )}

          {['inbox', 'sent', 'scheduled', 'trash'].includes(activeTab) && (
            <div className="w-full max-w-6xl h-full bg-white rounded-[2rem] shadow-xl border overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length > 0 ? messages.map(m => (
                  <div key={m.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-200 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] font-black text-blue-500 uppercase">
                          {activeTab === 'inbox' ? `From: ${m.sender_number}` : `To: ${m.recipient_number}`}
                        </p>
                        {activeTab === 'scheduled' && (
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${m.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {m.status}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-700 my-1">{m.message_text}</p>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">{formatDate(m.timestamp)}</span>
                    </div>
                    {activeTab !== 'trash' && (
                      <button onClick={() => handleDeleteMessage(m.id)} className="ml-4 px-4 py-2 bg-red-50 text-red-500 text-[10px] font-black rounded-lg border border-red-100 uppercase hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        Delete
                      </button>
                    )}
                  </div>
                )) : <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs">No Records Found</div>}
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
             <div className="flex gap-8 w-full max-w-6xl h-full max-h-[550px] overflow-hidden">
                <div className="w-1/3 bg-white p-6 rounded-[2rem] border shadow-xl">
                   <h3 className="text-xs font-black uppercase text-blue-600 mb-4">New Group</h3>
                   <input id="gName" className="w-full p-3 bg-slate-50 border rounded-xl mb-2 font-bold outline-none" placeholder="Group Name" />
                   <textarea id="gMems" className="w-full h-40 p-3 bg-slate-50 border rounded-xl font-bold outline-none resize-none" placeholder="9988776655, 1122334455..." />
                   <button onClick={async () => {
                      const n = document.getElementById('gName').value;
                      const m = document.getElementById('gMems').value;
                      await fetch(`${API_URL}/api/create-group`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: n, members: m, creator: user.newNumber })
                      });
                      fetchData();
                   }} className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">Create group</button>
                </div>
                <div className="flex-1 bg-white p-6 rounded-[2rem] border shadow-xl overflow-y-auto">
                   <h3 className="text-xs font-black uppercase text-slate-400 mb-4">Available Groups</h3>
                   {groups.map(g => (
                      <div key={g.id} className="p-4 bg-slate-50 rounded-xl mb-2 border border-slate-200 flex justify-between items-center">
                         <div className="truncate pr-4">
                            <p className="font-black text-slate-800 uppercase text-sm">{g.group_name}</p>
                            <p className="text-[9px] text-blue-500 font-mono">{g.members}</p>
                         </div>
                         <button onClick={async () => { 
                           if(window.confirm("Delete group?")) { 
                             await fetch(`${API_URL}/api/delete-group/${g.id}`, { method: 'DELETE' }); 
                             fetchData(); 
                           } 
                         }} className="px-4 py-2 bg-red-50 text-red-500 font-black text-[10px] uppercase border border-red-100 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm">
                            Delete
                         </button>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}