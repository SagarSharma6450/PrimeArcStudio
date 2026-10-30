const BASE = import.meta.env.VITE_API_URL || '';

export async function api(path, { method = 'GET', body, admin = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('adminToken');
  if (admin && token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch(BASE + '/api' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401 && admin) {            // token missing/expired -> back to login
    localStorage.removeItem('adminToken');
    window.location.href = '/admin';
    throw new Error('Session expired');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || 'Something went wrong. Please try again.');
  return data;
}

export const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN');

export const fmtDate = (d, long = false) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', long
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { weekday: 'short', day: 'numeric', month: 'short' });

export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
