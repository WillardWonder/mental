/* My Mental Game — Merrill Bluejays Girls Wrestling. Simple, tap-first. */
(() => {
const D = window.MG, SK = D.skills;
const KEY = "mental-v1", COL = "mental", OWNER = "stutting.josh@gmail.com";
const blank = () => ({ a: {}, p: {}, day: {} });
let S; try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = blank(); }
const $ = (q, el = document) => el.querySelector(q), $$ = (q, el = document) => [...el.querySelectorAll(q)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = $("#app"), CLEAN = [];
const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 1700); };
const ymd = d => d.toISOString().slice(0, 10), today = () => ymd(new Date());
const daysBack = n => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return ymd(d); });
const A = (n) => (S.a[n] = S.a[n] || {}), P = n => (S.p[n] = S.p[n] || {});
const stars = n => { const p = P(n); return ["did", "prac", "quiz"].filter(k => p[k]).length; };

/* ---------------- cloud (Firebase) ---------------- */
const CFG = window.YOU_FIREBASE; let COACHES = [OWNER];
const C = { ready: !!(CFG && window.firebase && CFG.apiKey), on: false, local: localStorage.getItem(KEY + "-local") === "1", user: null, db: null, t: null,
  coach() { return !!this.user && COACHES.includes((this.user.email || "").toLowerCase()); },
  owner() { return !!this.user && (this.user.email || "").toLowerCase() === OWNER; },
  async loadCoaches() { try { const q = await this.db.collection("youuCoaches").get(); COACHES = [OWNER, ...q.docs.map(d => d.id)]; } catch (e) {} },
  async allowed(u) { const e = (u.email || "").toLowerCase(); if (!u.emailVerified) return false; if (/@mapsedu\.org$/.test(e) || COACHES.includes(e)) return true;
    try { return (await this.db.collection("youuInvites").doc(e).get()).exists; } catch (x) { return false; } },
  push() { if (!this.on) return; clearTimeout(this.t); this.t = setTimeout(() => this.db.collection(COL).doc(this.user.uid)
    .set({ email: this.user.email, name: this.user.displayName || this.user.email, updatedAt: Date.now(), state: JSON.parse(JSON.stringify(S)) })
    .then(() => status("saved ✓")).catch(() => status("saved on phone")), 1000); }
};
const status = s => { const w = $("#who"); if (C.user) { w.hidden = false; w.textContent = (C.user.displayName || C.user.email).split(/[ @]/)[0] + " · " + s; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} C.push(); };

/* ---------------- read it to me ---------------- */
function speak(text, btn) {
  if (!("speechSynthesis" in window)) return toast("Your browser can't read aloud");
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); btn.textContent = "🔊 Read it to me"; return; }
  const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.onend = () => (btn.textContent = "🔊 Read it to me");
  btn.textContent = "⏹ Stop"; speechSynthesis.speak(u);
}

/* ---------------- views ---------------- */
const V = {};
V.home = () => {
  const run = streak(), done = SK.filter(s => stars(s.n) === 3).length, ci = !!checked(today());
  app.innerHTML = `<div class="hero"><img src="bluejay.png" alt=""><div class="t1">MY</div><div class="t2">MENTAL<br>GAME</div>
   <p>7 skills. A few minutes each. Read it, tap it, try it at practice.</p></div>
  <a class="card" href="#daily" style="display:block;text-decoration:none;color:inherit;border-color:${ci ? "var(--ok)" : "var(--gold)"}">${ci ? `✅ <b>Checked in today.</b> <span class="muted">${run}-day run</span>` : `<div class="lab" style="color:var(--gold)">Daily check-in · 15 seconds</div><b>Water, food, sleep. Tap in today →</b><div class="small muted">${run}-day run. Never miss twice.</div>`}</a>
  <h2>My 7 skills <span class="muted small">${done}/7 done</span></h2>
  <div class="tiles">${SK.map(s => `<a class="tile" href="#skill-${s.n}" style="background:${s.color}"><span class="n" style="color:${s.color}">${s.n}</span><span class="st">${"★".repeat(stars(s.n))}${"☆".repeat(3 - stars(s.n))}</span><b>${esc(s.title)}</b><span class="small" style="opacity:.9">${esc(s.hook)}</span></a>`).join("")}
   <a class="tile" href="#card" style="background:#2a3550"><span class="n">🪪</span><b>My Card</b><span class="small" style="opacity:.9">Your best tools on one card</span></a></div>
  <p class="small muted" style="margin-top:16px">★ = did the activity · tried it at practice · passed the quiz. <a href="My_Mental_Game_Workbook.pdf" target="_blank" rel="noopener">Printable packet (PDF)</a></p>`;
};

V.skill = n => {
  const s = SK.find(x => x.n === +n); if (!s) return V.home();
  const a = A(s.n), p = P(s.n), d = s.do;
  const readText = s.read.join(" ") + " Coach Knight says: " + s.coach + " Science says: " + s.sci;
  app.innerHTML = `<div class="band" style="background:${s.color}"><span class="n" style="color:${s.color}">${s.n}</span><div><h1>${esc(s.title)}</h1><p>${esc(s.hook)}</p></div></div>
  <div class="card"><div class="row"><div class="lab">1 · Read</div><span class="sp"></span><button class="btn ghost sm" id="say">🔊 Read it to me</button></div>
   ${s.read.map(x => `<p style="font-size:19px;margin:6px 0">${esc(x)}</p>`).join("")}
   <div class="grid g2" style="margin-top:10px"><div class="small"><span class="tag tb">Coach Knight says</span><br>${esc(s.coach)} <span class="src">[${s.coach_src}]</span></div><div class="small"><span class="tag ts">Science says</span><br>${esc(s.sci)} <span class="src">[${s.sci_src}]</span></div></div></div>
  <div class="card" style="border-color:${s.color}"><div class="lab">2 · Do</div><div id="do"></div></div>
  <div class="card"><div class="lab">3 · Try it at practice</div><p style="font-size:18px;margin:4px 0 10px">${esc(s.try)}</p>
   <label class="row" style="margin:6px 0"><input type="checkbox" id="prac" ${p.prac ? "checked" : ""} style="width:24px;height:24px"> I did it at practice</label>
   <label class="row" style="margin:6px 0"><input type="checkbox" id="match" ${p.match ? "checked" : ""} style="width:24px;height:24px"> I used it in a match</label></div>
  <div class="card"><div class="lab">Quick quiz · 3 taps</div><div id="quiz"></div></div>
  <div class="row" style="margin-top:6px">${s.n > 1 ? `<a class="btn ghost sm" href="#skill-${s.n - 1}">← Skill ${s.n - 1}</a>` : ""}<span class="sp"></span>${s.n < 7 ? `<a class="btn sm" href="#skill-${s.n + 1}">Skill ${s.n + 1} →</a>` : `<a class="btn sm" href="#card">My Card →</a>`}</div>`;
  $("#say").onclick = e => speak(readText, e.target);
  CLEAN.push(() => { try { speechSynthesis.cancel(); } catch (e) {} });
  $("#prac").onchange = e => { p.prac = e.target.checked; save(); if (p.prac) toast("1% better ✓"); };
  $("#match").onchange = e => { p.match = e.target.checked; save(); if (p.match) toast("That's the goal ✓"); };
  const did = () => { if (!p.did) { p.did = 1; save(); toast("Nice. Activity done ✓"); } };
  DO[d.type](s, $("#do"), a, did);
  quiz(s, $("#quiz"), p);
};

/* ---------------- activities ---------------- */
function chipGroup(el, opts, key, a, multi, did, own) {
  const cur = () => (multi ? (a[key] || []) : a[key]);
  el.innerHTML = `<div class="row" style="gap:8px">${opts.map(o => `<button class="btn ${((multi ? cur().includes(o) : cur() === o)) ? "" : "ghost"} sm" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>${own ? `<input type="text" placeholder="Or write your own" style="margin-top:8px" data-own value="${esc(a[key + "_own"] || "")}">` : ""}`;
  $$("[data-o]", el).forEach(b => b.onclick = () => { const o = b.dataset.o;
    if (multi) { const v = cur(); a[key] = v.includes(o) ? v.filter(x => x !== o) : [...v, o]; } else a[key] = a[key] === o ? "" : o;
    save(); did(); chipGroup(el, opts, key, a, multi, did, own); });
  const ow = $("[data-own]", el); if (ow) ow.oninput = () => { a[key + "_own"] = ow.value; save(); if (ow.value.trim()) did(); };
}
const DO = {
  circle(s, el, a, did) { el.innerHTML = `<p style="font-weight:600">${esc(s.do.prompt)}</p><div id="g1"></div>`; chipGroup($("#g1", el), s.do.options, "pick", a, false, did, s.do.own); },
  circle2(s, el, a, did) {
    const multi1 = s.slug === "nerves";
    el.innerHTML = `<p style="font-weight:600">${esc(s.do.prompt)}${multi1 ? " <span class='muted small'>(tap all that fit)</span>" : ""}</p><div id="g1"></div><p style="font-weight:600;margin-top:16px">${esc(s.do.prompt2)}</p><div id="g2"></div>${s.do.reset ? `<p style="font-weight:600;margin-top:16px">Practice the reset. Tap each step in order:</p><div class="row" id="rs">${["Notice", "Breathe", "Big Dog", "First Job"].map((x, i) => `<button class="btn ghost sm" data-r="${i}">${i + 1} ${x}</button>`).join("")}</div>` : ""}`;
    chipGroup($("#g1", el), s.do.options, "pick", a, multi1, did, !multi1 && s.do.own);
    chipGroup($("#g2", el), s.do.options2, "pick2", a, false, did, s.do.own);
    if (s.do.reset) { let k = 0; $$("[data-r]", el).forEach(b => b.onclick = () => { if (+b.dataset.r !== k) return toast("In order: Notice, Breathe, Big Dog, First Job"); b.classList.remove("ghost"); b.classList.add("ok"); k++; if (k === 4) { toast("Reset done. Keep wrestling!"); k = 0; setTimeout(() => $$("[data-r]", el).forEach(x => { x.classList.add("ghost"); x.classList.remove("ok"); }), 1200); } }); }
  },
  breath(s, el, a, did) {
    el.innerHTML = `<p style="font-weight:600">Tap Start. Follow the dot around the box. Each box earns a star.</p>
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 220 220" width="220" height="220"><rect x="20" y="20" width="180" height="180" rx="14" fill="#0c2a24" stroke="${s.color}" stroke-width="6"/><circle id="bd" cx="20" cy="20" r="13" fill="#ff2147"/><text id="bt" x="110" y="104" text-anchor="middle" fill="#fff" font-size="20" font-weight="800">Ready</text><text id="bc" x="110" y="136" text-anchor="middle" fill="#bdf2db" font-size="28" font-weight="800"></text></svg>
    <div><div id="bs" style="font-size:30px;letter-spacing:2px"></div><button class="btn" id="bgo" style="margin-top:10px">Start</button></div></div>
    <p class="small muted">Feel dizzy? Stop and breathe normally.</p><p style="font-weight:600;margin-top:12px">${esc(s.do.prompt2)} <span class="muted small">(tap all that fit)</span></p><div id="g2"></div>`;
    chipGroup($("#g2", el), s.do.options2, "when", a, true, did);
    const paintStars = () => $("#bs", el).textContent = "★".repeat(Math.min(5, a.boxes || 0)) + "☆".repeat(Math.max(0, 5 - (a.boxes || 0)));
    paintStars();
    const side = [["Breathe in", [200, 20]], ["Hold", [200, 200]], ["Breathe out", [20, 200]], ["Hold", [20, 20]]];
    let timer = null; CLEAN.push(() => clearInterval(timer));
    $("#bgo", el).onclick = () => {
      if (timer) { clearInterval(timer); timer = null; $("#bgo", el).textContent = "Start"; return; }
      $("#bgo", el).textContent = "Stop"; let t = 0; const dot = $("#bd", el);
      timer = setInterval(() => { const ph = Math.floor(t / 40) % 4, f = (t % 40) / 40, from = side[(ph + 3) % 4][1], to = side[ph][1];
        dot.setAttribute("cx", from[0] + (to[0] - from[0]) * f); dot.setAttribute("cy", from[1] + (to[1] - from[1]) * f);
        $("#bt", el).textContent = side[ph][0]; $("#bc", el).textContent = 4 - Math.floor((t % 40) / 10);
        t++; if (t % 160 === 0) { a.boxes = (a.boxes || 0) + 1; save(); did(); paintStars(); if (a.boxes % 5 === 0) toast("5 boxes! Nice and calm."); } }, 100);
    };
  },
  match(s, el, a, did) {
    const L = s.do.pairs.map(p => p[0]), R = s.do.shuffle.map(i => s.do.pairs[i][1]);
    a.matched = a.matched || []; let pick = null;
    const draw = () => {
      el.innerHTML = `<p style="font-weight:600">Tap a little dog line, then the Big Dog answer that fixes it.</p><div class="grid g2" style="grid-template-columns:1fr 1fr">
      <div>${L.map((x, i) => `<button class="btn ${a.matched.includes(i) ? "ok" : pick === i ? "" : "ghost"} wide" data-l="${i}" style="margin:5px 0;text-align:left">${esc(x)}</button>`).join("")}</div>
      <div>${R.map((x, j) => { const i = s.do.shuffle[j]; return `<button class="btn ${a.matched.includes(i) ? "ok" : "ghost"} wide" data-r="${i}" style="margin:5px 0;text-align:left;border-color:${s.color}">${esc(x)}</button>`; }).join("")}</div></div>
      <label class="l">${esc(s.do.own_prompt)}</label><input type="text" id="bdw" placeholder="e.g., Next move. Go." value="${esc(a.words || "")}">`;
      $$("[data-l]", el).forEach(b => b.onclick = () => { pick = +b.dataset.l; draw(); });
      $$("[data-r]", el).forEach(b => b.onclick = () => { if (pick === null) return toast("Tap a little dog line first"); if (+b.dataset.r === pick) { if (!a.matched.includes(pick)) a.matched.push(pick); save(); toast("Match!"); if (a.matched.length === L.length) did(); } else toast("Not that one. Try another."); pick = null; draw(); });
      $("#bdw", el).oninput = e => { a.words = e.target.value; save(); };
    };
    draw();
  },
  jar(s, el, a, did) {
    a.coins = a.coins || ["", "", ""];
    el.innerHTML = `<p style="font-weight:600">${esc(s.do.prompt)}</p>${[0, 1, 2].map(i => `<label class="l">🪙 Proof ${i + 1}</label><input type="text" data-c="${i}" placeholder="${["e.g., Got up from bottom after she rode me", "e.g., Kept attacking in the 3rd period", "e.g., Wrestled hard after I lost the first match"][i]}" value="${esc(a.coins[i])}">`).join("")}
    <p class="small muted" style="margin-top:10px">Proof can come from a loss. Tough is how you act.</p>`;
    $$("[data-c]", el).forEach(i => i.oninput = () => { a.coins[+i.dataset.c] = i.value; save(); if (a.coins.filter(x => x.trim()).length === 3) did(); });
  },
  frames(s, el, a, did) {
    a.fr = a.fr || ["", "", "", ""];
    el.innerHTML = `<p style="font-weight:600">A few words in each box.</p><div class="grid g2">${s.do.frames.map(([t, h], i) => `<div class="card" style="margin:0;${t.includes("PROBLEM") ? "border-color:var(--red)" : ""}"><b>${esc(t)}</b><input type="text" data-f="${i}" placeholder="${esc(h)}" value="${esc(a.fr[i])}" style="margin-top:6px"></div>`).join("")}</div>
    <label class="l">${esc(s.do.fill)}…</label><input type="text" id="ift" value="${esc(a.ift || "")}">
    <button class="btn red" id="play" style="margin-top:12px">▶ Play my match (eyes closed after each part)</button>`;
    $$("[data-f]", el).forEach(i => i.oninput = () => { a.fr[+i.dataset.f] = i.value; save(); if (a.fr.every(x => x.trim())) did(); });
    $("#ift", el).oninput = e => { a.ift = e.target.value; save(); };
    $("#play", el).onclick = () => stage(s.do.frames.map(([t], i) => ({ l: t, t: a.fr[i] || "(write this part first)", s: "See it. Feel it. Real speed.", ms: 6000 })));
  },
};

/* ---------------- quiz ---------------- */
function quiz(s, el, p) {
  const ans = {};
  const draw = () => {
    el.innerHTML = s.quiz.map((q, i) => `<div style="margin:12px 0"><b>${i + 1}. ${esc(q.q)}</b><div style="margin-top:6px">${q.o.map((o, j) => {
      const chosen = ans[i] === j, cls = chosen ? (j === q.a ? "ok" : "red") : "ghost";
      return `<button class="btn ${cls} sm wide" data-q="${i}" data-o="${j}" style="margin:4px 0;text-align:left">${esc(o)}${chosen ? (j === q.a ? " ✓" : " ✗ try again") : ""}</button>`; }).join("")}</div></div>`).join("") + (p.quiz ? `<p style="color:var(--ok);font-weight:800">⭐ Quiz passed</p>` : "");
    $$("[data-q]", el).forEach(b => b.onclick = () => { ans[+b.dataset.q] = +b.dataset.o; if (s.quiz.every((q, i) => ans[i] === q.a) && !p.quiz) { p.quiz = 1; save(); toast("Quiz passed ⭐"); } draw(); });
  };
  draw();
}

/* ---------------- daily ---------------- */
const checked = d => { const w = S.day[d]; return w && Object.keys(w).filter(k => k[0] !== "_").length >= 3 ? w : null; };
function streak() { const ds = daysBack(60); let run = 0, miss = 0; for (let i = ds.length - 1; i >= 0; i--) { const d = ds[i]; if (d === today() && !checked(d)) continue; if (checked(d)) { run++; miss = 0; } else if (++miss >= 2) break; } return run; }
V.daily = () => {
  const w = S.day[today()] = S.day[today()] || {};
  const tile = ([k, ic, l, unit, goal]) => {
    const v = w[k]; let ctl = "", ok = false;
    if (k === "bfast") { ok = !!v; ctl = `<button class="btn ${v ? "ok" : "ghost"} sm" data-t="${k}">${v ? "Yes ✓" : "Tap if yes"}</button>`; }
    else if (k === "ready") { ok = v >= 4; ctl = `<div class="row" style="justify-content:center;gap:4px">${[1, 2, 3, 4, 5].map(n => `<button class="btn ${+v === n ? "" : "ghost"} sm" data-s="${n}" style="padding:7px 10px">${n}</button>`).join("")}</div>`; }
    else if (k === "sleep") { ok = (v ?? 0) >= 8; ctl = `<div class="cnt"><button class="btn ghost sm" data-h="-0.5">−</button><b>${v ?? "—"}</b><button class="btn sm" data-h="0.5">+</button></div><div class="small muted">hours · goal 8 to 10</div>`; }
    else { ok = (v || 0) >= goal; ctl = `<div class="cnt"><button class="btn ghost sm" data-m="${k}">−</button><b>${v || 0}</b><button class="btn sm" data-p="${k}">+</button></div><div class="small muted">goal ${goal}${unit ? " " + unit : ""}</div>`; }
    return `<div class="card hab ${ok ? "done" : ""}"><div class="e">${ic}</div><b>${l}</b>${ctl}</div>`;
  };
  const run = streak(), dots = daysBack(14).map(d => `<span class="${checked(d) ? "on" : d === today() ? "td" : ""}"></span>`).join("");
  app.innerHTML = `<h1>Fuel + Rest</h1><p class="hook">15 seconds. Tap what you did today.</p>
  <div class="card"><div class="row"><div><div class="big">${run}</div><div class="small muted">day run · <b>never miss twice</b></div></div><span class="sp"></span><div class="dots">${dots}</div></div></div>
  <div class="tiles" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${D.daily.map(tile).join("")}</div>
  <p class="small muted" style="margin-top:14px">This is about fuel and rest, not weight. Wrestlers need to eat enough. If making weight ever means skipping meals or water, talk to your coach.</p>`;
  const set = (k, v) => { w[k] = v; save(); const y = scrollY; V.daily(); scrollTo(0, y); if (checked(today()) && !w._t) { w._t = 1; save(); toast("Checked in ✓"); } };
  $$("[data-p]").forEach(b => b.onclick = () => set(b.dataset.p, (w[b.dataset.p] || 0) + 1));
  $$("[data-m]").forEach(b => b.onclick = () => set(b.dataset.m, Math.max(0, (w[b.dataset.m] || 0) - 1)));
  $$("[data-t]").forEach(b => b.onclick = () => set("bfast", !w.bfast));
  $$("[data-s]").forEach(b => b.onclick = () => set("ready", +b.dataset.s));
  $$("[data-h]").forEach(b => b.onclick = () => set("sleep", Math.min(14, Math.max(0, (w.sleep ?? 8) + +b.dataset.h))));
};

/* ---------------- breathe ---------------- */
V.breathe = () => {
  app.innerHTML = `<h1>Box Breathing</h1><p class="hook">Coach Arnie's 4-4-4-4. Breathe low into your belly.</p>
  <div class="tabs"><button class="on" data-m="box">Box · 4-4-4-4</button><button data-m="quick">Quick Reset</button></div>
  <div class="pacer"><div class="ring" id="ring"><i id="ph">READY</i><b id="wd">Tap Start</b><div class="c" id="ct"></div></div><button class="btn" id="go" style="margin-top:18px">Start</button>
  <p class="small muted" style="text-align:center;max-width:420px">Feel dizzy? Stop and breathe normally. Never hold your breath for a contest.</p></div>`;
  let mode = "box", timer = null; CLEAN.push(() => clearInterval(timer));
  const BOX = [["IN", "Persistent", 4, 1.18], ["HOLD", "Consistent", 4, 1.18], ["OUT", "Resilient", 4, .86], ["HOLD", "Relentless", 4, .86]];
  const QUICK = [["IN", "Big belly breath", 2, 1.12], ["TOP UP", "Small sniff", 1, 1.18], ["OUT", "Long and slow", 5, .86]];
  const stop = () => { clearInterval(timer); timer = null; $("#go").textContent = "Start"; $("#ph").textContent = "READY"; $("#wd").textContent = "Tap Start"; $("#ct").textContent = ""; $("#ring").style.transform = "scale(1)"; };
  $$("[data-m]").forEach(b => b.onclick = () => { $$("[data-m]").forEach(x => x.classList.remove("on")); b.classList.add("on"); mode = b.dataset.m; stop(); });
  $("#go").onclick = () => { if (timer) return stop(); const seq = mode === "box" ? BOX : QUICK, R = mode === "box" ? 3 : 2; let r = 0, i = 0, left = seq[0][2]; $("#go").textContent = "Stop";
    const paint = () => { const [ph, w, sec, sc] = seq[i]; $("#ph").textContent = ph; $("#wd").textContent = w; $("#ct").textContent = left; const ring = $("#ring"); ring.style.transitionDuration = sec + "s"; ring.style.transform = `scale(${sc})`; ring.style.borderColor = ph === "OUT" ? "var(--red)" : "var(--blue)"; };
    paint(); timer = setInterval(() => { if (--left > 0) return ($("#ct").textContent = left); if (++i >= seq.length) { i = 0; r++; } if (r >= R) { stop(); $("#wd").textContent = "Nice. Done."; return; } left = seq[i][2]; paint(); }, 1000); };
};

/* ---------------- my card ---------------- */
V.card = () => {
  const two = A(2), sev = A(7), four = A(4);
  const fuel = two.pick2 || two.pick2_own, sw = sev.pick || sev.pick_own, fj = sev.pick2 || sev.pick2_own, bd = four.words, one = A(1).pick || A(1).pick_own;
  const r = (l, v, from) => `<div class="r"><b>${l}</b><span>${v ? esc(v) : `<a href="#skill-${from}" class="np" style="color:#93a6c2">Pick it in Skill ${from}</a>`}</span></div>`;
  app.innerHTML = `<h1 class="np">My Card</h1><p class="hook np">Built from your answers. Screenshot it or print it for your bag.</p>
  <div class="scard"><h3><img src="bluejay.png" alt="">MY CARD</h3>${r("MY 1%", one, 1)}${r("FUEL WORDS", fuel, 2)}${r("BIG DOG", bd, 4)}${r("SWITCH ON", sw, 7)}${r("FIRST JOB", fj, 7)}<div class="r"><b>RESET</b><span>Notice → Breathe → Big Dog → First Job</span></div></div>
  <div class="row np" style="margin-top:14px"><button class="btn" onclick="print()">Print</button></div>`;
};

/* ---------------- grown-ups + coach roster ---------------- */
V.grownups = () => {
  app.innerHTML = `<h1>For coaches</h1>${C.coach() ? `<a class="btn red" href="#roster">Open athlete roster →</a>` : ""}
  <div class="card"><div class="lab">5 minutes a skill</div><ol class="small"><li>Read the 3 lines together (or tap "Read it to me").</li><li>Give 2 to 3 minutes for the activity. Don't grade it.</li><li>Put the Try It into a drill you already run.</li><li>Next practice, ask one quiz question out loud.</li></ol><p class="small">One skill a week. Skills 2, 3, and 7 matter most before tournaments. My Card on meet day.</p></div>
  <div class="card"><div class="lab">Keep it safe</div><ul class="small"><li>Sports skills, not therapy.</li><li>Athletes never have to share what they wrote. Coaches can see what athletes enter here; teammates can't.</li><li>Tough never means hiding pain or an injury, especially a head injury.</li><li>Fuel + Rest tracks eating enough and sleep. Never praise skipping meals or water to make weight.</li><li>If something worries you, follow school reporting steps.</li></ul></div>
  <div class="card"><div class="lab">About the book</div><p class="small">Verified from the publisher: <i>Winning State Wrestling</i>, 4th ed., 164 pages, 7 chapters. The Coach Knight ideas here come from his publisher's own materials. Chapter titles aren't published, so this doesn't say which chapter covers what. The activities were made for Merrill, not taken from the book.</p></div>
  <div class="card"><div class="lab">Sources</div><div class="small">${Object.entries(Object.assign({}, D.book, D.sci)).map(([k, v]) => `<div style="margin:4px 0"><b>[${k}]</b> ${esc(v)}</div>`).join("")}</div></div>
  <div class="card"><a href="My_Mental_Game_Workbook.pdf" target="_blank" rel="noopener" class="btn sm">Printable packet (PDF)</a> ${C.user ? `<button class="btn ghost sm" id="out">Sign out</button>` : C.local ? `<button class="btn ghost sm" id="acct">Sign in to sync</button>` : ""}</div>`;
  if ($("#out")) $("#out").onclick = () => { firebase.auth().signOut(); try { localStorage.removeItem(KEY); } catch (e) {} S = blank(); location.hash = "#home"; };
  if ($("#acct")) $("#acct").onclick = () => { localStorage.removeItem(KEY + "-local"); C.local = false; route(); };
};
V.roster = async who => {
  if (!C.coach()) return (app.innerHTML = "<h1>Roster</h1><div class='card'>Coaches only.</div>");
  app.innerHTML = "<h1>Athlete roster</h1><p class='muted'>Loading…</p>";
  let docs; try { docs = (await C.db.collection(COL).get()).docs.map(d => ({ id: d.id, ...d.data() })); } catch (e) { return (app.innerHTML = `<h1>Roster</h1><div class="card">Couldn't load: ${esc(e.message)}</div>`); }
  const nStars = st => SK.reduce((t, s) => t + ["did", "prac", "quiz"].filter(k => ((st.p || {})[s.n] || {})[k]).length, 0);
  const ci = st => daysBack(7).filter(d => st.day && st.day[d] && Object.keys(st.day[d]).filter(k => k[0] !== "_").length >= 3).length;
  if (who) { const d = docs.find(x => x.id === who); if (!d) return V.roster(); const st = Object.assign(blank(), d.state || {});
    app.innerHTML = `<a href="#roster" class="small">← Roster</a><h1>${esc(d.name)}</h1><p class="muted small">${esc(d.email)} · last active ${new Date(d.updatedAt).toLocaleString()}</p>
    <div class="card">${SK.map(s => { const p = st.p[s.n] || {}, a = st.a[s.n] || {}; return `<div class="starrow"><b>${s.n}. ${esc(s.title)}</b><span>${p.did ? "✅" : "⬜"} did · ${p.prac ? "✅" : "⬜"} practice · ${p.quiz ? "✅" : "⬜"} quiz${p.match ? " · 🏅 match" : ""}</span></div>`; }).join("")}</div>
    <div class="card"><div class="lab">Her card</div><div class="small">1%: ${esc((st.a[1] || {}).pick || "—")} · Fuel words: ${esc((st.a[2] || {}).pick2 || "—")} · Big Dog: ${esc((st.a[4] || {}).words || "—")} · Switch on: ${esc((st.a[7] || {}).pick || "—")} · First Job: ${esc((st.a[7] || {}).pick2 || "—")}</div></div>
    <div class="card"><div class="lab">Fuel + Rest · last 7 days</div><div class="small">Check-ins ${ci(st)}/7 · avg sleep ${(() => { const v = daysBack(7).map(x => st.day[x] && st.day[x].sleep).filter(x => x != null); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—"; })()} h</div><p class="small muted">Low sleep or low "ready" for several days is a reason to check in with her, not to push harder.</p></div>`; return; }
  docs = docs.filter(d => !COACHES.includes((d.email || "").toLowerCase())).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  app.innerHTML = `<h1>Athlete roster</h1>
  <div class="card"><div class="lab">Invite (non-@mapsedu.org emails)</div><div id="inv" class="small">Loading…</div><div class="row" style="margin-top:8px"><input type="text" id="ni" placeholder="athlete email" style="flex:1"><button class="btn sm" id="ai">Invite</button></div></div>
  ${C.owner() ? `<div class="card"><div class="lab">Coaches</div><div class="small">${COACHES.map(c => `<div class="row" style="margin:4px 0">${esc(c)}<span class="sp"></span>${c === OWNER ? "<span class='muted'>owner</span>" : `<button class="btn ghost sm" data-rc="${esc(c)}">Remove</button>`}</div>`).join("")}</div><div class="row" style="margin-top:8px"><input type="text" id="nc" placeholder="coach email" style="flex:1"><button class="btn sm" id="ac">Add coach</button></div></div>` : ""}
  <div class="card"><table class="t"><tr><th>Athlete</th><th>Stars /21</th><th>Check-ins 7d</th><th>Last active</th></tr>${docs.map(d => { const st = d.state || {}; return `<tr><td><a href="#roster-${d.id}">${esc(d.name)}</a></td><td>${nStars(st)}</td><td>${ci(st)}/7</td><td>${d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : "—"}</td></tr>`; }).join("") || "<tr><td colspan=4 class='muted'>No athletes yet.</td></tr>"}</table></div>`;
  const ok = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  const drawInv = async () => { try { const q = await C.db.collection("youuInvites").get(); const joined = new Set(docs.map(d => (d.email || "").toLowerCase()));
    $("#inv").innerHTML = q.docs.map(d => `<div class="row" style="margin:4px 0">${esc(d.id)} <span class="muted">${joined.has(d.id) ? "· signed in ✓" : "· not yet"}</span><span class="sp"></span><button class="btn ghost sm" data-ri="${esc(d.id)}">Remove</button></div>`).join("") || "<span class='muted'>No invites yet. @mapsedu.org emails don't need one.</span>";
    $$("[data-ri]").forEach(b => b.onclick = async () => { await C.db.collection("youuInvites").doc(b.dataset.ri).delete(); drawInv(); }); } catch (e) { $("#inv").textContent = e.message; } };
  drawInv();
  $("#ai").onclick = async () => { const e = $("#ni").value.trim().toLowerCase(); if (!ok(e)) return toast("Enter a full email"); try { await C.db.collection("youuInvites").doc(e).set({ invitedBy: C.user.email, at: Date.now() }); $("#ni").value = ""; toast("Invited"); drawInv(); } catch (x) { toast(x.message); } };
  if (C.owner()) {
    $("#ac").onclick = async () => { const e = $("#nc").value.trim().toLowerCase(); if (!ok(e)) return toast("Enter a full email"); await C.db.collection("youuCoaches").doc(e).set({ addedBy: C.user.email, at: Date.now() }); await C.loadCoaches(); V.roster(); };
    $$("[data-rc]").forEach(b => b.onclick = async () => { await C.db.collection("youuCoaches").doc(b.dataset.rc).delete(); await C.loadCoaches(); V.roster(); });
  }
};

/* ---------------- stage (full screen sequences) ---------------- */
function stage(steps) {
  const st = $("#stage"); st.classList.add("on"); let i = 0, h; const close = () => { clearTimeout(h); st.classList.remove("on"); }; $("#stX").onclick = close;
  const next = () => { if (i >= steps.length) return close(); const s = steps[i]; $("#stL").textContent = s.l; $("#stT").textContent = s.t; $("#stS").textContent = s.s || "";
    const bar = $("#stB"); bar.style.transition = "none"; bar.style.width = "0"; requestAnimationFrame(() => { bar.style.transition = `width ${s.ms}ms linear`; bar.style.width = "100%"; }); h = setTimeout(() => { i++; next(); }, s.ms); };
  next();
}

/* ---------------- sign in ---------------- */
V.gate = (msg = "", note = "") => {
  const finishing = firebase.auth().isSignInWithEmailLink(location.href);
  app.innerHTML = `<div class="gate"><img src="bluejay.png" alt=""><h1>My Mental Game</h1>
  ${finishing ? `<p class="hook">Type your email to finish signing in.</p><input type="text" id="em" inputmode="email" placeholder="you@mapsedu.org" value="${esc(localStorage.getItem(KEY + "-email") || "")}"><button class="btn wide" id="fin" style="margin-top:10px">Finish signing in</button>`
  : `<p class="hook">Sign in so your work saves to your account.</p><button class="gbtn" id="g">Sign in with Google</button>
  <div class="muted small" style="margin:16px 0 8px">or get a sign-in link by email (no password)</div><input type="text" id="em" inputmode="email" placeholder="you@mapsedu.org"><button class="btn wide" id="lk" style="margin-top:10px">Email me a link</button>
  <button class="btn ghost wide" id="loc" style="margin-top:18px">No email? Use this phone only</button>`}
  ${note ? `<p class="small" style="color:#bdf2db;margin-top:12px">${esc(note)}</p>` : ""}<p class="small" style="color:#ff8fa2">${esc(msg)}</p>
  <div class="card small" style="text-align:left"><b>Who can get in:</b> @mapsedu.org emails, or an email your coach invites.<br><b>Who can see your answers:</b> you and your coaches. Teammates can't.</div></div>`;
  const em = () => ($("#em").value || "").trim().toLowerCase();
  if (finishing) { $("#fin").onclick = () => firebase.auth().signInWithEmailLink(em(), location.href).then(() => { localStorage.removeItem(KEY + "-email"); history.replaceState(null, "", location.pathname + "#home"); }).catch(e => V.gate(e.code === "auth/invalid-action-code" ? "That link expired. Get a new one." : e.message)); if (localStorage.getItem(KEY + "-email")) $("#fin").click(); return; }
  $("#g").onclick = () => { const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); firebase.auth().signInWithPopup(p).catch(e => /popup/.test(e.code) ? firebase.auth().signInWithRedirect(p) : V.gate(e.message)); };
  $("#lk").onclick = () => { const e = em(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return toast("Type your full email"); $("#lk").disabled = true;
    firebase.auth().sendSignInLinkToEmail(e, { url: location.origin + location.pathname, handleCodeInApp: true }).then(() => { localStorage.setItem(KEY + "-email", e); V.gate("", `Link sent to ${e}. Open it on this phone. Check spam or junk.`); }).catch(x => V.gate(x.message)); };
  $("#loc").onclick = () => { localStorage.setItem(KEY + "-local", "1"); C.local = true; toast("Saving on this phone only"); route(); };
};

/* ---------------- router ---------------- */
function route() {
  while (CLEAN.length) CLEAN.pop()();
  if (C.ready && !C.on && !C.local) return V.gate();
  const h = location.hash.slice(1) || "home", [v, arg] = h.split("-");
  $$("nav a").forEach(a => a.classList.toggle("on", a.dataset.t === v));
  (v === "skill" ? () => V.skill(arg) : v === "roster" ? () => V.roster(h.slice(7)) : V[v] || V.home)();
  scrollTo(0, 0);
}
addEventListener("hashchange", route);
if (C.ready) {
  firebase.initializeApp(CFG); C.db = firebase.firestore(); C.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  app.innerHTML = "<p class='muted' style='text-align:center;margin-top:40px'>Loading…</p>";
  firebase.auth().onAuthStateChanged(async u => {
    if (!u) { C.on = false; C.user = null; $("#who").hidden = true; return route(); }
    await C.loadCoaches();
    if (!(await C.allowed(u))) { const e = u.email; await firebase.auth().signOut(); return V.gate(`${e} isn't a Merrill school email and hasn't been invited. Ask your coach to invite it.`); }
    C.user = u; C.local = false; localStorage.removeItem(KEY + "-local");
    try { const snap = await C.db.collection(COL).doc(u.uid).get(); const last = localStorage.getItem(KEY + "-uid");
      if (snap.exists && snap.data().state) S = Object.assign(blank(), snap.data().state); else if (last && last !== u.uid) S = blank();
      localStorage.setItem(KEY + "-uid", u.uid); if (!snap.exists) { C.on = true; C.push(); } } catch (e) { toast("Offline: using this phone's copy"); }
    C.on = true; status("synced ✓"); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} route();
  });
} else route();
})();
