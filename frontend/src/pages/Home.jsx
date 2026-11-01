import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, rupees } from '../api';
import {
  BRAND, ARCHITECT_NAME, ROLE, ABOUT, CONTACT_EMAIL, PHONE, WEBSITE, INSTAGRAM, ADDRESS,
  PROFILE_PHOTO, IMAGES, HERO_SLIDES, SPECIALITIES, GALLERY, REVIEWS, REFUND_POLICY, TERMS, PRIVACY
} from '../config';
import Booking from './Booking.jsx';
import Art from '../Art.jsx';

const ART = { hero: 'living', a: 'plan', b: 'detail' };

/* Shows your photo from public/images; if it is missing, shows a built-in illustration */
function Img({ name, src, pos = '50% 50%', className = '', alt = '' }) {
  const [bad, setBad] = useState(false);
  const url = src || IMAGES[name];
  if (bad || !url) return <Art scene={ART[name] || 'living'} pos={pos} className={className} alt={alt} />;
  return <img src={url} alt={alt} className={className} style={{ objectPosition: pos }} loading="lazy" onError={() => setBad(true)} />;
}

/* Big slideshow at the top: slow zoom + crossfade between photos */
function HeroSlideshow() {
  const [i, setI] = useState(0);
  const [bad, setBad] = useState({});
  useEffect(() => {
    const t = setTimeout(() => setI((n) => (n + 1) % HERO_SLIDES.length), 5500);
    return () => clearTimeout(t);
  }, [i]);
  const scenes = ['living', 'plan', 'detail'];
  return (
    <div className="slides">
      {HERO_SLIDES.map((src, n) => (
        <div key={n} className={'slide' + (n === i ? ' on' : '')} aria-hidden="true">
          {bad[n]
            ? <Art scene={scenes[n % 3]} className="slide-img" />
            : <img className="slide-img" src={src} alt="" onError={() => setBad((b) => ({ ...b, [n]: true }))} />}
        </div>
      ))}
      <div className="dots">
        {HERO_SLIDES.map((_, n) => (
          <button key={n} className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={'Show photo ' + (n + 1)} />
        ))}
      </div>
    </div>
  );
}
/* Fades a block in once when it scrolls into view */
function Reveal({ children, className = '', id }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div id={id} ref={ref} className={`reveal ${on ? 'in' : ''} ${className}`}>{children}</div>;
}

function Icon({ name }) {
  const p = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'video') return <svg {...p}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></svg>;
  if (name === 'plan') return <svg {...p}><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="11" width="8" height="10" rx="1" /><rect x="3" y="14" width="8" height="7" rx="1" /></svg>;
  return <svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
}
const iconFor = (n) => (/meet|video|online/i.test(n) ? 'video' : /floor|plan|3d/i.test(n) ? 'plan' : 'phone');

function Reviews() {
  if (REVIEWS.length === 0) return null;
  const total = REVIEWS.length;
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / total).toFixed(1);
  return (
    <Reveal className="block">
      <h2>Reviews</h2>
      <div className="rating">
        <div className="avg"><strong>{avg}</strong><span className="stars">★★★★★</span><span className="muted small">{total} reviews</span></div>
        <div className="bars">
          {[5, 4, 3, 2, 1].map((n) => {
            const c = REVIEWS.filter((r) => r.rating === n).length;
            return (
              <div className="bar" key={n}>
                <span className="stars small">{'★'.repeat(n)}</span>
                <i><b style={{ width: (c / total) * 100 + '%' }} /></i>
                <span className="small">{c}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="slider">
        {REVIEWS.map((r, i) => (
          <figure className="rcard" key={i}>
            <blockquote>{r.text}</blockquote>
            <figcaption>{r.name}</figcaption>
          </figure>
        ))}
      </div>
    </Reveal>
  );
}

function Policies() {
  return (
    <Reveal className="block" id="policies">
      <h2>Cancellation &amp; Refund Policy</h2>
      <ul className="policy-list">
        {REFUND_POLICY.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
      {[['Terms & Conditions', TERMS], ['Privacy Policy', PRIVACY]].map(([title, points]) => (
        <details className="policy" key={title}>
          <summary>{title}</summary>
          <ul>{points.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </details>
      ))}
    </Reveal>
  );
}

export default function Home() {
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [spec, setSpec] = useState(null);
  const [error, setError] = useState('');
  const bookRef = useRef(null);

  useEffect(() => { api('/services').then(setServices).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && setSpec(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const choose = (s) => {
    setSelected(s);
    setTimeout(() => bookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ADDRESS);
  const initials = ARCHITECT_NAME.replace(/^Ar\.?\s*/i, '').split(' ').map((w) => w[0]).join('').slice(0, 2);

  return (
    <div className="page">
      <section className="hero">
        <HeroSlideshow />
        <div className="hero-shade" />
        <div className="hero-copy">
          <span className="hero-brand">{BRAND}</span>
          <h1>Spaces planned with care. Budgets planned with honesty.</h1>
        </div>
      </section>

      <main className="col">
        <section className="profile">
          <div className="avatar">{PROFILE_PHOTO ? <img src={PROFILE_PHOTO} alt={ARCHITECT_NAME} /> : initials}</div>
          <div><h3>{ARCHITECT_NAME}</h3><p className="muted">{ROLE}</p></div>
        </section>

        <Reveal className="block">
          <h2>About</h2>
          <p className="about">{ABOUT}</p>
        </Reveal>

        <Reveal className="block">
          <div className="row between"><h2>Services</h2><span className="muted small">Tap to view</span></div>
          <div className="rings">
            {SPECIALITIES.map((s) => (
              <button key={s.name} className="ring" onClick={() => setSpec(s)}>
                <span className="ring-pic"><Img name={s.img} pos={s.pos} alt="" /></span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal className="block" id="calls">
          <h2>Book a consultation</h2>
          {error && <p className="error">{error}</p>}
          <div className="calls">
            {services.map((s) => (
              <button key={s.id} className={'call' + (selected?.id === s.id ? ' on' : '')} onClick={() => choose(s)}>
                <span className="badge">{rupees(s.price)}</span>
                <span className="call-icon"><Icon name="phone" /></span>
                <span className="call-text"><strong>{s.name}</strong><small>{s.description}</small></span>
                <span className="chev" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        </Reveal>

        <div id="book" ref={bookRef} className="block"><Booking service={selected} /></div>

        <Reveal className="block">
          <h2>Style gallery</h2>
          <div className="slider">
            {GALLERY.map((g, i) => (
              <figure className="shot" key={i}>
                <Img name={g.img} src={g.src} pos={g.pos} alt={g.caption} />
                <figcaption>{g.caption}</figcaption>
              </figure>
            ))}
          </div>
        </Reveal>

        <Reviews />
        <Policies />
        <footer className="foot">
  <h2>Contact us</h2>
  <div className="contact">
    <a href={`mailto:${CONTACT_EMAIL}`}><span>Email</span>{CONTACT_EMAIL}</a>
    <a href={`tel:${PHONE.replace(/\s/g, '')}`}><span>Phone</span>{PHONE}</a>
    <a href={INSTAGRAM} target="_blank" rel="noreferrer"><span>Instagram</span>Connect with us on Instagram</a>
    <a href={WEBSITE} target="_blank" rel="noreferrer"><span>Website</span>{WEBSITE.replace('https://', '')}</a>
    <a href={mapUrl} target="_blank" rel="noreferrer" className="wide"><span>Visit us</span>{ADDRESS}</a>
  </div>
  <div className="legal">
    <span>© {new Date().getFullYear()} {BRAND}</span>
    <Link to="/admin">Admin</Link>
  </div>
</footer>
      </main>

      <div className="dock">
        <a href="#calls" className="btn dark">Book Consultation</a>
        <a href={`mailto:${CONTACT_EMAIL}`} className="btn dark">Send Email</a>
      </div>

      {spec && (
        <div className="modal" onClick={() => setSpec(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <Img name={spec.img} pos={spec.pos} className="sheet-img" alt={spec.name} />
            <h3>{spec.name}</h3>
            <p>{spec.text}</p>
            <a href="#calls" className="btn dark" onClick={() => setSpec(null)}>Book a consultation</a>
          </div>
        </div>
      )}
    </div>
  );
}
