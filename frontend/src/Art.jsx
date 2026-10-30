// Built-in illustrations shown until real photos are added to public/images/.
const C = { wall: '#ebe5da', floor: '#cfc2ab', sofa: '#3b4a43', sofa2: '#4b5d54', brass: '#b08d57', trim: '#fbf8f1', rug: '#e0d5c0', plant: '#5f7a61', ink: '#1c1c1a' };

function Living() {
  return (
    <>
      <rect width="800" height="600" fill={C.wall} />
      <rect y="440" width="800" height="160" fill={C.floor} />
      <path d="M520 440V200a90 90 0 0 1 180 0v240z" fill="#fdf6e3" stroke={C.trim} strokeWidth="10" />
      <path d="M520 440V200a90 90 0 0 1 90-90v330z" fill="#f4e6c4" opacity=".6" />
      <path d="M610 110v330M520 290h180" stroke={C.trim} strokeWidth="6" />
      <path d="M250 0v165" stroke={C.ink} strokeWidth="2" />
      <path d="M212 205a38 40 0 0 1 76 0z" fill={C.brass} />
      <circle cx="250" cy="208" r="6" fill="#fff2c4" />
      <rect x="330" y="100" width="110" height="140" fill={C.trim} stroke={C.ink} strokeWidth="3" />
      <circle cx="385" cy="150" r="26" fill={C.brass} /><rect x="352" y="190" width="66" height="30" fill={C.plant} />
      <ellipse cx="290" cy="520" rx="240" ry="38" fill={C.rug} />
      <rect x="110" y="330" width="360" height="90" rx="20" fill={C.sofa2} />
      <rect x="90" y="375" width="40" height="90" rx="16" fill={C.sofa} /><rect x="450" y="375" width="40" height="90" rx="16" fill={C.sofa} />
      <rect x="100" y="395" width="380" height="65" rx="16" fill={C.sofa} />
      <rect x="150" y="345" width="70" height="60" rx="12" fill={C.brass} />
      <rect x="125" y="458" width="8" height="24" fill={C.ink} /><rect x="445" y="458" width="8" height="24" fill={C.ink} />
      <rect x="545" y="470" width="90" height="10" rx="5" fill={C.ink} /><rect x="585" y="480" width="10" height="64" fill={C.ink} />
      <path d="M580 470c-12-30 0-42 0-58h12c0 16 12 28 0 58z" fill={C.brass} />
      <path d="M586 412c-4-40 10-70 30-90" stroke={C.ink} strokeWidth="3" fill="none" />
      <path d="M690 565l8-62h44l8 62z" fill="#a98a6a" />
      <path d="M720 505c-42-40-32-92 0-112 32 20 42 72 0 112z" fill={C.plant} />
      <path d="M720 505c-60-10-80-50-70-80 40 0 78 30 70 80z" fill="#6f8b70" />
      <path d="M720 505c50-20 70-60 56-86-36 6-66 40-56 86z" fill="#547058" />
    </>
  );
}

function Plan() {
  return (
    <>
      <rect width="800" height="600" fill="#1f2e2a" />
      <g stroke="#e8e1d1" strokeWidth="6" fill="none" strokeLinecap="square">
        <path d="M120 110h560v400H120z" />
        <path d="M120 310h230M430 310h250M350 110v120M350 390v120M350 230v80" />
      </g>
      <g stroke={C.brass} strokeWidth="2" fill="none">
        <path d="M350 230a80 80 0 0 1-80 80" /><path d="M430 310a80 80 0 0 1 80 80" />
        <rect x="160" y="140" width="150" height="110" /><rect x="170" y="150" width="60" height="30" />
        <circle cx="560" cy="200" r="48" /><rect x="400" y="420" width="220" height="60" />
        <rect x="160" y="350" width="140" height="120" />
        <path d="M120 80h560M120 72v16M680 72v16" />
      </g>
      <text x="400" y="62" textAnchor="middle" fill={C.brass} fontSize="20" fontFamily="sans-serif">6000</text>
    </>
  );
}

function Detail() {
  return (
    <>
      <rect width="800" height="600" fill="#d9d0c1" />
      <path d="M240 560V260a160 160 0 0 1 320 0v300z" fill="#efe8da" />
      <path d="M240 560V260a160 160 0 0 1 160-160v460z" fill="#e4dac7" />
      <rect x="320" y="470" width="160" height="90" fill="#c3b7a2" />
      <path d="M400 470c-52-10-62-72-32-102 10-14 8-30 0-46h64c-8 16-10 32 0 46 30 30 20 92-32 102z" fill={C.brass} />
      <path d="M400 322c-10-80 20-140 70-180" stroke={C.ink} strokeWidth="3" fill="none" />
      <ellipse cx="445" cy="190" rx="22" ry="9" transform="rotate(-50 445 190)" fill={C.plant} />
      <ellipse cx="425" cy="240" rx="22" ry="9" transform="rotate(-20 425 240)" fill="#6f8b70" />
      <ellipse cx="462" cy="150" rx="20" ry="8" transform="rotate(-60 462 150)" fill="#547058" />
      <rect y="560" width="800" height="40" fill="#bfb39d" />
    </>
  );
}

const SCENES = { living: Living, plan: Plan, detail: Detail };

export default function Art({ scene = 'living', pos = '50% 50%', className = '', alt = '' }) {
  const Scene = SCENES[scene] || Living;
  // a non-centred `pos` zooms into that part of the scene, so repeated icons look different
  const [fx, fy] = pos.split(' ').map((v) => parseFloat(v) / 100);
  const zoom = pos === '50% 50%' ? 1 : 1.7;
  const w = 800 / zoom, h = 600 / zoom;
  const vb = `${(800 - w) * fx} ${(600 - h) * fy} ${w} ${h}`;
  return (
    <svg className={'ph ' + className} viewBox={vb} preserveAspectRatio="xMidYMid slice" role="img" aria-label={alt}>
      <Scene />
    </svg>
  );
}
