(() => {
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const COL = {teleop:css('--teleop'),rollout:css('--rollout'),human:css('--human'),sim:css('--sim'),zs:css('--zs'),rb:css('--rb')};
const DARKTEXT = new Set(['human','zs']);
const SVGNS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const fmt = v => (v % 1 ? v.toFixed(1) : v) + '%';

/* ---------- four sources ---------- */
const SRC = [
  ['teleop','Teleoperated','An operator drives the robot into failure on purpose. Highest fidelity, most robot time.'],
  ['rollout','Policy rollouts','Zero-shot π₀ failing on its own, recorded on the real robot.'],
  ['human','Human videos','A person acts out the failure by hand. No robot needed.'],
  ['sim','Real2sim','Failures scripted in a Gaussian-splat copy of the scene. Near-zero marginal cost.']];
const GR = [['low','Low'],['medium','Medium'],['high','High']];
const wrap = document.getElementById('sourceCards');
SRC.forEach(([k,name,desc]) => {
  const card = h(`<article class="src">
    <div class="frame"><video muted loop playsinline preload="none" poster="media/sources/${k}_medium.jpg" data-src="media/sources/${k}_medium.mp4"></video>
      <span class="tag ${DARKTEXT.has(k)?'dark':''}" style="background:${COL[k]}">${name}</span></div>
    <h3><i style="background:${COL[k]}"></i>${name}</h3><p>${desc}</p>
    <div class="grades" role="tablist" aria-label="${name} failure grade"></div></article>`);
  const v = card.querySelector('video'), g = card.querySelector('.grades');
  GR.forEach(([gk,gl]) => {
    const b = h(`<button role="tab" aria-selected="${gk==='medium'}" title="${gl}-progress failure">${gl}</button>`);
    b.onclick = () => { g.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x===b)); v.poster = `media/sources/${k}_${gk}.jpg`; v.dataset.src = v.src = `media/sources/${k}_${gk}.mp4`; v.play().catch(()=>{}); };
    g.appendChild(b);
  });
  wrap.appendChild(card);
});

/* ---------- RL results ---------- */
const RL = window.RL, METH = RL.methods, TASKS = RL.tasks;
const tabs = document.getElementById('rlTabs'), grid = document.getElementById('rlGrid'), side = document.getElementById('rlSide');
let rlTask = 1;
TASKS.forEach(([k,name],i) => {
  const b = h(`<button role="tab" aria-selected="${i===rlTask}"><span class="n">${i+1}</span>${name}</button>`);
  b.onclick = () => { rlTask = i; tabs.querySelectorAll('button').forEach((x,j) => x.setAttribute('aria-selected', j===i)); drawGrid(); };
  tabs.appendChild(b);
});
function drawGrid() {
  const [tk,tname] = TASKS[rlTask];
  grid.innerHTML = '';
  const order = ['zs','rb','teleop','rollout','human','sim'];
  order.forEach(m => {
    const name = METH.find(x => x[0]===m)[1], rate = RL.rates[m][rlTask];
    const tag = `<span class="tag ${DARKTEXT.has(m)?'dark':''}" style="background:${COL[m]}">${name} ${fmt(rate)}</span>`;
    if (RL.missing.includes(`${tk}_${m}`)) { grid.appendChild(h(`<div class="cell empty"><span>Video not added yet</span>${tag}</div>`)); return; }
    grid.appendChild(h(`<div class="cell vidcell" tabindex="0" style="--c:${COL[m]}">
      <video muted loop playsinline preload="none" poster="media/rl/${tk}_${m}.jpg" data-src="media/rl/${tk}_${m}.mp4"></video>
      <div class="tint"></div>${tag}</div>`));
  });
  // side: task summary + bars
  side.innerHTML = `<h3>${tname}</h3><p>Success rate after RL, 20 trials per reward model.</p>`;
  const W = 330, rowH = 34, H = rowH*order.length, svg = el('svg', {viewBox:`0 0 ${W} ${H}`, role:'img', 'aria-label':`Success rate on ${tname}`}, side);
  const x0 = 128, x1 = W - 46;
  order.forEach((m,i) => {
    const v = RL.rates[m][rlTask], y = i*rowH + rowH/2, w = (x1-x0) * v/100;
    const t = el('text', {x:x0-10, y:y+4, 'text-anchor':'end', 'font-size':12.5, fill:'#55514a'}, svg); t.textContent = METH.find(x=>x[0]===m)[1];
    el('rect', {x:x0, y:y-6, width:x1-x0, height:12, rx:4, fill:'#f1eee8'}, svg);
    el('rect', {x:x0, y:y-6, width:Math.max(w,4), height:12, rx:4, fill:COL[m]}, svg);
    const vt = el('text', {x:x0+w+7, y:y+4, 'font-size':12.5, 'font-weight':600, fill:'#161513'}, svg); vt.textContent = fmt(v);
  });
}
drawGrid();

// all-task grouped bars
(function () {
  const svg = document.getElementById('rlChart'), tip = document.getElementById('rlTip');
  const groups = ['Remove lid','Pour cup','Stack cups','Average'], order = ['zs','rb','teleop','rollout','human','sim'];
  const W = 1080, H = 340, L = 44, R = 10, T = 22, B = 40, gw = (W-L-R)/groups.length, bw = 30, gap = 6;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const y = v => T + (H-T-B)*(1-v/100);
  [0,25,50,75,100].forEach(v => { el('line',{x1:L,x2:W-R,y1:y(v),y2:y(v),stroke: v? '#efece6':'#c9c4bb','stroke-width':1},svg); const t=el('text',{x:L-8,y:y(v)+4,'text-anchor':'end','font-size':12,fill:'#8b857b'},svg); t.textContent=v+'%'; });
  groups.forEach((g,gi) => {
    const cx = L + gw*gi + gw/2, tot = order.length*bw + (order.length-1)*gap;
    const gl = el('text',{x:cx,y:H-12,'text-anchor':'middle','font-size':14,'font-weight':gi===3?600:500,fill:'#161513'},svg); gl.textContent = g;
    order.forEach((m,bi) => {
      const v = RL.rates[m][gi], x = cx - tot/2 + bi*(bw+gap), yy = y(v), hh = y(0)-yy;
      const name = METH.find(z=>z[0]===m)[1];
      el('path',{d:`M${x},${y(0)} V${yy+4} Q${x},${yy} ${x+4},${yy} H${x+bw-4} Q${x+bw},${yy} ${x+bw},${yy+4} V${y(0)} Z`,fill:COL[m]},svg);
      if (gi===3) { const t=el('text',{x:x+bw/2,y:yy-6,'text-anchor':'middle','font-size':11,'font-weight':m==='teleop'?700:500,fill:'#161513'},svg); t.textContent=fmt(v); }
      const hit = el('rect',{x:x-gap/2,y:T,width:bw+gap,height:H-T-B,fill:'transparent'},svg);
      hit.addEventListener('pointerenter', () => { tip.innerHTML = `<b>${name}</b><br>${g}: ${fmt(v)}`; tip.style.opacity = 1; });
      hit.addEventListener('pointermove', e => { const r = svg.getBoundingClientRect(); tip.style.left = (e.clientX-r.left)+'px'; tip.style.top = (e.clientY-r.top)+'px'; });
      hit.addEventListener('pointerleave', () => tip.style.opacity = 0);
    });
  });
  document.getElementById('rlLegend').innerHTML = order.map(m => `<span><i style="background:${COL[m]}"></i>${METH.find(z=>z[0]===m)[1]}</span>`).join('');
  document.getElementById('rlTable').innerHTML = `<table><tr><th>Reward</th>${groups.map(g=>`<th>${g}</th>`).join('')}</tr>${order.map(m=>`<tr><td>${METH.find(z=>z[0]===m)[1]}</td>${RL.rates[m].map(v=>`<td>${fmt(v)}</td>`).join('')}</tr>`).join('')}</table>`;
})();

/* ---------- reward curves window ---------- */
const TASKR = window.REWARD;
const MODELS = [['teleop','Teleop'],['rollout','Rollout'],['human','Human video'],['sim','Real2sim']];
const shown = {teleop:true,rollout:true,human:true,sim:true};
let task = 0, clip = 0, simPlaying = false, lastTs = 0;
const video = document.getElementById('video'), scrub = document.getElementById('scrub'), vidBox = document.getElementById('vidBox');
const svg = document.getElementById('curve'), playBtn = document.getElementById('play'), playIcon = document.getElementById('playIcon');
const rwTabs = document.getElementById('rwTabs'), chips = document.getElementById('clipChips'), toggles = document.getElementById('toggles'), readout = document.getElementById('readout');
const tval = document.getElementById('tval');
let curves = {}; // model name -> progress array (the shape your sync code expects)
const qualityWord = c => c.credit >= 1 ? 'success' : c.credit >= 0.6 ? 'close' : c.credit > 0 ? 'partial' : 'no progress';
const colOf = m => m === 'robometer' ? COL.rb : COL[m];

TASKR.forEach((t,i) => {
  const b = h(`<button role="tab" aria-selected="${i===0}"><span class="n">${i+1}</span>${t.name}</button>`);
  b.onclick = () => { if (task === i) return; task = i; clip = 0; rwTabs.querySelectorAll('button').forEach((x,j)=>x.setAttribute('aria-selected', j===i)); loadTask(); };
  rwTabs.appendChild(b);
});
MODELS.forEach(([m,name]) => {
  const b = h(`<button aria-pressed="true"><i style="background:${m==='robometer'?'transparent;box-shadow:inset 0 0 0 2px '+COL.rb:COL[m]}"></i>${name}</button>`);
  b.dataset.m = m;
  b.onclick = () => { shown[m] = !shown[m]; b.setAttribute('aria-pressed', shown[m]); applyVisibility(); sync(); };
  toggles.appendChild(b);
});

/* chart geometry; static parts are built once per clip, the playhead and dots are moved in place */
const W = 560, H = 360, PL = 44, PR = 14, PT = 16, PB = 38;
const X = t => PL + (W-PL-PR)*t, Y = v => PT + (H-PT-PB)*(1-v);
const NS = 'http://www.w3.org/2000/svg';
(function axes() {
  [0,.25,.5,.75,1].forEach(v => { el('line',{x1:PL,x2:W-PR,y1:Y(v),y2:Y(v),stroke:v?'rgba(255,255,255,.07)':'rgba(255,255,255,.25)'},svg); const t=el('text',{x:PL-8,y:Y(v)+4,'text-anchor':'end','font-size':11,fill:'#a9a398'},svg); t.textContent=String(v); });
  const xl = el('text',{x:(PL+W-PR)/2,y:H-8,'text-anchor':'middle','font-size':12,fill:'#a9a398'},svg); xl.textContent = 'time in clip';
  const yl = el('text',{x:12,y:PT+(H-PT-PB)/2,'text-anchor':'middle','font-size':12,fill:'#a9a398',transform:`rotate(-90 12 ${PT+(H-PT-PB)/2})`},svg); yl.textContent = 'predicted progress';
})();
const creditLine = el('line',{x1:PL,x2:W-PR,stroke:'#ece8e1','stroke-width':1.5,'stroke-dasharray':'2 5','stroke-linecap':'round'},svg);
const creditText = el('text',{x:W-PR,'text-anchor':'end','font-size':11.5,fill:'#ece8e1'},svg);
const gPaths = el('g',{},svg);
const head = el('line',{y1:PT,y2:H-PB,stroke:'rgba(255,255,255,.55)','stroke-width':1},svg);
const PATH = {}, DOT = {}, CELL = {};
MODELS.forEach(([m]) => {
  PATH[m] = el('path',{fill:'none',stroke:colOf(m),'stroke-width':2,'stroke-linejoin':'round','stroke-dasharray':m==='robometer'?'6 5':'none',opacity:.95},gPaths);
});
MODELS.forEach(([m]) => { DOT[m] = el('circle',{r:5.5,fill:colOf(m),stroke:'#3a3936','stroke-width':2},svg); });
MODELS.forEach(([m,name]) => {
  const d = h(`<div style="box-shadow:inset 3px 0 0 ${colOf(m)}"><b>–</b>${name}</div>`);
  CELL[m] = d.querySelector('b'); CELL[m].parentNode.dataset.m = m; readout.appendChild(d);
});

function applyVisibility() {
  MODELS.forEach(([m]) => {
    const on = !!curves[m] && shown[m];
    PATH[m].style.display = on ? '' : 'none'; DOT[m].style.display = on ? '' : 'none';
  });
}
function drawClip() {
  const c = TASKR[task].clips[clip];
  creditLine.setAttribute('y1', Y(c.credit)); creditLine.setAttribute('y2', Y(c.credit));
  creditText.setAttribute('y', Y(c.credit) - 7); creditText.textContent = `graded credit ${c.credit.toFixed(1)}`;
  MODELS.forEach(([m]) => {
    const vals = curves[m];
    PATH[m].setAttribute('d', vals ? vals.map((v,i) => `${i?'L':'M'}${X(i/(vals.length-1)).toFixed(1)},${Y(v).toFixed(1)}`).join(' ') : '');
    const cell = CELL[m].parentNode;
    if (m === 'robometer') { cell.lastChild.textContent = vals ? 'Robometer base' : 'Robometer base, not added'; if (!vals) CELL[m].textContent = '–'; }
  });
  applyVisibility();
}

function loadTask() {
  chips.innerHTML = '';
  TASKR[task].clips.forEach((c,i) => {
    const b = h(`<button role="tab" aria-selected="${i===clip}"><b>Clip ${i+1}</b>credit ${c.credit.toFixed(1)}</button>`);
    b.title = qualityWord(c);
    b.onclick = () => { if (clip === i) return; clip = i; chips.querySelectorAll('button').forEach((x,j)=>x.setAttribute('aria-selected', j===i)); loadClip(); };
    chips.appendChild(b);
  });
  loadClip();
  // warm the browser cache for this task's other clips once the current one is ready
  setTimeout(() => TASKR[task].clips.forEach((c,i) => { if (i !== clip) { const l = document.createElement('link'); l.rel = 'prefetch'; l.as = 'video'; l.href = c.video; document.head.appendChild(l); } }), 1500);
}
function loadClip() {
  const t = TASKR[task], c = t.clips[clip];
  curves = Object.assign({}, c.curves);
  toggles.querySelectorAll('button').forEach(b => { const has = !!curves[b.dataset.m]; b.disabled = !has; b.title = ''; });
  document.getElementById('prompt').innerHTML = `Prompt <q>${t.prompt}</q> · ${c.policy} rollout · graded credit ${c.credit.toFixed(1)} (${qualityWord(c)})`;
  simPlaying = false; setIcon(false); video.pause();
  vidBox.classList.remove('missing');
  video.src = c.video;
  scrub.value = 0; drawClip(); sync();
}
video.addEventListener('error', () => { vidBox.classList.add('missing'); });
video.addEventListener('loadedmetadata', () => { vidBox.classList.remove('missing'); sync(); });

/* your scrubber logic, unchanged in spirit */
const hasVideo = () => video.duration && isFinite(video.duration) && !vidBox.classList.contains('missing');
function frac() {
  if (hasVideo()) return Math.max(0, Math.min(1, video.currentTime / video.duration));
  return Number(scrub.value) / 1000;
}
function interp(values, t) {
  if (values.length < 2) return values[0] || 0;
  const p = t * (values.length - 1), i = Math.floor(p), j = Math.min(i + 1, values.length - 1);
  return values[i] + (values[j] - values[i]) * (p - i);
}
// coalesce slider and chart drags into at most one seek per animation frame
let pendingT = null, seekQueued = false, lastSeekT = -1;
function seek(t) {
  pendingT = t; scrub.value = Math.round(t * 1000); render(t);
  if (!seekQueued) { seekQueued = true; requestAnimationFrame(flushSeek); }
}
function flushSeek() {
  seekQueued = false; if (pendingT === null || !hasVideo()) return;
  const target = pendingT * video.duration; pendingT = null;
  if (Math.abs(target - lastSeekT) < 0.05) return; lastSeekT = target;
  if (typeof video.fastSeek === 'function' && !video.seeking) video.fastSeek(target); else video.currentTime = target;
}
scrub.oninput = () => { pause(); seek(Number(scrub.value) / 1000); };
video.addEventListener('seeked', () => { if (pendingT === null) sync(); });

let lastRendered = -1;
function render(t) {
  if (Math.abs(t - lastRendered) < 0.0005) return; lastRendered = t;
  tval.textContent = Math.round(t*100) + '%';
  const x = X(t).toFixed(1); head.setAttribute('x1', x); head.setAttribute('x2', x);
  MODELS.forEach(([m]) => {
    const vals = curves[m]; if (!vals) return;
    const v = interp(vals, t);
    if (shown[m]) { DOT[m].setAttribute('cx', x); DOT[m].setAttribute('cy', Y(v).toFixed(1)); }
    CELL[m].textContent = v.toFixed(2);
  });
}
function sync() { const t = frac(); scrub.value = Math.round(t * 1000); lastRendered = -1; render(t); }

// drag on the chart to scrub
function chartSeek(e) { const r = svg.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * W; seek(Math.max(0, Math.min(1, (x-PL)/(W-PL-PR)))); }
svg.addEventListener('pointerdown', e => { pause(); svg.setPointerCapture(e.pointerId); chartSeek(e); });
svg.addEventListener('pointermove', e => { if (e.buttons) chartSeek(e); });

/* play / pause (falls back to animating the curves when the clip video is missing) */
function setIcon(p) { playIcon.setAttribute('d', p ? 'M5 3.5h3.5v13H5zM11.5 3.5H15v13h-3.5z' : 'M5 3.5v13l11-6.5z'); playBtn.setAttribute('aria-label', p ? 'Pause' : 'Play'); }
function pause() { if (!video.paused) video.pause(); simPlaying = false; setIcon(false); }
playBtn.onclick = () => {
  if (hasVideo()) {
    if (video.paused) { if (video.ended || frac() >= .999) video.currentTime = 0; video.play().catch(()=>{}); setIcon(true); requestAnimationFrame(tick); }
    else pause();
    return;
  }
  if (simPlaying) { pause(); return; }
  if (Number(scrub.value) >= 999) scrub.value = 0;
  simPlaying = true; setIcon(true); lastTs = performance.now(); requestAnimationFrame(step);
};
video.addEventListener('ended', () => { setIcon(false); sync(); });
function tick() { if (video.paused) return; render(frac()); scrub.value = Math.round(frac()*1000); requestAnimationFrame(tick); }
function step(ts) {
  if (!simPlaying) return;
  const c = TASKR[task].clips[clip], dur = c.frames / c.fps, dt = (ts - lastTs) / 1000; lastTs = ts;
  let t = Number(scrub.value) / 1000 + dt / dur;
  if (t >= 1) { t = 1; simPlaying = false; setIcon(false); }
  scrub.value = Math.round(t * 1000); render(t);
  if (simPlaying) requestAnimationFrame(step);
}

loadTask();

/* load and play page videos only while they are on screen */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (v.dataset.src && !v.getAttribute('src')) { v.src = v.dataset.src; } v.play().catch(()=>{}); }
    else if (!v.paused) v.pause();
  }), {rootMargin:'200px 0px', threshold:0.01});
  const watch = root => root.querySelectorAll('video[data-src]').forEach(v => io.observe(v));
  watch(document); new MutationObserver(() => watch(grid)).observe(grid, {childList:true});
} else {
  document.querySelectorAll('video[data-src]').forEach(v => { v.src = v.dataset.src; });
}
document.querySelectorAll('[data-todo]').forEach(a => a.addEventListener('click', e => { if (a.getAttribute('href') === '#') e.preventDefault(); }));
})();
