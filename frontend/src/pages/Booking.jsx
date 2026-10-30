import { useEffect, useState } from 'react';
import { api, rupees, fmtDate, fmtTime, loadRazorpay } from '../api';
import { BRAND } from '../config';

export default function Booking({ service }) {
  const [dates, setDates] = useState([]);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const loadDates = () => api('/dates').then(setDates).catch((e) => setError(e.message));
  const loadSlots = (d) => api('/slots?date=' + d).then(setSlots).catch((e) => setError(e.message));

  useEffect(() => { loadDates(); }, []);
  useEffect(() => { setTime(''); if (date) loadSlots(date); }, [date]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const refresh = () => { loadDates(); if (date) loadSlots(date); };

  async function pay(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!(await loadRazorpay())) throw new Error('Could not load the payment window. Check your connection.');
      // 1. server holds the slot and creates the Razorpay order
      const c = await api('/bookings', { method: 'POST', body: { serviceId: service.id, date, time, ...form } });

      const rzp = new window.Razorpay({
        key: c.keyId,
        amount: c.amount,
        currency: c.currency,
        order_id: c.orderId,
        name: BRAND,
        description: service.name,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#141414' },
        // 2. payment done -> server verifies the signature, then confirms the booking
        handler: async (r) => {
          try {
            const s = await api('/bookings/verify', {
              method: 'POST',
              body: { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }
            });
            setDone(s);
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {            // popup closed without paying: free the slot right away
            api('/bookings/release', { method: 'POST', body: { orderId: c.orderId } }).catch(() => {});
            setBusy(false);
            refresh();
          }
        }
      });
      rzp.on('payment.failed', () => setError('Payment failed. You can try again in the payment window.'));
      rzp.open();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      refresh();
    }
  }

  if (done) {
    return (
      <div className="panel done">
        <h3>Your consultation is confirmed</h3>
        <p>{done.service}</p>
        <p><strong>{fmtDate(done.date, true)}, {fmtTime(done.time)}</strong></p>
        <p>Paid {rupees(done.amount)} · Payment ID {done.paymentId}</p>
        <p>A confirmation email is on its way to {form.email}.</p>
      </div>
    );
  }

  if (!service) return <p className="muted hint">Choose a consultation above to see available dates and times.</p>;

  return (
    <form className="panel booking" onSubmit={pay}>
      <h2>Pick a time</h2>
      <p className="picked"><strong>{service.name}</strong> · {rupees(service.price)} · 1 hour</p>

      <h4>Date</h4>
      {dates.length === 0 && <p className="muted">No dates open right now. Please check back soon.</p>}
      <div className="chips">
        {dates.map((d) => (
          <button type="button" key={d} className={'chip' + (d === date ? ' on' : '')} onClick={() => setDate(d)}>
            {fmtDate(d)}
          </button>
        ))}
      </div>

      {date && (
        <>
          <h4>Time</h4>
          <div className="chips">
            {slots.map((s) => (
              <button type="button" key={s.time} disabled={!s.available}
                className={'chip' + (s.time === time ? ' on' : '')} onClick={() => setTime(s.time)}>
                {fmtTime(s.time)}
              </button>
            ))}
          </div>
        </>
      )}

      {time && (
        <>
          <h4>Your details</h4>
          <div className="fields">
            <label>Full name<input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
            <label>Mobile number<input required inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}"
              title="10-digit Indian mobile number" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
            <label>Email<input required type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
          </div>
          <button className="btn" disabled={busy}>{busy ? 'Please wait…' : `Pay ${rupees(service.price)} and confirm`}</button>
          <p className="muted small">Pay with UPI, cards or net banking through Razorpay. Your slot is held for 10 minutes while you pay. By paying you agree to our <a href="#policies">cancellation &amp; refund policy</a> and terms.</p>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
