import { useState, useEffect, useRef, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  GOAT — draft real players' accolades & career stats across eras to */
/*  assemble one mythical résumé, then get ranked.                     */
/*                                                                     */
/*  Each round spins a random ERA (your 82-0-style constraint). You    */
/*  assign that era to one open slot, then name a player from it —     */
/*  blind. You bank their real number for that category. Each pick is  */
/*  graded vs the ALL-TIME best in that category; your GOAT Index is   */
/*  the average across every slot you fill. No player twice.           */
/*                                                                     */
/*  DATA NOTES (Ariel — edit freely):                                  */
/*   • MVP / Finals MVP / rings / scoring titles: verified, current.   */
/*   • All-NBA / All-Defensive / All-Star: leaders verified; some      */
/*     mid-tier counts ballparked.                                     */
/*   • Career avgs: category LEADERS verified (PPG Jordan/Wilt 30.1,   */
/*     APG Magic 11.2, RPG Wilt 22.9, SPG ~Jordan 2.3, BPG Hakeem 3.1).*/
/*     Steals/blocks weren't tracked until 1973-74 → pre-'74 guys get  */
/*     0 SPG/BPG by design. Mid-tier avgs are close-but-approximate.   */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#0d0d0f", panel: "#17171b", panel2: "#1f1f25", border: "#2c2c34",
  gold: "#e8b84b", orange: "#e0712b", text: "#f3efe6", dim: "#8b8d98",
  green: "#5bbd7a", red: "#d65a5a",
};

const ERAS = ["60s–70s", "80s", "90s", "2000s", "2010s", "2020s"];

const SLOTS = [
  { key: "mvp",     label: "MVPs",          type: "count" },
  { key: "fmvp",    label: "Finals MVPs",   type: "count" },
  { key: "rings",   label: "Championships", type: "count" },
  { key: "scoring", label: "Scoring Titles",type: "count" },
  { key: "allNBA",  label: "All-NBA",       type: "count" },
  { key: "allDef",  label: "All-Defensive", type: "count" },
  { key: "allStar", label: "All-Star",      type: "count" },
  { key: "ppg",     label: "Career PPG",    type: "avg", unit: "PPG" },
  { key: "apg",     label: "Career APG",    type: "avg", unit: "APG" },
  { key: "rpg",     label: "Career RPG",    type: "avg", unit: "RPG" },
  { key: "spg",     label: "Career SPG",    type: "avg", unit: "SPG" },
  { key: "bpg",     label: "Career BPG",    type: "avg", unit: "BPG" },
];
const SLOT_BY_KEY = Object.fromEntries(SLOTS.map((s) => [s.key, s]));
const HARDWARE = ["mvp", "fmvp", "rings", "scoring", "allNBA", "allDef", "allStar"];
const STATS = ["ppg", "apg", "rpg", "spg", "bpg"];

// eras / mvp / fmvp / rings / scoring titles / allNBA / allDef / allStar / ppg / apg / rpg / spg / bpg
const PLAYERS = [
  { name: "Bill Russell",            eras: ["60s–70s"],                 mvp:5,fmvp:0,rings:11,scoring:0,allNBA:11,allDef:1, allStar:12, ppg:15.1,apg:4.3, rpg:22.5,spg:0,  bpg:0 },
  { name: "Wilt Chamberlain",        eras: ["60s–70s"],                 mvp:4,fmvp:1,rings:2, scoring:7,allNBA:10,allDef:2, allStar:13, ppg:30.1,apg:4.4, rpg:22.9,spg:0,  bpg:0 },
  { name: "Kareem Abdul-Jabbar",     eras: ["60s–70s","80s"],           mvp:6,fmvp:2,rings:6, scoring:2,allNBA:15,allDef:11,allStar:19, ppg:24.6,apg:3.6, rpg:11.2,spg:0.9,bpg:2.6 },
  { name: "Oscar Robertson",         eras: ["60s–70s"],                 mvp:1,fmvp:0,rings:1, scoring:0,allNBA:11,allDef:1, allStar:12, ppg:25.7,apg:9.5, rpg:7.5, spg:0,  bpg:0 },
  { name: "Jerry West",              eras: ["60s–70s"],                 mvp:0,fmvp:1,rings:1, scoring:1,allNBA:12,allDef:4, allStar:14, ppg:27.0,apg:6.7, rpg:5.8, spg:0,  bpg:0 },
  { name: "Elgin Baylor",            eras: ["60s–70s"],                 mvp:0,fmvp:0,rings:0, scoring:0,allNBA:10,allDef:0, allStar:11, ppg:27.4,apg:4.3, rpg:13.5,spg:0,  bpg:0 },
  { name: "Bob Pettit",              eras: ["60s–70s"],                 mvp:2,fmvp:0,rings:1, scoring:2,allNBA:11,allDef:0, allStar:11, ppg:26.4,apg:3.0, rpg:16.2,spg:0,  bpg:0 },
  { name: "Julius Erving",           eras: ["60s–70s","80s"],           mvp:1,fmvp:0,rings:1, scoring:0,allNBA:5, allDef:0, allStar:11, ppg:22.0,apg:3.9, rpg:6.7, spg:1.7,bpg:1.5 },
  { name: "Moses Malone",            eras: ["60s–70s","80s","90s"],     mvp:3,fmvp:1,rings:1, scoring:0,allNBA:8, allDef:0, allStar:13, ppg:20.6,apg:1.4, rpg:12.2,spg:0.8,bpg:1.3 },
  { name: "Michael Jordan",          eras: ["80s","90s","2000s"],       mvp:5,fmvp:6,rings:6, scoring:10,allNBA:11,allDef:9,allStar:14, ppg:30.1,apg:5.3, rpg:6.2, spg:2.3,bpg:0.8 },
  { name: "Magic Johnson",           eras: ["80s","90s"],               mvp:3,fmvp:3,rings:5, scoring:0,allNBA:10,allDef:0, allStar:12, ppg:19.5,apg:11.2,rpg:7.2, spg:1.9,bpg:0.4 },
  { name: "Larry Bird",              eras: ["80s","90s"],               mvp:3,fmvp:2,rings:3, scoring:0,allNBA:10,allDef:3, allStar:12, ppg:24.3,apg:6.3, rpg:10.0,spg:1.7,bpg:0.8 },
  { name: "Isiah Thomas",            eras: ["80s","90s"],               mvp:0,fmvp:1,rings:2, scoring:0,allNBA:5, allDef:0, allStar:12, ppg:19.2,apg:9.3, rpg:3.6, spg:1.9,bpg:0.3 },
  { name: "Charles Barkley",         eras: ["80s","90s","2000s"],       mvp:1,fmvp:0,rings:0, scoring:0,allNBA:11,allDef:0, allStar:11, ppg:22.1,apg:3.9, rpg:11.7,spg:1.5,bpg:0.8 },
  { name: "Karl Malone",             eras: ["80s","90s","2000s"],       mvp:2,fmvp:0,rings:0, scoring:0,allNBA:14,allDef:4, allStar:14, ppg:25.0,apg:3.6, rpg:10.1,spg:1.4,bpg:0.8 },
  { name: "John Stockton",           eras: ["80s","90s","2000s"],       mvp:0,fmvp:0,rings:0, scoring:0,allNBA:11,allDef:5, allStar:10, ppg:13.1,apg:10.5,rpg:2.7, spg:2.2,bpg:0.2 },
  { name: "Hakeem Olajuwon",         eras: ["80s","90s","2000s"],       mvp:1,fmvp:2,rings:2, scoring:0,allNBA:12,allDef:9, allStar:12, ppg:21.8,apg:2.5, rpg:11.1,spg:1.7,bpg:3.1 },
  { name: "David Robinson",          eras: ["80s","90s","2000s"],       mvp:1,fmvp:0,rings:2, scoring:1,allNBA:10,allDef:8, allStar:10, ppg:21.1,apg:2.5, rpg:10.6,spg:1.4,bpg:3.0 },
  { name: "Patrick Ewing",           eras: ["80s","90s","2000s"],       mvp:0,fmvp:0,rings:0, scoring:0,allNBA:7, allDef:3, allStar:11, ppg:21.0,apg:1.9, rpg:9.8, spg:1.0,bpg:2.4 },
  { name: "Scottie Pippen",          eras: ["80s","90s","2000s"],       mvp:0,fmvp:0,rings:6, scoring:0,allNBA:7, allDef:10,allStar:7,  ppg:16.1,apg:5.2, rpg:6.4, spg:2.0,bpg:0.8 },
  { name: "Shaquille O'Neal",        eras: ["90s","2000s","2010s"],     mvp:1,fmvp:3,rings:4, scoring:2,allNBA:14,allDef:3, allStar:15, ppg:23.7,apg:2.5, rpg:10.9,spg:0.6,bpg:2.3 },
  { name: "Tim Duncan",              eras: ["90s","2000s","2010s"],     mvp:2,fmvp:3,rings:5, scoring:0,allNBA:15,allDef:15,allStar:15, ppg:19.0,apg:3.0, rpg:10.8,spg:0.7,bpg:2.2 },
  { name: "Kobe Bryant",             eras: ["90s","2000s","2010s"],     mvp:1,fmvp:2,rings:5, scoring:2,allNBA:15,allDef:12,allStar:18, ppg:25.0,apg:4.7, rpg:5.2, spg:1.4,bpg:0.5 },
  { name: "Allen Iverson",           eras: ["90s","2000s","2010s"],     mvp:1,fmvp:0,rings:0, scoring:4,allNBA:7, allDef:0, allStar:11, ppg:26.7,apg:6.2, rpg:3.7, spg:2.2,bpg:0.2 },
  { name: "Kevin Garnett",           eras: ["90s","2000s","2010s"],     mvp:1,fmvp:0,rings:1, scoring:0,allNBA:9, allDef:12,allStar:15, ppg:17.8,apg:3.7, rpg:10.0,spg:1.3,bpg:1.4 },
  { name: "Dirk Nowitzki",           eras: ["90s","2000s","2010s"],     mvp:1,fmvp:1,rings:1, scoring:0,allNBA:12,allDef:0, allStar:14, ppg:20.7,apg:2.4, rpg:7.5, spg:0.8,bpg:0.8 },
  { name: "Steve Nash",              eras: ["90s","2000s","2010s"],     mvp:2,fmvp:0,rings:0, scoring:0,allNBA:7, allDef:0, allStar:8,  ppg:14.3,apg:8.5, rpg:3.0, spg:0.7,bpg:0.0 },
  { name: "Paul Pierce",             eras: ["90s","2000s","2010s"],     mvp:0,fmvp:1,rings:1, scoring:0,allNBA:4, allDef:0, allStar:10, ppg:19.7,apg:3.5, rpg:5.6, spg:1.3,bpg:0.6 },
  { name: "Dwyane Wade",             eras: ["2000s","2010s"],           mvp:0,fmvp:1,rings:3, scoring:1,allNBA:8, allDef:3, allStar:13, ppg:22.0,apg:5.4, rpg:4.7, spg:1.5,bpg:0.8 },
  { name: "LeBron James",            eras: ["2000s","2010s","2020s"],   mvp:4,fmvp:4,rings:4, scoring:1,allNBA:21,allDef:6, allStar:21, ppg:27.0,apg:7.4, rpg:7.5, spg:1.5,bpg:0.7 },
  { name: "Carmelo Anthony",         eras: ["2000s","2010s","2020s"],   mvp:0,fmvp:0,rings:0, scoring:1,allNBA:6, allDef:0, allStar:10, ppg:22.5,apg:2.7, rpg:6.4, spg:1.0,bpg:0.5 },
  { name: "Dwight Howard",           eras: ["2000s","2010s","2020s"],   mvp:0,fmvp:0,rings:1, scoring:0,allNBA:8, allDef:5, allStar:8,  ppg:15.7,apg:1.3, rpg:11.8,spg:0.8,bpg:1.8 },
  { name: "Chris Paul",              eras: ["2000s","2010s","2020s"],   mvp:0,fmvp:0,rings:0, scoring:0,allNBA:11,allDef:9, allStar:12, ppg:17.1,apg:9.4, rpg:4.4, spg:2.1,bpg:0.1 },
  { name: "Kevin Durant",            eras: ["2000s","2010s","2020s"],   mvp:1,fmvp:2,rings:2, scoring:4,allNBA:11,allDef:0, allStar:14, ppg:27.1,apg:4.4, rpg:7.0, spg:1.1,bpg:1.1 },
  { name: "Russell Westbrook",       eras: ["2000s","2010s","2020s"],   mvp:1,fmvp:0,rings:0, scoring:2,allNBA:9, allDef:0, allStar:9,  ppg:21.0,apg:8.2, rpg:7.4, spg:1.6,bpg:0.3 },
  { name: "James Harden",            eras: ["2000s","2010s","2020s"],   mvp:1,fmvp:0,rings:0, scoring:3,allNBA:7, allDef:0, allStar:11, ppg:24.0,apg:7.0, rpg:5.5, spg:1.5,bpg:0.5 },
  { name: "Stephen Curry",           eras: ["2010s","2020s"],           mvp:2,fmvp:1,rings:4, scoring:2,allNBA:10,allDef:0, allStar:11, ppg:24.8,apg:6.3, rpg:4.6, spg:1.5,bpg:0.2 },
  { name: "Giannis Antetokounmpo",   eras: ["2010s","2020s"],           mvp:2,fmvp:1,rings:1, scoring:0,allNBA:8, allDef:6, allStar:9,  ppg:23.5,apg:5.0, rpg:10.0,spg:1.0,bpg:1.2 },
  { name: "Kawhi Leonard",           eras: ["2010s","2020s"],           mvp:0,fmvp:2,rings:2, scoring:0,allNBA:6, allDef:7, allStar:6,  ppg:19.8,apg:3.0, rpg:6.4, spg:1.7,bpg:0.6 },
  { name: "Anthony Davis",           eras: ["2010s","2020s"],           mvp:0,fmvp:0,rings:1, scoring:0,allNBA:5, allDef:4, allStar:10, ppg:24.0,apg:2.6, rpg:10.4,spg:1.3,bpg:2.3 },
  { name: "Damian Lillard",          eras: ["2010s","2020s"],           mvp:0,fmvp:0,rings:0, scoring:0,allNBA:7, allDef:0, allStar:9,  ppg:25.0,apg:6.7, rpg:4.2, spg:1.0,bpg:0.3 },
  { name: "Nikola Jokić",            eras: ["2010s","2020s"],           mvp:3,fmvp:1,rings:1, scoring:0,allNBA:6, allDef:0, allStar:6,  ppg:21.0,apg:7.0, rpg:11.0,spg:1.3,bpg:0.7 },
  { name: "Joel Embiid",             eras: ["2010s","2020s"],           mvp:1,fmvp:0,rings:0, scoring:2,allNBA:5, allDef:1, allStar:7,  ppg:27.8,apg:3.8, rpg:11.2,spg:1.0,bpg:1.7 },
  { name: "Luka Dončić",             eras: ["2010s","2020s"],           mvp:0,fmvp:0,rings:0, scoring:1,allNBA:5, allDef:0, allStar:6,  ppg:28.6,apg:8.3, rpg:8.6, spg:1.3,bpg:0.5 },
  { name: "Jayson Tatum",            eras: ["2010s","2020s"],           mvp:0,fmvp:0,rings:1, scoring:0,allNBA:4, allDef:1, allStar:6,  ppg:23.0,apg:4.0, rpg:8.0, spg:1.0,bpg:0.7 },
  { name: "Shai Gilgeous-Alexander", eras: ["2010s","2020s"],           mvp:1,fmvp:1,rings:1, scoring:1,allNBA:4, allDef:1, allStar:4,  ppg:25.0,apg:5.3, rpg:5.0, spg:1.6,bpg:0.9 },
];

const TIERS = [
  { min: 85, name: "THE GOAT",       color: C.gold,    verdict: "The greatest résumé ever assembled. The debate ends here." },
  { min: 70, name: "ALL-TIME GREAT", color: "#d9d3c4", verdict: "Top-15 all-time material. Legendary, not quite untouchable." },
  { min: 55, name: "SUPERSTAR",      color: C.orange,  verdict: "A franchise cornerstone. Carried teams, not eras." },
  { min: 40, name: "ALL-STAR",       color: "#6fa8dc", verdict: "Multiple-time All-Star. Very good, never the answer." },
  { min: 25, name: "ROLE PLAYER",    color: C.green,   verdict: "Useful piece. Knows his role, stays in it." },
  { min: 0,  name: "BUM",            color: C.red,     verdict: "Riding the bench. You drafted vibes, not hardware." },
];
const getTier = (idx) => TIERS.find((t) => idx >= t.min);

const grade = (s) =>
  s >= 0.9 ? { t: "GOAT-TIER", c: C.gold }
  : s >= 0.7 ? { t: "ELITE", c: "#d9d3c4" }
  : s >= 0.5 ? { t: "SOLID", c: C.green }
  : s >= 0.25 ? { t: "MEH", c: C.orange }
  : s > 0 ? { t: "WEAK", c: C.dim }
  : { t: "EMPTY", c: C.red };

const fmtVal = (slot, v) =>
  slot.type === "avg" ? `${v.toFixed(1)} ${slot.unit}` : `${v}`;

function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const prefersReduced =
  typeof window !== "undefined" && window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function GOAT() {
  const [phase, setPhase] = useState("intro");
  const [order, setOrder] = useState([]);          // slot keys this game
  const [round, setRound] = useState(0);
  const [era, setEra] = useState(null);
  const [displayEra, setDisplayEra] = useState(ERAS[0]);
  const [spinning, setSpinning] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [query, setQuery] = useState("");
  const [slots, setSlots] = useState({});          // key -> {name,value,score}
  const [used, setUsed] = useState(() => new Set());
  const [flash, setFlash] = useState(null);
  const intervalRef = useRef(null);

  const maxBy = useMemo(() => {
    const m = {};
    SLOTS.forEach((s) => { m[s.key] = Math.max(...PLAYERS.map((p) => p[s.key])); });
    return m;
  }, []);

  const filled = Object.values(slots);
  const indexNow = filled.length
    ? Math.round((filled.reduce((a, s) => a + s.score, 0) / filled.length) * 100)
    : 0;

  // spin a fresh era each playing round
  useEffect(() => {
    if (phase !== "playing") return;
    setSelectedSlot(null); setQuery("");
    if (prefersReduced) {
      const f = ERAS[Math.floor(Math.random() * ERAS.length)];
      setEra(f); setDisplayEra(f); setSpinning(false); return;
    }
    setSpinning(true);
    let t = 0;
    intervalRef.current = setInterval(() => {
      setDisplayEra(ERAS[Math.floor(Math.random() * ERAS.length)]);
      if (++t > 13) {
        clearInterval(intervalRef.current);
        const f = ERAS[Math.floor(Math.random() * ERAS.length)];
        setEra(f); setDisplayEra(f); setSpinning(false);
      }
    }, 65);
    return () => clearInterval(intervalRef.current);
  }, [round, phase]);

  const candidates = useMemo(() => {
    if (!era) return [];
    const q = query.trim().toLowerCase();
    return PLAYERS.filter(
      (p) => p.eras.includes(era) && !used.has(p.name) &&
             (q === "" || p.name.toLowerCase().includes(q))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [era, query, used]);

  function start(mode) {
    let keys;
    if (mode === "full") keys = shuffle(SLOTS.map((s) => s.key));
    else keys = shuffle([...shuffle(HARDWARE).slice(0, 4), ...shuffle(STATS).slice(0, 2)]);
    setOrder(keys);
    setSlots({}); setUsed(new Set()); setRound(0); setFlash(null);
    setPhase("playing");
  }

  function pick(player) {
    const slot = SLOT_BY_KEY[selectedSlot];
    const value = player[slot.key];
    const score = maxBy[slot.key] ? Math.min(value / maxBy[slot.key], 1) : 0;
    const next = { ...slots, [slot.key]: { name: player.name, value, score } };
    const nextUsed = new Set(used); nextUsed.add(player.name);
    setSlots(next); setUsed(nextUsed);
    setFlash({ name: player.name, slot, value, score });
    setSelectedSlot(null); setQuery("");
    setTimeout(() => {
      setFlash(null);
      if (Object.keys(next).length >= order.length) setPhase("reveal");
      else setRound((r) => r + 1);
    }, 1250);
  }

  const wrap = {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    background: `radial-gradient(120% 90% at 50% -10%, #1a1a20 0%, ${C.bg} 60%)`,
    color: C.text, minHeight: "100%", padding: "26px 16px 40px", boxSizing: "border-box",
  };
  const display = { fontFamily: "Oswald, 'Arial Narrow', system-ui, sans-serif" };

  return (
    <div style={wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes stamp { 0%{transform:scale(2.4);opacity:0} 60%{opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes glow { 0%,100%{filter:drop-shadow(0 0 8px rgba(232,184,75,.25))} 50%{filter:drop-shadow(0 0 22px rgba(232,184,75,.6))} }
        @keyframes pop { 0%{transform:scale(.85);opacity:0} 100%{transform:scale(1);opacity:1} }
        .gbtn{ transition:transform .12s ease, background .15s ease, border-color .15s ease; cursor:pointer; }
        .gbtn:hover{ transform:translateY(-1px); }
        .grow:hover{ background:${C.panel2}!important; }
        .gslot:hover{ border-color:${C.gold}!important; }
        @media (prefers-reduced-motion: reduce){ *{animation:none!important} }
      `}</style>

      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ ...display, fontSize: 60, fontWeight: 700, lineHeight: .9,
            letterSpacing: 2, color: C.gold, animation: "glow 3.5s ease-in-out infinite" }}>
            G·O·A·T
          </div>
          <div style={{ color: C.dim, fontSize: 13, marginTop: 6 }}>
            Draft a résumé across eras. Trophies and stats. Get ranked.
          </div>
        </div>

        {phase === "intro" && <Intro onStart={start} display={display} />}

        {phase === "playing" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 12 }}>
              <span style={{ color: C.dim, fontSize: 13 }}>
                Slot {filled.length + 1} of {order.length}
              </span>
              <span style={{ ...display, fontSize: 18, color: C.gold, letterSpacing: 1 }}>
                GOAT INDEX {indexNow}
              </span>
            </div>

            <div style={{ background: C.panel, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: "16px 20px", textAlign: "center", marginBottom: 16 }}>
              <div style={{ color: C.dim, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>
                ERA ON THE CLOCK
              </div>
              <div style={{ ...display, fontSize: 44, fontWeight: 700, color: C.orange,
                opacity: spinning ? .55 : 1, letterSpacing: 1 }}>
                {displayEra}
              </div>
            </div>

            {flash ? (
              <Flash flash={flash} display={display} />
            ) : !selectedSlot ? (
              <>
                <div style={{ color: C.dim, fontSize: 13, marginBottom: 10 }}>
                  {spinning ? "Spinning…" : `Assign the ${era} to one open slot:`}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {order.map((k) => {
                    const slot = SLOT_BY_KEY[k];
                    const f = slots[k];
                    const g = f && grade(f.score);
                    return (
                      <button key={k} disabled={!!f || spinning}
                        onClick={() => setSelectedSlot(k)}
                        className={f ? "" : "gbtn gslot"}
                        style={{
                          textAlign: "left", padding: "10px 12px", borderRadius: 11,
                          border: `1px solid ${f ? C.border : "#3a3a44"}`,
                          background: f ? C.panel2 : C.panel,
                          color: f ? C.dim : C.text, fontFamily: "inherit",
                          opacity: spinning && !f ? .5 : 1,
                          cursor: f || spinning ? "default" : "pointer",
                        }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{slot.label}</div>
                        <div style={{ fontSize: 11, color: f ? g.c : C.dim, marginTop: 3 }}>
                          {f ? `${f.name.split(" ").slice(-1)} · ${fmtVal(slot, f.value)}` : (slot.type === "avg" ? "rate stat" : "trophy count")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ animation: "pop .2s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>
                    Filling <b style={{ color: C.orange }}>{SLOT_BY_KEY[selectedSlot].label}</b> from the {era}
                  </span>
                  <button onClick={() => { setSelectedSlot(null); setQuery(""); }}
                    style={{ background: "none", border: "none", color: C.dim,
                      fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← back</button>
                </div>
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Name a ${era} player…`}
                  style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px",
                    borderRadius: 10, border: `1px solid ${C.border}`, background: C.panel,
                    color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none",
                    marginBottom: 8 }} />
                <div style={{ maxHeight: 220, overflowY: "auto",
                  border: `1px solid ${C.border}`, borderRadius: 10 }}>
                  {candidates.length === 0 && (
                    <div style={{ padding: 14, color: C.dim, fontSize: 13 }}>
                      No eligible player by that name. Stats stay hidden — trust your memory.
                    </div>
                  )}
                  {candidates.map((p) => (
                    <div key={p.name} className="grow gbtn" onClick={() => pick(p)}
                      style={{ padding: "11px 14px", fontSize: 14,
                        borderBottom: `1px solid ${C.border}`, background: C.panel }}>
                      {p.name}
                    </div>
                  ))}
                </div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>
                  You're picking blind — know who owns {SLOT_BY_KEY[selectedSlot].label} in the {era}.
                </div>
              </div>
            )}
          </>
        )}

        {phase === "reveal" && (
          <Reveal slots={slots} order={order} index={indexNow} display={display}
            onAgain={() => setPhase("intro")} />
        )}
      </div>
    </div>
  );
}

function Intro({ onStart, display }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "#d6d2c8" }}>
        <p style={{ marginTop: 0 }}>
          Build the GOAT from <b>trophies</b> (MVP, Finals MVP, rings, scoring titles, All-NBA,
          All-Defensive, All-Star) and <b>career averages</b> (PPG, APG, RPG, SPG, BPG).
        </p>
        <p>
          Each round spins a random <b style={{ color: C.orange }}>era</b>. Assign it to an open
          slot, then name a player from that era — <b>blind</b>. You bank their real number, graded
          against the all-time best in that category. No player twice.
        </p>
        <p style={{ marginBottom: 0 }}>
          Your <b style={{ color: C.gold }}>GOAT Index</b> is the average grade across every slot.
          Nail the category kings and chase 100.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
        <button onClick={() => onStart("quick")} className="gbtn"
          style={{ ...display, padding: "13px", borderRadius: 12, border: "none",
            background: C.gold, color: "#1a1407", fontSize: 17, fontWeight: 700,
            letterSpacing: .5, cursor: "pointer" }}>
          QUICK DRAFT<div style={{ fontSize: 11, fontWeight: 500, opacity: .7 }}>6 slots</div>
        </button>
        <button onClick={() => onStart("full")} className="gbtn"
          style={{ ...display, padding: "13px", borderRadius: 12,
            border: `1px solid ${C.gold}`, background: "transparent", color: C.gold,
            fontSize: 17, fontWeight: 700, letterSpacing: .5, cursor: "pointer" }}>
          FULL RÉSUMÉ<div style={{ fontSize: 11, fontWeight: 500, opacity: .7 }}>all 12 slots</div>
        </button>
      </div>
    </div>
  );
}

function Flash({ flash, display }) {
  const g = grade(flash.score);
  return (
    <div style={{ textAlign: "center", padding: "24px 0", animation: "pop .25s ease" }}>
      <div style={{ ...display, fontSize: 30, fontWeight: 700 }}>{flash.name}</div>
      <div style={{ color: C.dim, fontSize: 14, marginTop: 6 }}>
        {fmtVal(flash.slot, flash.value)} · {flash.slot.label}
      </div>
      <div style={{ ...display, fontSize: 34, fontWeight: 700, marginTop: 10, color: g.c }}>
        {g.t}
      </div>
      <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>
        {Math.round(flash.score * 100)}% of the category GOAT
      </div>
    </div>
  );
}

function Reveal({ slots, order, index, display, onAgain }) {
  const tier = getTier(index);
  const trophies = order.filter((k) => SLOT_BY_KEY[k].type === "count");
  const rates = order.filter((k) => SLOT_BY_KEY[k].type === "avg");
  const Line = ({ k }) => {
    const slot = SLOT_BY_KEY[k]; const s = slots[k]; const g = grade(s.score);
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 14 }}>
            <b>{fmtVal(slot, s.value)}</b> <span style={{ color: C.dim }}>{slot.label}</span>
          </div>
          <div style={{ fontSize: 12, color: C.dim }}>via {s.name}</div>
        </div>
        <div style={{ ...display, fontSize: 15, color: g.c }}>{g.t}</div>
      </div>
    );
  };
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color: C.dim, fontSize: 12, letterSpacing: 2, marginBottom: 6 }}>
        GOAT INDEX — {index} / 100
      </div>
      <div style={{ ...display, fontSize: 52, fontWeight: 700, letterSpacing: 1, color: tier.color,
        animation: "stamp .5s cubic-bezier(.2,1.2,.3,1) both", marginBottom: 6 }}>
        {tier.name}
      </div>
      <div style={{ color: "#cfcabf", fontSize: 14, maxWidth: 470, margin: "0 auto 18px" }}>
        {tier.verdict}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14,
        overflow: "hidden", textAlign: "left", marginBottom: 18 }}>
        {trophies.length > 0 && (
          <div style={{ padding: "9px 16px", color: C.dim, fontSize: 11, letterSpacing: 1.5,
            borderBottom: `1px solid ${C.border}` }}>TROPHY CASE</div>
        )}
        {trophies.map((k) => <Line key={k} k={k} />)}
        {rates.length > 0 && (
          <div style={{ padding: "9px 16px", color: C.dim, fontSize: 11, letterSpacing: 1.5,
            borderBottom: `1px solid ${C.border}`, borderTop: trophies.length ? `1px solid ${C.border}` : "none" }}>
            CAREER STAT LINE</div>
        )}
        {rates.map((k) => <Line key={k} k={k} />)}
      </div>

      <button onClick={onAgain} className="gbtn"
        style={{ ...display, width: "100%", padding: "14px", borderRadius: 12,
          border: `1px solid ${C.gold}`, background: "transparent", color: C.gold,
          fontSize: 18, fontWeight: 700, letterSpacing: 1, cursor: "pointer" }}>
        RUN IT BACK
      </button>
    </div>
  );
}
