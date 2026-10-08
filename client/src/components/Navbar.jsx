import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { notifications } from '../api.js';

function Bell() {
  const [data, setData] = useState({ notifications: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const load = () => notifications.list().then(setData).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const toggle = async () => {
    setOpen(!open);
    if (!open && data.unread) { await notifications.readAll(); setData((d) => ({ ...d, unread: 0 })); }
  };

  return (
    <div className="bell">
      <button className="btn secondary sm" onClick={toggle} aria-label="Notifications">
        Alerts{data.unread > 0 && <span className="dot">{data.unread}</span>}
      </button>
      {open && (
        <div className="bell-panel">
          {data.notifications.length === 0 && <p className="empty small">No notifications yet.</p>}
          {data.notifications.map((n) => (
            <a key={n._id} href={n.link || '#'} className={n.read ? '' : 'unread'} onClick={(e) => { e.preventDefault(); setOpen(false); n.link && nav(n.link); }}>
              {n.text}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout, isProvider } = useAuth();
  const nav = useNavigate();
  const cls = ({ isActive }) => `link${isActive ? ' active' : ''}`;

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">PawPath</Link>
        <NavLink to="/" end className={cls}>Browse</NavLink>
        <NavLink to="/map" className={cls}>Map</NavLink>
        {user && <NavLink to="/dashboard" className={cls}>Dashboard</NavLink>}
        {user && <NavLink to="/messages" className={cls}>Messages</NavLink>}
        <span className="spacer" />
        {user ? (
          <>
            {isProvider && <Link to="/animals/new" className="btn sm">List an animal</Link>}
            <Bell />
            <NavLink to="/profile" className={cls}>{user.name.split(' ')[0]}</NavLink>
            <button className="btn secondary sm" onClick={() => { logout(); nav('/'); }}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="link">Log in</Link>
            <Link to="/register" className="btn sm">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
