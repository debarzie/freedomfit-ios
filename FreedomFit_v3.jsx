import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   FREEDOMFIT v3
   – Unlimited manual workouts per day (screenshot required)
   – Screenshots stored as base64, visible in Dom dashboard
   – Dom can delete individual workouts incl. screenshot review
   – All v2 features retained
═══════════════════════════════════════════════════════════════ */

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --bg:       #080810;
  --s1:       #0f0f1a;
  --s2:       #161625;
  --s3:       #1e1e30;
  --border:   #252538;
  --acc:      #a78bfa;
  --acc2:     #7c3aed;
  --rose:     #f472b6;
  --gold:     #fbbf24;
  --red:      #f87171;
  --green:    #34d399;
  --text:     #e2e8f0;
  --muted:    #4e5270;
  --muted2:   #6b7280;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.app {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* ambient glow */
.app::before {
  content:'';
  position:fixed; top:0; left:50%; transform:translateX(-50%);
  width:600px; height:400px; pointer-events:none; z-index:0;
  background: radial-gradient(ellipse at 40% 0%, rgba(167,139,250,0.07) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 100%, rgba(244,114,182,0.04) 0%, transparent 60%);
}

.page { position:relative; z-index:1; padding-bottom:90px; }

/* ── TYPOGRAPHY ── */
.display {
  font-family:'Cinzel Decorative',serif;
  background: linear-gradient(135deg, var(--acc) 0%, var(--rose) 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}

.label {
  font-size:10px; letter-spacing:3px; text-transform:uppercase; color:var(--muted2);
}

/* ── HEADER ── */
.hdr {
  padding:20px 20px 14px;
  border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between;
}
.hdr-title { font-family:'Cinzel Decorative',serif; font-size:18px; color:var(--acc); }
.hdr-right { display:flex; align-items:center; gap:10px; }
.pill {
  display:flex; align-items:center; gap:6px;
  background:var(--s2); border:1px solid var(--border);
  border-radius:20px; padding:5px 12px; font-size:12px; color:var(--muted2);
}
.dot { width:7px;height:7px;border-radius:50%; }
.dot-sub  { background:var(--green); box-shadow:0 0 6px var(--green); }
.dot-dom  { background:var(--rose);  box-shadow:0 0 6px var(--rose);  }
.icon-btn {
  background:none; border:1px solid var(--border); border-radius:10px;
  padding:6px 10px; color:var(--muted2); cursor:pointer; font-size:12px;
  transition:border-color .2s,color .2s;
}
.icon-btn:hover { border-color:var(--red); color:var(--red); }

/* ── LOGIN ── */
.login-wrap {
  min-height:100vh; display:flex; flex-direction:column;
  align-items:center; justify-content:center; padding:40px 24px; gap:28px;
}
.login-logo { text-align:center; }
.login-logo .display { font-size:30px; }
.login-logo p { font-size:11px; letter-spacing:4px; color:var(--muted2); margin-top:6px; }

.card {
  background:var(--s1); border:1px solid var(--border);
  border-radius:20px; padding:24px; width:100%;
}

.tabs { display:flex; background:var(--s2); border-radius:12px; padding:3px; gap:3px; margin-bottom:16px; }
.tab {
  flex:1; padding:10px; border:none; border-radius:9px; background:none;
  color:var(--muted2); font-family:'DM Sans',sans-serif; font-size:13px;
  font-weight:600; cursor:pointer; transition:all .2s; letter-spacing:.5px;
}
.tab.on { background:var(--s1); color:var(--acc); box-shadow:0 0 10px rgba(167,139,250,.15); }
.tab.on.dom { color:var(--rose); }

.field-wrap { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
.field-wrap .label { margin-bottom:2px; }

input.field, select.field {
  background:var(--s2); border:1px solid var(--border); border-radius:12px;
  padding:13px 15px; color:var(--text); font-family:'DM Sans',sans-serif;
  font-size:15px; outline:none; width:100%; transition:border-color .2s,box-shadow .2s;
  appearance:none;
}
input.field:focus, select.field:focus {
  border-color:var(--acc); box-shadow:0 0 0 3px rgba(167,139,250,.1);
}

.btn {
  width:100%; padding:15px; border:none; border-radius:14px;
  font-family:'Cinzel Decorative',serif; font-size:12px; font-weight:700;
  letter-spacing:2px; cursor:pointer; transition:all .2s; margin-top:4px;
}
.btn-acc  { background:linear-gradient(135deg,var(--acc),var(--acc2)); color:#fff; box-shadow:0 4px 18px rgba(124,58,237,.3); }
.btn-acc:hover  { transform:translateY(-1px); box-shadow:0 6px 24px rgba(124,58,237,.4); }
.btn-rose { background:linear-gradient(135deg,var(--rose),#e879f9); color:#fff; box-shadow:0 4px 18px rgba(244,114,182,.3); }
.btn-rose:hover { transform:translateY(-1px); }
.btn-ghost {
  background:var(--s2); border:1px solid var(--border); color:var(--text);
  font-family:'DM Sans',sans-serif; font-weight:600; font-size:13px; letter-spacing:0;
  box-shadow:none; margin-top:0;
}
.btn-ghost:hover { border-color:var(--acc); }
.btn-danger {
  background:rgba(248,113,113,.08); border:1px solid rgba(248,113,113,.25);
  color:var(--red); font-family:'DM Sans',sans-serif; font-weight:600;
  font-size:13px; letter-spacing:0; box-shadow:none; margin-top:0;
}
.btn-danger:hover { background:rgba(248,113,113,.18); }
.btn:disabled { opacity:.35; pointer-events:none; }
.btn-sm { padding:9px 14px; font-size:11px; border-radius:10px; width:auto; margin-top:0; }

/* ── SECTIONS ── */
.sec { padding:18px 20px; }
.sec + .sec { padding-top:0; }

/* ── FREEDOM METER ── */
.meter-card {
  background:var(--s1); border:1px solid var(--border);
  border-radius:22px; padding:26px 22px; text-align:center; position:relative; overflow:hidden;
}
.meter-card::after {
  content:''; position:absolute; top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--acc),transparent);
}
.meter-big {
  font-family:'Cinzel Decorative',serif; font-size:54px; line-height:1;
  background:linear-gradient(135deg,var(--gold),var(--acc));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.meter-sub { font-size:12px; color:var(--muted2); margin-top:4px; }
.bar-wrap { height:5px; background:var(--s3); border-radius:3px; margin:18px 0 8px; overflow:hidden; }
.bar-fill {
  height:100%; border-radius:3px; transition:width .6s cubic-bezier(.4,0,.2,1);
  background:linear-gradient(90deg,var(--acc2),var(--acc),var(--rose));
  box-shadow:0 0 10px rgba(167,139,250,.4);
}
.bar-labels { display:flex; justify-content:space-between; font-size:11px; color:var(--muted); }

/* ── STREAK ROW ── */
.stat-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
.stat-card {
  background:var(--s1); border:1px solid var(--border);
  border-radius:14px; padding:14px; text-align:center;
}
.stat-val { font-family:'Cinzel Decorative',serif; font-size:26px; color:var(--gold); }
.stat-lbl { font-size:10px; color:var(--muted2); letter-spacing:1.5px; margin-top:3px; }

/* ── ALERT CARDS ── */
.alert {
  border-radius:14px; padding:14px 16px;
  display:flex; align-items:flex-start; gap:12px; margin-bottom:10px;
}
.alert-icon { font-size:18px; flex-shrink:0; margin-top:1px; }
.alert-body { font-size:13px; line-height:1.6; }
.alert-warn  { background:rgba(248,113,113,.07);  border:1px solid rgba(248,113,113,.22); color:var(--red); }
.alert-gold  { background:rgba(251,191,36,.07);   border:1px solid rgba(251,191,36,.2);  color:var(--gold); }
.alert-green { background:rgba(52,211,153,.07);   border:1px solid rgba(52,211,153,.2);  color:var(--green); }
.alert-acc   { background:rgba(167,139,250,.07);  border:1px solid rgba(167,139,250,.2); color:var(--acc); }

/* ── WORKOUT FORM ── */
.wform { background:var(--s1); border:1px solid var(--border); border-radius:20px; padding:20px; }
.wform .field-wrap { margin-bottom:0; }
.wform > * + * { margin-top:12px; }

.intensity-row { display:flex; background:var(--s2); border-radius:10px; padding:3px; }
.int-btn {
  flex:1; padding:11px 8px; border:none; border-radius:8px; background:none;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:all .2s; color:var(--muted2);
}
.int-btn.on-hi { background:linear-gradient(135deg,var(--acc),var(--acc2)); color:#fff; box-shadow:0 2px 10px rgba(124,58,237,.3); }
.int-btn.on-lo { background:var(--s1); color:var(--text); }

.reward-preview {
  background:var(--s2); border-radius:10px; padding:11px 14px;
  text-align:center; font-size:13px; font-weight:600; color:var(--acc);
}

.unverified-badge {
  display:inline-block; font-size:10px; letter-spacing:1px;
  background:rgba(251,191,36,.12); border:1px solid rgba(251,191,36,.3);
  color:var(--gold); border-radius:6px; padding:2px 7px; margin-left:6px;
}

/* ── WORKOUT LIST ── */
.wo-item {
  background:var(--s1); border:1px solid var(--border);
  border-radius:13px; padding:13px 15px;
  display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;
}
.wo-left { display:flex; flex-direction:column; gap:2px; }
.wo-date { font-size:11px; color:var(--muted2); }
.wo-name { font-size:14px; font-weight:600; }
.hi-chip {
  display:inline-block; font-size:10px; margin-left:6px;
  background:rgba(167,139,250,.12); border:1px solid rgba(167,139,250,.25);
  color:var(--acc); border-radius:5px; padding:1px 6px;
}
.wo-earned { font-size:13px; font-weight:700; color:var(--gold); }

/* ── REDEEM ── */
.redeem-card {
  background:linear-gradient(135deg,rgba(167,139,250,.07),rgba(244,114,182,.04));
  border:1px solid rgba(167,139,250,.18); border-radius:20px;
  padding:24px; text-align:center; display:flex; flex-direction:column; gap:14px;
}
.redeem-big { font-family:'Cinzel Decorative',serif; font-size:42px; color:var(--gold); }

.days-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
.day-chip {
  aspect-ratio:1; border-radius:8px; display:flex; align-items:center;
  justify-content:center; font-size:11px; font-weight:600; letter-spacing:.5px;
  border:1px solid var(--border); background:var(--s2); color:var(--muted2);
}
.day-chip.active { background:rgba(52,211,153,.12); border-color:rgba(52,211,153,.3); color:var(--green); }
.day-chip.today  { border-color:var(--acc); color:var(--acc); background:rgba(167,139,250,.1); }

/* ── DOM PANEL ── */
.dom-hdr {
  background:linear-gradient(135deg,rgba(244,114,182,.08),rgba(232,121,249,.04));
  border-bottom:1px solid rgba(244,114,182,.18); padding:20px; text-align:center;
}
.dom-title { font-family:'Cinzel Decorative',serif; font-size:19px; color:var(--rose); }
.dom-sub   { font-size:11px; letter-spacing:3px; color:var(--muted2); margin-top:4px; }

.dom-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
.dom-stat { background:var(--s1); border:1px solid var(--border); border-radius:14px; padding:14px; text-align:center; }
.dom-stat-val { font-family:'Cinzel Decorative',serif; font-size:22px; color:var(--rose); }
.dom-stat-lbl { font-size:10px; color:var(--muted2); letter-spacing:1px; margin-top:3px; }

.toggle-row {
  display:flex; align-items:center; justify-content:space-between;
  background:var(--s1); border:1px solid var(--border); border-radius:13px; padding:14px 15px;
  margin-bottom:8px;
}
.toggle-label { font-size:13px; }
.toggle-switch {
  width:44px; height:24px; border-radius:12px; cursor:pointer;
  position:relative; transition:background .2s; flex-shrink:0;
  border:1px solid var(--border);
}
.toggle-thumb {
  position:absolute; top:2px; width:18px; height:18px;
  border-radius:50%; background:#fff; transition:left .2s;
}

.window-row {
  background:var(--s1); border:1px solid var(--border); border-radius:13px;
  padding:13px 15px; margin-bottom:8px;
  display:flex; align-items:center; justify-content:space-between;
}
.window-info { font-size:13px; }
.window-time { font-size:11px; color:var(--muted2); margin-top:2px; }

.row { display:flex; gap:8px; align-items:flex-end; }
.row .field-wrap { flex:1; }

/* ── DOM WEEKDAY GRID ── */
.wday-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
.wday-btn {
  aspect-ratio:1; border-radius:9px; border:1px solid var(--border);
  background:var(--s2); color:var(--muted2); font-size:11px; font-weight:600;
  cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center;
}
.wday-btn.on { background:rgba(52,211,153,.12); border-color:rgba(52,211,153,.35); color:var(--green); }

/* ── NAV ── */
.nav {
  position:fixed; bottom:0; left:50%; transform:translateX(-50%);
  width:100%; max-width:430px;
  background:rgba(8,8,16,.92); backdrop-filter:blur(20px);
  border-top:1px solid var(--border); display:flex; padding:8px 0 24px; z-index:100;
}
.nav-btn {
  flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;
  background:none; border:none; cursor:pointer; padding:7px 4px; transition:all .2s;
}
.nav-icon { font-size:20px; }
.nav-lbl { font-size:10px; letter-spacing:.5px; color:var(--muted2); transition:color .2s; }
.nav-btn.on .nav-lbl { color:var(--acc); }
.nav-btn.on.dom .nav-lbl { color:var(--rose); }
.nav-btn.on .nav-icon { filter:drop-shadow(0 0 5px var(--acc)); }
.nav-btn.on.dom .nav-icon { filter:drop-shadow(0 0 5px var(--rose)); }

/* ── TOAST ── */
.toast {
  position:fixed; top:18px; left:50%; transform:translateX(-50%);
  background:var(--s1); border:1px solid var(--acc); border-radius:13px;
  padding:13px 20px; font-size:13px; z-index:9999; white-space:nowrap;
  animation:toastIn .25s ease; box-shadow:0 0 18px rgba(167,139,250,.25);
}
.toast.danger { border-color:var(--red); box-shadow:0 0 18px rgba(248,113,113,.25); }
.toast.ok     { border-color:var(--green); box-shadow:0 0 18px rgba(52,211,153,.25); }
@keyframes toastIn {
  from { opacity:0; transform:translate(-50%,-8px); }
  to   { opacity:1; transform:translate(-50%,0); }
}

.empty { text-align:center; padding:36px 20px; color:var(--muted2); font-size:13px; line-height:1.8; }
.divider { height:1px; background:var(--border); margin:4px 0; }

/* ── SCREENSHOT ── */
.screenshot-upload {
  border:2px dashed var(--border); border-radius:14px;
  padding:20px; text-align:center; cursor:pointer;
  transition:border-color .2s, background .2s;
  position:relative; overflow:hidden;
}
.screenshot-upload:hover { border-color:var(--acc); background:rgba(167,139,250,.04); }
.screenshot-upload.has-img { border-style:solid; border-color:var(--green); padding:0; }
.screenshot-upload input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
.screenshot-preview {
  width:100%; border-radius:12px; display:block; max-height:200px; object-fit:cover;
}
.screenshot-label { font-size:13px; color:var(--muted2); margin-top:6px; }
.screenshot-icon { font-size:28px; margin-bottom:6px; }
.screenshot-required {
  font-size:11px; color:var(--red); letter-spacing:1px; margin-top:4px;
}

/* ── DOM SCREENSHOT VIEWER ── */
.wo-screenshot {
  width:100%; border-radius:10px; margin-top:8px; object-fit:cover; max-height:160px; display:block;
  border:1px solid var(--border);
}
.wo-item-expanded { flex-direction:column; align-items:stretch; }
.wo-item-top { display:flex; align-items:center; justify-content:space-between; }
`;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const HIGH_BPM_MINS = 15;
const HIGH_REWARD   = 1;       // min per interval
const LOW_BPM_MINS  = 20;
const LOW_REWARD    = 0.25;
const BASE_MAX      = 5;
const STREAK_BONUS  = 2;
const MAX_CAP       = 15;
const MIN_TRAIN     = 10;      // minutes to stop penalty
const MIN_EARN_SAVE = 5;       // must have earned >= 5 min to use save

const DAYS_DE   = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const DAYS_FULL = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0,10);
const nowHHMM  = () => {
  const n = new Date();
  return n.getHours()*60 + n.getMinutes();
};
const getISOWeek = (d=new Date()) => {
  const tmp = new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate()+4-(tmp.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
  return Math.ceil((((tmp-yearStart)/86400000)+1)/7);
};
const currentWeekKey = () => {
  const n=new Date();
  return `${n.getFullYear()}-W${String(getISOWeek(n)).padStart(2,"0")}`;
};
// 0=Sun,1=Mon,…,6=Sat → mapped to our Mo=0..So=6
const todayDayIndex = () => {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
};

const calcReward = (mins, hi) =>
  hi ? Math.floor(mins/HIGH_BPM_MINS)*HIGH_REWARD
     : Math.floor(mins/LOW_BPM_MINS)*LOW_REWARD;

const fmtMin = (m) => {
  if (m <= 0) return "0m";
  if (m < 1)  return `${Math.round(m*60)}s`;
  const whole = Math.floor(m);
  const secs  = Math.round((m - whole)*60);
  return secs > 0 ? `${whole}m ${secs}s` : `${whole}m`;
};
const fmtDate = (iso) => new Date(iso).toLocaleDateString("de-DE",{day:"2-digit",month:"short"});
const hhmm2mins = (s) => { const [h,m]=s.split(":").map(Number); return h*60+m; };

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const SK = "ff2_";
const load  = (k,fb={}) => { try{ const r=localStorage.getItem(SK+k); return r?{...fb,...JSON.parse(r)}:fb; }catch{return fb;} };
const save  = (k,v)    => { try{ localStorage.setItem(SK+k,JSON.stringify(v)); }catch{} };
const loadA = (k,fb=[]) => { try{ const r=localStorage.getItem(SK+k); return r?JSON.parse(r):fb; }catch{return fb;} };

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
const mkSub = () => ({
  freedomMins:    0,
  weeklyMax:      BASE_MAX,
  savingStreak:   0,
  trainStreak:    0,
  missedDays:     0,
  lastTrained:    null,
  lastPenalty:    null,
  weekStart:      currentWeekKey(),
  savedThisWeek:  false,     // locked save flag
  weekEarned:     0,         // mins earned THIS calendar week
  savedWeekKey:   null,      // which week was saved
  pendingRedeem:  null,      // { mins, at }
  domLinked:      null,      // dom username
  workouts:       [],
  domLog:         [],
});

const mkDom = () => ({
  requireApproval: false,
  redeemDays:    [],         // [0..6] Mo=0 Su=6
  windows:       [],         // [{id,day,from,to}]
  linkedSubs:    [],
});

// ─── WEEKLY RESET ─────────────────────────────────────────────────────────────
const applyWeeklyReset = (sub) => {
  const wk = currentWeekKey();
  if (sub.weekStart !== wk) {
    return {
      ...sub,
      weekStart:     wk,
      weekEarned:    0,
      savedThisWeek: false,
      savedWeekKey:  null,
    };
  }
  return sub;
};

// ─── PENALTY CHECK ────────────────────────────────────────────────────────────
const applyPenalties = (sub) => {
  const todayStr = todayISO();
  if (!sub.lastPenalty || sub.lastPenalty === todayStr) return sub;
  const diffDays = Math.round(
    (new Date(todayStr)-new Date(sub.lastPenalty))/86400000
  );
  if (diffDays < 1) return sub;

  let s = {...sub};
  for (let i=0;i<diffDays;i++){
    const chkDate = new Date(sub.lastPenalty);
    chkDate.setDate(chkDate.getDate()+i+1);
    const ds = chkDate.toISOString().slice(0,10);
    const had = s.workouts.some(w=>w.date===ds && w.duration>=MIN_TRAIN);
    if (had){ s.missedDays=0; continue; }
    s.missedDays = (s.missedDays||0)+1;
    if      (s.missedDays===1) s.freedomMins *= (1-0.20);
    else if (s.missedDays===2) s.freedomMins *= (1-0.30);
    else if (s.missedDays===3) s.freedomMins *= (1-0.50);
    else if (s.missedDays>=4)  s.freedomMins  = 0;
    s.freedomMins = Math.max(0, s.freedomMins);
  }
  s.lastPenalty = todayStr;
  return s;
};

// ─── FREEDOM WINDOW CHECK ─────────────────────────────────────────────────────
const activeWindow = (windows=[]) => {
  const day = todayDayIndex();
  const now = nowHHMM();
  return windows.find(w =>
    Number(w.day)===day &&
    hhmm2mins(w.from) <= now &&
    now < hhmm2mins(w.to)
  ) || null;
};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App(){
  // Auth
  const [users,  setUsers ] = useState(()=>loadA("users",[]) );
  const [me,     setMe    ] = useState(null); // {name,role}
  const [lMode,  setLMode ] = useState("sub");
  const [lName,  setLName ] = useState("");
  const [lPass,  setLPass ] = useState("");
  const [lReg,   setLReg  ] = useState(false);

  // State
  const [sub,    setSub   ] = useState(mkSub());
  const [dom,    setDom   ] = useState(mkDom());

  // UI
  const [tab,    setTab   ] = useState("home");
  const [toast,  setToast ] = useState(null);

  // Workout form
  const [wDur,   setWDur  ] = useState("30");
  const [wHi,    setWHi   ] = useState(true);
  const [wNote,  setWNote ] = useState("");
  const [wScreenshot, setWScreenshot] = useState(null); // base64 string

  // Dom form
  const [domSub,  setDomSub ] = useState("");
  const [adjAmt,  setAdjAmt ] = useState("");
  const [winDay,  setWinDay ] = useState("0");
  const [winFrom, setWinFrom] = useState("06:00");
  const [winTo,   setWinTo  ] = useState("14:00");

  const toastTimer = useRef(null);
  const showToast  = (msg,type="") => {
    clearTimeout(toastTimer.current);
    setToast({msg,type});
    toastTimer.current=setTimeout(()=>setToast(null),3000);
  };

  // ── LOAD STATE ON LOGIN ────────────────────────────────────────────────
  useEffect(()=>{
    if (!me) return;
    if (me.role==="sub"){
      let s = load(`sub_${me.name}`, mkSub());
      s = applyWeeklyReset(s);
      s = applyPenalties(s);
      setSub(s);
      save(`sub_${me.name}`,s);
    } else {
      setDom(load(`dom_${me.name}`, mkDom()));
    }
  },[me]);

  const persistSub = useCallback((ns)=>{
    setSub(ns);
    if (me?.role==="sub") save(`sub_${me.name}`,ns);
  },[me]);

  const persistDom = useCallback((nd)=>{
    setDom(nd);
    if (me?.role==="dom") save(`dom_${me.name}`,nd);
  },[me]);

  // ── AUTH ────────────────────────────────────────────────────────────────
  const doLogin = (register=false) => {
    const name = lName.trim().toLowerCase();
    const pass = lPass.trim();
    if (!name||!pass){ showToast("Name und Passwort eingeben","danger"); return; }

    const existing = users.find(u=>u.name===name);
    if (register){
      if (existing){ showToast("Name bereits vergeben","danger"); return; }
      const nu = {name,pass,role:lMode};
      const newUsers=[...users,nu];
      setUsers(newUsers); save("users",newUsers);
      setMe({name,role:lMode});
      showToast(`Willkommen, ${name}! 💜`);
    } else {
      if (!existing||existing.pass!==pass){ showToast("Ungültige Zugangsdaten","danger"); return; }
      if (existing.role!==lMode){ showToast(`Dieser Account ist ein ${existing.role}-Account`,"danger"); return; }
      setMe({name,role:lMode});
    }
  };

  const logout = () => { setMe(null); setSub(mkSub()); setDom(mkDom()); setTab("home"); };

  // ── DOM LINKING ─────────────────────────────────────────────────────────
  const linkSubToDom = (subName) => {
    if (!subName) return;
    // update dom
    const nd = {...dom, linkedSubs: [...new Set([...dom.linkedSubs, subName])]};
    persistDom(nd);
    // update sub record
    const subState = load(`sub_${subName}`, mkSub());
    save(`sub_${subName}`, {...subState, domLinked: me.name});
    showToast(`${subName} verknüpft ✓`,"ok");
  };

  // Get dom state for a linked sub (dom perspective)
  const getLinkedSubState = (subName) => applyWeeklyReset(load(`sub_${subName}`,mkSub()));

  // Get linked dom state (sub perspective)
  const getLinkedDomState = () => {
    if (!sub.domLinked) return null;
    return load(`dom_${sub.domLinked}`, mkDom());
  };

  // ── ADD WORKOUT ─────────────────────────────────────────────────────────
  const addWorkout = () => {
    const dur = parseFloat(wDur);
    if (!dur||dur<1){ showToast("Gültige Dauer eingeben","danger"); return; }
    if (!wScreenshot){ showToast("Bitte Screenshot als Beweis anhängen","danger"); return; }

    const reward = calcReward(dur, wHi);

    const wo = { id:Date.now(), date:todayISO(), duration:dur, high:wHi,
                 earned:reward, note:wNote, manual:true, screenshot:wScreenshot };

    let s = {...sub};
    s.workouts = [wo,...s.workouts];

    if (dur >= MIN_TRAIN) s.missedDays = 0;

    // training streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate()-1);
    const yStr = yesterday.toISOString().slice(0,10);
    if (s.lastTrained !== todayISO()){
      s.trainStreak = s.lastTrained===yStr ? (s.trainStreak||0)+1 : 1;
      s.lastTrained = todayISO();
      s.lastPenalty = todayISO();
    }

    // accumulate (cap at weeklyMax)
    s.weekEarned   = (s.weekEarned||0) + reward;
    s.freedomMins  = Math.min((s.freedomMins||0)+reward, s.weeklyMax);
    persistSub(s);

    showToast(`+${fmtMin(reward)} Freiheit verdient 💜`,"ok");
    setWDur("30"); setWNote(""); setWScreenshot(null);
  };

  // ── HANDLE SCREENSHOT ────────────────────────────────────────────────────
  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setWScreenshot(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── REDEEM ──────────────────────────────────────────────────────────────
  const canRedeemDay = () => {
    const ld = getLinkedDomState();
    if (!ld) return true; // not linked → allowed anytime
    if (!ld.redeemDays || ld.redeemDays.length===0) return true; // dom set no restriction
    return ld.redeemDays.includes(todayDayIndex());
  };

  const canRedeemWindow = () => {
    const ld = getLinkedDomState();
    if (!ld || !ld.windows || ld.windows.length===0) return false;
    return !!activeWindow(ld.windows);
  };

  const redeemNow = (fromWindow=false) => {
    if (sub.freedomMins <= 0){ showToast("Keine Minuten vorhanden","danger"); return; }
    if (sub.savedThisWeek && !fromWindow){
      showToast("Diese Woche bereits gespart – kein Einlösen möglich","danger"); return;
    }

    const ld = getLinkedDomState();
    const needApproval = ld?.requireApproval && !fromWindow;

    if (needApproval){
      persistSub({...sub, pendingRedeem:{mins:sub.freedomMins, at:new Date().toISOString()}});
      showToast("Anfrage gesendet – warte auf Dom ⏳");
    } else {
      const log = {action:"Eingelöst",mins:sub.freedomMins,at:new Date().toISOString()};
      persistSub({...sub, freedomMins:0, savingStreak:0, weeklyMax:BASE_MAX,
                  savedThisWeek:false, domLog:[log,...sub.domLog]});
      showToast(`${fmtMin(sub.freedomMins)} Freiheit eingelöst! 🎉`,"ok");
    }
  };

  // ── SAVE WEEK ───────────────────────────────────────────────────────────
  const saveWeek = () => {
    if (sub.savedThisWeek){ showToast("Diese Woche bereits gespart","danger"); return; }
    if ((sub.weekEarned||0) < MIN_EARN_SAVE){
      showToast(`Mindestens ${MIN_EARN_SAVE} Minuten diese Woche verdienen`,"danger"); return;
    }
    if (sub.savedWeekKey===currentWeekKey()){ showToast("Bereits gespart diese Woche","danger"); return; }

    const newStreak = (sub.savingStreak||0)+1;
    const newMax    = Math.min(BASE_MAX + newStreak*STREAK_BONUS, MAX_CAP);
    persistSub({...sub, savingStreak:newStreak, weeklyMax:newMax,
                savedThisWeek:true, savedWeekKey:currentWeekKey()});
    showToast(`Streak +1! Nächste Woche max. ${newMax}min 🔥`,"ok");
  };

  // ── DOM: adjust sub mins ─────────────────────────────────────────────────
  const domAdj = (delta) => {
    if (!domSub){ showToast("Sub wählen","danger"); return; }
    const s = load(`sub_${domSub}`,mkSub());
    const newM = Math.max(0,Math.min((s.freedomMins||0)+delta, s.weeklyMax||BASE_MAX));
    const log  = {action:delta>0?`+${fmtMin(Math.abs(delta))} hinzugefügt`:`−${fmtMin(Math.abs(delta))} abgezogen`,
                  mins:newM, at:new Date().toISOString()};
    save(`sub_${domSub}`, {...s, freedomMins:newM, domLog:[log,...(s.domLog||[])]});
    showToast("Gespeichert","ok"); setAdjAmt("");
  };

  const domReset = () => {
    if (!domSub) return;
    const s = load(`sub_${domSub}`,mkSub());
    save(`sub_${domSub}`,{...s, freedomMins:0,
         domLog:[{action:"Reset auf 0",mins:0,at:new Date().toISOString()},...(s.domLog||[])]});
    showToast("Auf 0 gesetzt","ok");
  };

  const domApprove = (subName) => {
    const s = load(`sub_${subName}`,mkSub());
    if (!s.pendingRedeem) return;
    save(`sub_${subName}`,{...s, freedomMins:0, pendingRedeem:null,
         domLog:[{action:"Einlösung genehmigt",mins:s.pendingRedeem.mins,at:new Date().toISOString()},...(s.domLog||[])]});
    showToast("Genehmigt ✓","ok");
  };

  const domDeny = (subName) => {
    const s = load(`sub_${subName}`,mkSub());
    save(`sub_${subName}`,{...s, pendingRedeem:null,
         domLog:[{action:"Einlösung abgelehnt",mins:s.pendingRedeem?.mins,at:new Date().toISOString()},...(s.domLog||[])]});
    showToast("Abgelehnt","danger");
  };

  const domToggleRedeemDay = (idx) => {
    const days = dom.redeemDays.includes(idx)
      ? dom.redeemDays.filter(d=>d!==idx)
      : [...dom.redeemDays, idx];
    persistDom({...dom, redeemDays:days});
  };

  const domAddWindow = () => {
    if (!winFrom||!winTo){ showToast("Von/Bis eingeben","danger"); return; }
    const w = {id:Date.now(), day:Number(winDay), from:winFrom, to:winTo};
    persistDom({...dom, windows:[...dom.windows, w]});
    showToast("Zeitfenster hinzugefügt ✓","ok");
  };

  const domRemoveWindow = (id) => persistDom({...dom, windows:dom.windows.filter(w=>w.id!==id)});

  const domDeleteWorkout = (subName,woId) => {
    const s = load(`sub_${subName}`,mkSub());
    const removed = s.workouts.find(w=>w.id===woId);
    save(`sub_${subName}`,{...s,
      workouts: s.workouts.filter(w=>w.id!==woId),
      freedomMins: Math.max(0,(s.freedomMins||0)-(removed?.earned||0)),
    });
    showToast("Training gelöscht","ok");
  };

  // ── FREE WINDOW REDEEM (sub) ──────────────────────────────────────────────
  const winActive = (() => {
    const ld = getLinkedDomState();
    return ld ? activeWindow(ld.windows) : null;
  })();

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const pct = sub.weeklyMax>0 ? Math.min((sub.freedomMins/sub.weeklyMax)*100,100) : 0;

  const subSubs = users.filter(u=>u.role==="sub").map(u=>u.name);
  const subUsers = users.filter(u=>u.role==="sub");

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (!me){
    return(
      <div className="app">
        <style>{CSS}</style>
        <div className="login-wrap">
          <div className="login-logo">
            <div className="display" style={{fontSize:28}}>FreedomFit</div>
            <p>Discipline · Reward · Freedom</p>
          </div>
          <div className="card">
            <div className="tabs">
              <button className={`tab ${lMode==="sub"?"on":""}`} onClick={()=>setLMode("sub")}>💜 Sub</button>
              <button className={`tab dom ${lMode==="dom"?"on dom":""}`} onClick={()=>setLMode("dom")}>🖤 Dom</button>
            </div>
            <div className="field-wrap">
              <span className="label">Benutzername</span>
              <input className="field" value={lName} onChange={e=>setLName(e.target.value)} placeholder="Name" />
            </div>
            <div className="field-wrap">
              <span className="label">Passwort</span>
              <input className="field" type="password" value={lPass} onChange={e=>setLPass(e.target.value)}
                     placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&doLogin(lReg)} />
            </div>
            <button className={`btn ${lMode==="dom"?"btn-rose":"btn-acc"}`} onClick={()=>doLogin(false)}>
              Einloggen
            </button>
            <button className="btn btn-ghost" style={{marginTop:8}} onClick={()=>doLogin(true)}>
              Neuen Account erstellen
            </button>
          </div>
        </div>
        {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  // ── DOM DASHBOARD ────────────────────────────────────────────────────────
  if (me.role==="dom"){
    const allSubs = subUsers.map(u=>u.name);
    return(
      <div className="app">
        <style>{CSS}</style>
        <div className="page">
          <div className="dom-hdr">
            <div className="dom-title">Dom-Kontrolle</div>
            <div className="dom-sub">Absolute Herrschaft 🖤</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12}}>
              <div className="pill"><div className="dot dot-dom"/>{me.name}</div>
              <button className="icon-btn" onClick={logout}>Abmelden</button>
            </div>
          </div>

          {/* ── TABS ── */}
          <div style={{padding:"14px 20px 0"}}>
            <div className="tabs">
              <button className={`tab dom ${tab==="dom"?"on dom":""}`} onClick={()=>setTab("dom")}>👑 Subs</button>
              <button className={`tab dom ${tab==="settings"?"on dom":""}`} onClick={()=>setTab("settings")}>⚙️ Regeln</button>
            </div>
          </div>

          {/* ── SUBS MANAGEMENT ── */}
          {tab==="dom" && (
            <div className="sec">
              {/* Link sub */}
              <div className="label" style={{marginBottom:8}}>Sub verknüpfen</div>
              <div className="row" style={{marginBottom:16}}>
                <div className="field-wrap">
                  <select className="field" value={domSub} onChange={e=>setDomSub(e.target.value)}>
                    <option value="">— Sub wählen —</option>
                    {allSubs.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button className="btn btn-rose btn-sm" onClick={()=>linkSubToDom(domSub)}>Verknüpfen</button>
              </div>

              {/* Linked subs */}
              {dom.linkedSubs.map(sn=>{
                const ss = getLinkedSubState(sn);
                return(
                  <div key={sn} style={{marginBottom:18}}>
                    <div className="label" style={{marginBottom:8}}>{sn}</div>
                    <div className="dom-grid">
                      <div className="dom-stat"><div className="dom-stat-val">{fmtMin(ss.freedomMins||0)}</div><div className="dom-stat-lbl">Freiheit</div></div>
                      <div className="dom-stat"><div className="dom-stat-val">{ss.trainStreak||0}🔥</div><div className="dom-stat-lbl">Streak</div></div>
                    </div>

                    {/* Pending approval */}
                    {ss.pendingRedeem && (
                      <div className="alert alert-gold" style={{marginBottom:10}}>
                        <div className="alert-icon">🔔</div>
                        <div className="alert-body">
                          <strong>Einlösung: {fmtMin(ss.pendingRedeem.mins)}</strong>
                          <div style={{display:"flex",gap:8,marginTop:8}}>
                            <button className="btn btn-acc btn-sm" onClick={()=>domApprove(sn)}>✓ Genehmigen</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>domDeny(sn)}>✗ Ablehnen</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Adjust */}
                    <div className="row" style={{marginBottom:8}}>
                      <div className="field-wrap">
                        <input className="field" type="number" value={domSub===sn?adjAmt:""}
                               onChange={e=>{setDomSub(sn);setAdjAmt(e.target.value);}}
                               placeholder="Minuten" />
                      </div>
                      <button className="btn btn-acc btn-sm" onClick={()=>domAdj(parseFloat(adjAmt)||0)}>+</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>domAdj(-(parseFloat(adjAmt)||0))}>−</button>
                    </div>
                    <button className="btn btn-danger" style={{width:"100%"}} onClick={()=>{setDomSub(sn);domReset();}}>
                      Auf 0 zurücksetzen
                    </button>

                    {/* Recent workouts */}
                    {(ss.workouts||[]).length>0 && (
                      <div style={{marginTop:10}}>
                        <div className="label" style={{marginBottom:6}}>Trainings prüfen & löschen</div>
                        {(ss.workouts||[]).slice(0,6).map(w=>(
                          <div key={w.id} className="wo-item" style={{flexDirection:"column",alignItems:"stretch",marginBottom:10}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <div className="wo-left">
                                <div className="wo-date">{fmtDate(w.date)}</div>
                                <div className="wo-name">{w.duration}min {w.high?"🔥":"🚶"}</div>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div className="wo-earned">{fmtMin(w.earned)}</div>
                                <button className="btn btn-danger btn-sm" onClick={()=>domDeleteWorkout(sn,w.id)}>✗ Löschen</button>
                              </div>
                            </div>
                            {w.screenshot && (
                              <img src={w.screenshot} alt="Beweis Screenshot" className="wo-screenshot"/>
                            )}
                            {!w.screenshot && (
                              <div style={{fontSize:11,color:"var(--red)",marginTop:6}}>⚠️ Kein Screenshot vorhanden</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="divider" style={{marginTop:14}}/>
                  </div>
                );
              })}
              {dom.linkedSubs.length===0 && <div className="empty">Noch keine Subs verknüpft.<br/>Oben Sub auswählen und verknüpfen.</div>}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab==="settings" && (
            <div className="sec">
              {/* Dom Approval toggle */}
              <div className="label" style={{marginBottom:8}}>Bestätigung & Tage</div>
              <div className="toggle-row">
                <div className="toggle-label">Dom-Bestätigung erforderlich</div>
                <div className="toggle-switch"
                     style={{background:dom.requireApproval?"var(--rose)":"var(--s3)"}}
                     onClick={()=>persistDom({...dom,requireApproval:!dom.requireApproval})}>
                  <div className="toggle-thumb" style={{left:dom.requireApproval?22:2}}/>
                </div>
              </div>

              {/* Redeem Days */}
              <div className="label" style={{marginBottom:8,marginTop:16}}>Einlösen erlaubt an</div>
              <div className="wday-grid" style={{marginBottom:6}}>
                {DAYS_DE.map((d,i)=>(
                  <button key={i} className={`wday-btn ${dom.redeemDays.includes(i)?"on":""}`}
                          onClick={()=>domToggleRedeemDay(i)}>{d}</button>
                ))}
              </div>
              <div style={{fontSize:11,color:"var(--muted2)",marginBottom:16}}>
                Wenn kein Tag aktiv → immer erlaubt
              </div>

              {/* Freedom Windows */}
              <div className="label" style={{marginBottom:8}}>Freiheitsfenster</div>
              {dom.windows.map(w=>(
                <div key={w.id} className="window-row">
                  <div>
                    <div className="window-info">{DAYS_FULL[w.day]}</div>
                    <div className="window-time">{w.from} – {w.to} Uhr</div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={()=>domRemoveWindow(w.id)}>✗</button>
                </div>
              ))}
              <div className="wform" style={{marginTop:8}}>
                <div className="field-wrap">
                  <span className="label">Tag</span>
                  <select className="field" value={winDay} onChange={e=>setWinDay(e.target.value)}>
                    {DAYS_FULL.map((d,i)=><option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="row">
                  <div className="field-wrap">
                    <span className="label">Von</span>
                    <input className="field" type="time" value={winFrom} onChange={e=>setWinFrom(e.target.value)}/>
                  </div>
                  <div className="field-wrap">
                    <span className="label">Bis</span>
                    <input className="field" type="time" value={winTo} onChange={e=>setWinTo(e.target.value)}/>
                  </div>
                </div>
                <button className="btn btn-rose" onClick={domAddWindow}>Fenster hinzufügen</button>
              </div>
            </div>
          )}
        </div>
        {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  // ── SUB DASHBOARD ────────────────────────────────────────────────────────
  const ld = getLinkedDomState();
  const redeemOkDay    = canRedeemDay();
  const windowRedeemOk = canRedeemWindow();

  const navItems = [
    {id:"home",  icon:"🏠", label:"Home"},
    {id:"train", icon:"🏋️", label:"Training"},
    {id:"redeem",icon:"🔓", label:"Einlösen"},
    {id:"history",icon:"📋",label:"Verlauf"},
  ];

  return(
    <div className="app">
      <style>{CSS}</style>
      <div className="page">
        {/* HEADER */}
        <div className="hdr">
          <div className="hdr-title">FreedomFit</div>
          <div className="hdr-right">
            <div className="pill">
              <div className="dot dot-sub"/>
              {me.name}
              {sub.domLinked && <span style={{fontSize:10,color:"var(--rose)",marginLeft:4}}>🖤{sub.domLinked}</span>}
            </div>
            <button className="icon-btn" onClick={logout}>✕</button>
          </div>
        </div>

        {/* HOME */}
        {tab==="home" && (
          <>
            <div className="sec">
              <div className="label" style={{marginBottom:10}}>Deine Freiheit</div>
              <div className="meter-card">
                <div style={{fontSize:11,letterSpacing:2,color:"var(--muted2)",marginBottom:6}}>FREIHEITSMINUTEN</div>
                <div className="meter-big">{fmtMin(sub.freedomMins)}</div>
                <div className="meter-sub">von {fmtMin(sub.weeklyMax)} diese Woche</div>
                <div className="bar-wrap"><div className="bar-fill" style={{width:`${pct}%`}}/></div>
                <div className="bar-labels"><span>0</span><span>{sub.weeklyMax}m max</span></div>
              </div>
              <div className="stat-row">
                <div className="stat-card">
                  <div className="stat-val">{sub.trainStreak||0}</div>
                  <div className="stat-lbl">🔥 Trainings-Streak</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val">{sub.savingStreak||0}</div>
                  <div className="stat-lbl">💰 Spar-Streak</div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="sec" style={{paddingTop:0}}>
              {sub.missedDays>0 && (
                <div className="alert alert-warn">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-body">
                    <strong>{sub.missedDays} Tag(e) ohne Training!</strong><br/>
                    {sub.missedDays===1&&"Morgen: −30% bei weiterem Fehlen"}
                    {sub.missedDays===2&&"Morgen: −50%!"}
                    {sub.missedDays>=3&&"Nächste Stufe: Auf 0!"}
                  </div>
                </div>
              )}
              {sub.savedThisWeek && (
                <div className="alert alert-gold">
                  <div className="alert-icon">💰</div>
                  <div className="alert-body">Diese Woche gespart – Einlösen bis Sonntag gesperrt.</div>
                </div>
              )}
              {winActive && (
                <div className="alert alert-green">
                  <div className="alert-icon">🟢</div>
                  <div className="alert-body">
                    <strong>Freiheitsfenster aktiv!</strong> Bis {winActive.to} Uhr<br/>
                    <button className="btn btn-acc btn-sm" style={{marginTop:8}} onClick={()=>redeemNow(true)}>
                      Jetzt einlösen
                    </button>
                  </div>
                </div>
              )}
              {sub.pendingRedeem && (
                <div className="alert alert-acc">
                  <div className="alert-icon">⏳</div>
                  <div className="alert-body">Einlösung wartet auf Dom-Bestätigung…</div>
                </div>
              )}
              {!sub.domLinked && (
                <div className="alert alert-acc">
                  <div className="alert-icon">🔗</div>
                  <div className="alert-body">Noch kein Dom verknüpft. Bitte Dom bitten, dich zu verknüpfen.</div>
                </div>
              )}
            </div>

            {/* Today's workouts */}
            {(sub.workouts||[]).filter(w=>w.date===todayISO()).length>0 && (
              <div className="sec" style={{paddingTop:0}}>
                <div className="label" style={{marginBottom:8}}>Heute</div>
                {(sub.workouts||[]).filter(w=>w.date===todayISO()).map(w=>(
                  <div key={w.id} className="wo-item">
                    <div className="wo-left">
                      <div className="wo-name">{w.duration}min {w.high?<span className="hi-chip">HIGH</span>:""}</div>
                      {w.note&&<div className="wo-date">{w.note}</div>}
                      {w.manual&&<span className="unverified-badge">Nicht verifiziert</span>}
                    </div>
                    <div className="wo-earned">+{fmtMin(w.earned)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TRAINING */}
        {tab==="train" && (
          <div className="sec">
            <div className="label" style={{marginBottom:10}}>Training eintragen</div>

            <div className="alert alert-acc" style={{marginBottom:14}}>
              <div className="alert-icon">📸</div>
              <div className="alert-body">
                <strong>Screenshot als Beweis erforderlich.</strong><br/>
                Mach einen Screenshot deines Apple Watch Trainings und lade ihn hier hoch. Deine Dom kann alle Einträge prüfen und löschen.
              </div>
            </div>

            <div className="wform">
              <div className="field-wrap">
                <span className="label">Dauer (Minuten)</span>
                <input className="field" type="number" value={wDur} onChange={e=>setWDur(e.target.value)} placeholder="30"/>
              </div>
              <div>
                <span className="label" style={{display:"block",marginBottom:6}}>Intensität</span>
                <div className="intensity-row">
                  <button className={`int-btn ${wHi?"on-hi":""}`} onClick={()=>setWHi(true)}>🔥 Intensiv &gt;132 BPM</button>
                  <button className={`int-btn ${!wHi?"on-lo":""}`} onClick={()=>setWHi(false)}>🚶 Moderat</button>
                </div>
              </div>
              <div className="field-wrap">
                <span className="label">Notiz (optional)</span>
                <input className="field" value={wNote} onChange={e=>setWNote(e.target.value)} placeholder="Laufen, Kraft…"/>
              </div>

              {/* Screenshot upload */}
              <div>
                <span className="label" style={{display:"block",marginBottom:6}}>
                  Screenshot Beweis <span style={{color:"var(--red)"}}>*</span>
                </span>
                <label className={`screenshot-upload ${wScreenshot?"has-img":""}`}>
                  <input type="file" accept="image/*" onChange={handleScreenshot} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/>
                  {wScreenshot ? (
                    <img src={wScreenshot} alt="Screenshot" className="screenshot-preview"/>
                  ) : (
                    <div style={{padding:"16px 0"}}>
                      <div className="screenshot-icon">📷</div>
                      <div className="screenshot-label">Tippe um Screenshot hochzuladen</div>
                      <div className="screenshot-required">Pflichtfeld</div>
                    </div>
                  )}
                </label>
                {wScreenshot && (
                  <button className="btn btn-danger btn-sm" style={{marginTop:6}}
                          onClick={()=>setWScreenshot(null)}>
                    Screenshot entfernen
                  </button>
                )}
              </div>

              {wDur && parseFloat(wDur)>0 && (
                <div className="reward-preview">Reward: +{fmtMin(calcReward(parseFloat(wDur),wHi))} Freiheit</div>
              )}
              <button className="btn btn-acc" onClick={addWorkout}
                      disabled={!wScreenshot}>
                Training speichern
              </button>
            </div>

            <div className="card" style={{marginTop:14}}>
              <div className="label" style={{marginBottom:8}}>Punkteregeln</div>
              <div style={{fontSize:12,color:"var(--muted2)",lineHeight:1.9}}>
                🔥 <strong style={{color:"var(--text)"}}>Intensiv (&gt;132 BPM):</strong> 1 Min / 15 Min Training<br/>
                🚶 <strong style={{color:"var(--text)"}}>Moderat:</strong> 15 Sek / 20 Min Training<br/>
                ⚠️ <strong style={{color:"var(--text)"}}>Mindest-Training:</strong> 10 Min stoppt Strafe<br/>
                📅 <strong style={{color:"var(--text)"}}>Wöchentl. Max:</strong> {sub.weeklyMax} Min
              </div>
            </div>
          </div>
        )}

        {/* REDEEM */}
        {tab==="redeem" && (
          <div className="sec">
            <div className="label" style={{marginBottom:10}}>Einlösen & Sparen</div>

            {/* Current amount */}
            <div className="redeem-card" style={{marginBottom:14}}>
              <div style={{fontSize:11,letterSpacing:2,color:"var(--muted2)"}}>VERFÜGBAR</div>
              <div className="redeem-big">{fmtMin(sub.freedomMins)}</div>

              {/* Redeem days indicator */}
              {ld?.redeemDays?.length>0 && (
                <div>
                  <div className="label" style={{marginBottom:6}}>Einlösen erlaubt an</div>
                  <div className="days-grid">
                    {DAYS_DE.map((d,i)=>{
                      const isActive = ld.redeemDays.includes(i);
                      const isToday  = i===todayDayIndex();
                      return(
                        <div key={i} className={`day-chip ${isActive?"active":""} ${isToday?"today":""}`}>{d}</div>
                      );
                    })}
                  </div>
                </div>
              )}

              {sub.savedThisWeek ? (
                <div className="alert alert-gold" style={{textAlign:"left"}}>
                  <div className="alert-icon">🔒</div>
                  <div className="alert-body">Diese Woche gespart – Einlösen bis Sonntag gesperrt.</div>
                </div>
              ) : (
                <button className="btn btn-acc"
                  disabled={!redeemOkDay || sub.freedomMins<=0 || !!sub.pendingRedeem}
                  onClick={()=>redeemNow(false)}>
                  {!redeemOkDay
                    ? "Heute kein Einlösen erlaubt"
                    : sub.pendingRedeem
                    ? "⏳ Warte auf Bestätigung"
                    : ld?.requireApproval
                    ? "Einlösung anfragen 🔐"
                    : "Jetzt einlösen 🎉"}
                </button>
              )}
            </div>

            {/* Save week */}
            <div className="card">
              <div className="label" style={{marginBottom:6}}>Diese Woche sparen</div>
              <div style={{fontSize:12,color:"var(--muted2)",lineHeight:1.7,marginBottom:12}}>
                Minuten nicht einlösen → nächste Woche +2 Max-Minuten (bis 15 Min).<br/>
                Bedingung: mind. <strong style={{color:"var(--text)"}}>5 Min</strong> diese Woche verdient.
                Diese Woche verdient: <strong style={{color:"var(--acc)"}}>{fmtMin(sub.weekEarned||0)}</strong>
              </div>
              <div className="alert alert-gold" style={{marginBottom:12}}>
                <div className="alert-icon">💰</div>
                <div className="alert-body">
                  Spar-Streak: <strong>{sub.savingStreak||0}</strong> Woche(n) →
                  nächste Woche max. <strong>{Math.min(BASE_MAX+((sub.savingStreak||0)+1)*STREAK_BONUS,MAX_CAP)}min</strong>
                </div>
              </div>
              <button className="btn btn-ghost"
                disabled={sub.savedThisWeek || (sub.weekEarned||0)<MIN_EARN_SAVE}
                onClick={saveWeek}>
                {sub.savedThisWeek ? "✓ Bereits gespart diese Woche" : "💰 Diese Woche sparen"}
              </button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab==="history" && (
          <div className="sec">
            <div className="label" style={{marginBottom:10}}>Trainingshistorie</div>
            {(sub.workouts||[]).length===0
              ? <div className="empty">Noch keine Trainings.<br/>Fang heute an! 💪</div>
              : (sub.workouts||[]).map(w=>(
                  <div key={w.id} className="wo-item" style={{flexDirection:"column",alignItems:"stretch"}}>
                    <div className="wo-item-top" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div className="wo-left">
                        <div className="wo-date">{fmtDate(w.date)}</div>
                        <div className="wo-name">
                          {w.duration}min
                          {w.high && <span className="hi-chip">HIGH</span>}
                        </div>
                        {w.note && <div className="wo-date">{w.note}</div>}
                      </div>
                      <div className="wo-earned">+{fmtMin(w.earned)}</div>
                    </div>
                    {w.screenshot && (
                      <img src={w.screenshot} alt="Beweis" className="wo-screenshot"/>
                    )}
                  </div>
                ))
            }
          </div>
        )}
      </div>

      {/* NAV */}
      <nav className="nav">
        {navItems.map(n=>(
          <button key={n.id}
            className={`nav-btn ${tab===n.id?"on":""}`}
            onClick={()=>setTab(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-lbl">{n.label}</span>
          </button>
        ))}
      </nav>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
