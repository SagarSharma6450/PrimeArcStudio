import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, rupees, fmtDate, fmtTime } from '../api';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  if (!token) return <Login onLogin={setToken} />;
  const logout = () => { localStorage.removeItem('adminToken'); setToken(null); };
  return <Dashboard onLogout={logout} />;
}

function Login({ onLogin }) {
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      const { token } = await api('/admin/login', { method: 'POST', body: f });
      localStorage.setItem('adminToken', token);
      onLogin(token);
    } catch (err) { setError(err.message); }
  }
  return (
    <div className="wrap login">
      <form className="panel" onSubmit={submit}>
        <h2>Admin sign in</h2>
        <div className="fields">
          <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        </div>
        <button className="btn">Sign in</button>
        {error && <p className="error">{error}</p>}
        <p><Link to="/">Back to website</Link></p>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('appointments');
  const tabs = [['appointments', 'Appointments'], ['services', 'Services & prices'], ['availability', 'Availability']];
  return (
    <div className="wrap admin">
      <div className="row between">
        <h2>Dashboard</h2>
        <button className="btn small ghost" onClick={onLogout}>Sign out</button>
      </div>
      <nav className="chips">
        {tabs.map(([k, label]) => (
          <button key={k} className={'chip' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{label}</button>
        ))}
      </nav>
      {tab === 'appointments' && <Appointments />}
      {tab === 'services' && <Services />}
      {tab === 'availability' && <Availability />}
    </div>
  );
}

/* ---------------- Appointments ---------------- */
function Appointments() {
  const [view, setView] = useState('upcoming');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const load = () => api('/admin/appointments?view=' + view, { admin: true }).then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [view]);

  async function cancel(id) {
    if (!confirm('Cancel this appointment and free the slot? Any refund must be made from the Razorpay dashboard.')) return;
    await api(`/admin/appointments/${id}/cancel`, { method: 'PUT', admin: true });
    load();
  }

  const views = [['upcoming', 'Upcoming'], ['past', 'Completed'], ['cancelled', 'Cancelled']];
  return (
    <>
      <div className="chips">
        {views.map(([k, label]) => (
          <button key={k} className={'chip' + (view === k ? ' on' : '')} onClick={() => setView(k)}>{label}</button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {rows.length === 0 && <p className="muted">No {view} appointments.</p>}
      {rows.length > 0 && (
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Date & time</th><th>Customer</th><th>Phone</th><th>Email</th><th>Service</th><th>Amount paid</th><th>Payment ID</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{fmtDate(a.date)}<br />{fmtTime(a.startTime)}</td>
                  <td>{a.customerName}</td>
                  <td><a href={'tel:' + a.phone}>{a.phone}</a></td>
                  <td>{a.email}</td>
                  <td>{a.serviceName}</td>
                  <td>{a.paymentStatus === 'PAID' ? rupees(a.amount) : '—'}
                    {view === 'cancelled' && a.paymentStatus === 'PAID' && <div className="error small">Paid: refund needed</div>}</td>
                  <td className="small">{a.razorpayPaymentId || '—'}</td>
                  <td>{view === 'upcoming' && <button className="btn small ghost" onClick={() => cancel(a.id)}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------------- Services ---------------- */
function Services() {
  const [list, setList] = useState([]);
  const [fresh, setFresh] = useState(0);
  const [error, setError] = useState('');
  const load = () => api('/admin/services', { admin: true }).then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function save(s) {
    setError('');
    try {
      await api(s.id ? `/admin/services/${s.id}` : '/admin/services', {
        method: s.id ? 'PUT' : 'POST', admin: true, body: { ...s, price: Number(s.price) }
      });
      if (!s.id) setFresh(fresh + 1);
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <p className="muted">Prices are in rupees. Turn a service off to hide it from the website (past bookings are kept).</p>
      {error && <p className="error">{error}</p>}
      {list.map((s) => <ServiceRow key={s.id + '-' + s.name + s.price + s.active} s={s} onSave={save} />)}
      <h4>Add a service</h4>
      <ServiceRow key={'new' + fresh} s={{ name: '', description: '', price: '', active: true }} onSave={save} isNew />
    </>
  );
}

function ServiceRow({ s, onSave, isNew }) {
  const [v, setV] = useState(s);
  const set = (k, val) => setV({ ...v, [k]: val });
  return (
    <div className="panel svc">
      <div className="fields">
        <label>Name<input value={v.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label>Price (₹)<input type="number" min="1" value={v.price} onChange={(e) => set('price', e.target.value)} /></label>
        <label className="wide">Description<input value={v.description || ''} onChange={(e) => set('description', e.target.value)} /></label>
      </div>
      <div className="row between">
        <label className="check"><input type="checkbox" checked={v.active} onChange={(e) => set('active', e.target.checked)} /> Visible on website</label>
        <button className="btn small" disabled={!v.name || !v.price} onClick={() => onSave(v)}>{isNew ? 'Add service' : 'Save'}</button>
      </div>
    </div>
  );
}

/* ---------------- Availability ---------------- */
const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hourLabel = (h) => fmtTime(`${h % 24}:00`);

function Availability() {
  const [rules, setRules] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadBlocked = () => api('/admin/blocked-dates', { admin: true }).then(setBlocked);
  useEffect(() => {
    api('/admin/availability', { admin: true }).then(setRules).catch((e) => setError(e.message));
    loadBlocked();
  }, []);

  const edit = (i, k, v) => setRules(rules.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  async function saveRules() {
    setError(''); setMsg('');
    try {
      await api('/admin/availability', { method: 'PUT', admin: true, body: rules });
      setMsg('Saved');
    } catch (e) { setError(e.message); }
  }
  async function block() {
    if (!newDate) return;
    try { await api('/admin/blocked-dates', { method: 'POST', admin: true, body: { date: newDate } }); setNewDate(''); loadBlocked(); }
    catch (e) { setError(e.message); }
  }

  return (
    <>
      <h4>Weekly hours (one-hour slots)</h4>
      <div className="panel">
        {rules.map((r, i) => (
          <div className="dayrow" key={r.dayOfWeek}>
            <label className="check"><input type="checkbox" checked={r.enabled} onChange={(e) => edit(i, 'enabled', e.target.checked)} /> {DAYS[r.dayOfWeek]}</label>
            <select disabled={!r.enabled} value={r.startHour} onChange={(e) => edit(i, 'startHour', +e.target.value)}>
              {[...Array(24).keys()].map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
            </select>
            <span>to</span>
            <select disabled={!r.enabled} value={r.endHour} onChange={(e) => edit(i, 'endHour', +e.target.value)}>
              {[...Array(24).keys()].map((h) => h + 1).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
            </select>
          </div>
        ))}
        <button className="btn small" onClick={saveRules}>Save hours</button> {msg && <span className="ok">{msg}</span>}
      </div>

      <h4>Days off</h4>
      <div className="panel">
        <div className="row gap">
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <button className="btn small" onClick={block}>Block this date</button>
        </div>
        {blocked.length === 0 && <p className="muted">No blocked dates.</p>}
        {blocked.map((b) => (
          <div className="row between dayrow" key={b.id}>
            <span>{fmtDate(b.date, true)}</span>
            <button className="btn small ghost" onClick={() => api(`/admin/blocked-dates/${b.id}`, { method: 'DELETE', admin: true }).then(loadBlocked)}>Remove</button>
          </div>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </>
  );
}
