import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { messages as api, errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { providerName } from '../utils.js';

export default function Messages() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const active = params.get('c');
  const [convos, setConvos] = useState(null);
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef(null);

  const loadConvos = () => api.conversations().then((d) => setConvos(d.conversations)).catch((e) => setError(errMsg(e)));
  const loadThread = () => active && api.thread(active).then((d) => setThread(d.messages)).catch((e) => setError(errMsg(e)));

  useEffect(() => { loadConvos(); const t = setInterval(loadConvos, 10000); return () => clearInterval(t); }, []);
  useEffect(() => { setThread([]); loadThread(); const t = setInterval(loadThread, 4000); return () => clearInterval(t); }, [active]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [thread.length]);

  const other = (c) => c.participants.find((p) => p._id !== user.id) || c.participants[0];
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try { await api.send(active, text); setText(''); loadThread(); loadConvos(); } catch (err) { setError(errMsg(err)); }
  };
  const current = convos?.find((c) => c._id === active);

  return (
    <div>
      <h1>Messages</h1>
      {error && <div className="alert error">{error}</div>}
      <div className="chat">
        <div className="card convo-list">
          {convos === null && <p className="empty small">Loading…</p>}
          {convos?.length === 0 && <p className="empty small">No conversations yet. Message a shelter from an animal's page.</p>}
          {convos?.map((c) => (
            <button key={c._id} className={`convo${c._id === active ? ' active' : ''}`} onClick={() => setParams({ c: c._id })}>
              <strong>{providerName(other(c))}</strong>
              {c.animal && <span className="muted small"> · {c.animal.name}</span>}
              <div className="muted small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</div>
            </button>
          ))}
        </div>
        <div className="card thread">
          {!active ? <p className="empty">Select a conversation.</p> : (
            <>
              {current && <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid var(--line)' }}><strong>{providerName(other(current))}</strong>{current.animal && <span className="muted small"> · about {current.animal.name}</span>}</div>}
              <div className="thread-body">
                {thread.map((m) => <div key={m._id} className={`bubble${m.sender === user.id ? ' me' : ''}`}>{m.text}</div>)}
                <div ref={endRef} />
              </div>
              <form className="composer" onSubmit={send}>
                <input placeholder="Write a message…" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
                <button className="btn">Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
