/* ================= 基礎工具 ================= */
const $ = id => document.getElementById(id);

let score = JSON.parse(localStorage.getItem("arcadeScore") || '{"1":0,"2":0}');
function showScore(){ $("sc1").textContent = score[1]; $("sc2").textContent = score[2]; }
function addScore(p){ score[p]++; localStorage.setItem("arcadeScore", JSON.stringify(score)); showScore(); }
function resetScore(){ score = {1:0,2:0}; localStorage.setItem("arcadeScore", JSON.stringify(score)); showScore(); }
showScore();

const msg = (t, c="") => { $("msg").innerHTML = t; $("msg").className = c; };
const names = {1:"玩家1", 2:"玩家2"};
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pn  = p => `<span class="p${p}">${esc(names[p])}</span>`;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// 結算:w = 0 代表平手
const win = (w, t="") => {
  if (!w) msg("平手!" + t);
  else { msg(`🎉 ${pn(w)} 獲勝!${t}`); addScore(w); }
};

let current = null, keyHandler = null, timers = [], cleanups = [];
let turnNow = 0;   // 輪流制遊戲目前輪到誰 (0 = 不限制)

/* ===== 單人 vs 電腦 共通框架 ===== */
let vsCPU = false, cpuLevel = 2;                 // 難度 1簡單 2普通 3困難
const CPU_BLOCK_KEYS = ["arrowup","arrowdown","arrowleft","arrowright","enter","l"];
const isCPU    = p => vsCPU && p === 2;          // 這位玩家是不是電腦
const cpuDelay = () => [1100, 750, 450][cpuLevel-1];   // 電腦思考時間(毫秒)
const cpuSmart = () => [0.2, 0.75, 1][cpuLevel-1];     // 電腦走「好棋」的機率
const cpuKey   = k => { if (keyHandler) keyHandler({ key:k, repeat:false, preventDefault(){} }); }; // 電腦按一下鍵
const cpuHold  = (k, on) => { K[k] = on; };      // 電腦按住/放開方向鍵
const pickOne  = arr => arr[Math.floor(Math.random() * arr.length)];

function applyCpuUI(){
  let n2 = "玩家2";
  try { n2 = JSON.parse(localStorage.getItem("arcadeNames") || "{}")[2] || "玩家2"; } catch (e) {}
  names[2] = vsCPU ? "電腦" : n2;
  $("nm2").textContent = names[2];
  $("cpuLevelBox").style.display = vsCPU ? "" : "none";
}

// 供 net.js 呼叫:連線時關閉電腦模式
function setCPU(on){
  vsCPU = on; $("cpuOn").checked = on; applyCpuUI();
}


const K = {};  // 目前被按住的按鍵

const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

/* 鍵盤 */
document.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (current && ["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
if (vsCPU && CPU_BLOCK_KEYS.includes(k)) return;   // 電腦模式:玩家2 的鍵無效
  K[k] = true;

  if (keyHandler) keyHandler(e);
});
document.addEventListener("keyup", e => { K[e.key.toLowerCase()] = false; });
window.addEventListener("blur", () => { for (const k in K) delete K[k]; });

/* 觸控虛擬按鈕 (data-key) */
const held = {};
document.addEventListener("pointerdown", e => {
  const b = e.target.closest("[data-key]"); if (!b) return;
  e.preventDefault();
  if (vsCPU && b.classList.contains("pb2")) return;   // 擋掉玩家2 的虛擬按鈕
  const k = b.dataset.key;
  held[e.pointerId] = k; K[k] = true;
  if (keyHandler) keyHandler({ key:k, repeat:false, preventDefault(){} });
});
const rel = e => { const k = held[e.pointerId]; if (k) { K[k] = false; delete held[e.pointerId]; } };
document.addEventListener("pointerup", rel);
document.addEventListener("pointercancel", rel);

/* 動畫迴圈:回傳 stop 函式,切換遊戲時自動停止 */
const loop = fn => {
  let id, last = performance.now(), on = true;
  const f = t => {
    if (!on) return;
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    fn(dt);
    if (on) id = requestAnimationFrame(f);
  };
  id = requestAnimationFrame(f);
  const stop = () => { on = false; cancelAnimationFrame(id); };
  cleanups.push(stop);
  return stop;
};

/* UI 產生器 */
const pad = (p, list) =>
  `<div class="dp">${list.map(([l,k]) => `<button class="pb${p}" data-key="${k}">${l}</button>`).join("")}</div>`;
const ctl = h => `<div class="ctl">${h}</div>`;
const canvas = (W, H, extra="") => {
  $("stage").innerHTML = `<canvas id="cv" class="cv" width="${W}" height="${H}"></canvas>` + extra;
  const c = $("cv").getContext("2d");
  c.textAlign = "center"; c.textBaseline = "middle";
  return c;
};

const ttt = {
  name:"井字遊戲", icon:"⭕", desc:"連成三格即獲勝",
  start(){
    let b = Array(9).fill(""), turn = 1, over = false;
    turnNow = 1;
    $("stage").innerHTML = '<div class="ttt"></div>';
    const grid = $("stage").firstChild;
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const draw = () => grid.innerHTML = b.map((v,i) =>
      `<button data-i="${i}" class="${v==="X"?"p1":"p2"}">${v}</button>`).join("");

    /* ---- 電腦(玩家2 = O)---- */
    const winner = bd => {
      for (const l of lines) if (bd[l[0]] && bd[l[0]]===bd[l[1]] && bd[l[0]]===bd[l[2]]) return bd[l[0]];
      return null;
    };
    const mm = (bd, p) => {                    // 對 O 的分數:O贏+1、X贏-1
      const w = winner(bd); if (w) return w==="O" ? 1 : -1;
      if (bd.every(x => x)) return 0;
      let best = p==="O" ? -2 : 2;
      for (let i=0; i<9; i++) if (!bd[i]) {
        bd[i] = p; const s = mm(bd, p==="O" ? "X" : "O"); bd[i] = "";
        best = p==="O" ? Math.max(best, s) : Math.min(best, s);
      }
      return best;
    };
    const cpuPick = () => {
      const empty = [];
      b.forEach((v,i) => { if (!v) empty.push(i); });
      if (Math.random() > cpuSmart()) return pickOne(empty);   // 失誤:亂下
      let bestS = -2, moves = [];
      for (const i of empty) {
        b[i] = "O"; const s = mm(b, "X"); b[i] = "";
        if (s > bestS) { bestS = s; moves = [i]; } else if (s === bestS) moves.push(i);
      }
      return pickOne(moves);
    };
    const cpuMaybe = () => {
      if (isCPU(turn) && !over) later(() => { if (!over) move(cpuPick()); }, cpuDelay());
    };

    /* ---- 下一步(真人與電腦共用)---- */
    const move = i => {
      if (over || b[i]) return;
      b[i] = turn === 1 ? "X" : "O"; draw();
      if (lines.some(l => l.every(k => b[k] === b[i]))) { over = true; win(turn); return; }
      if (b.every(x => x)) { over = true; msg("平手!"); return; }
      turn = 3 - turn; turnNow = turn; msg(`輪到 ${pn(turn)} (${turn===1?"X":"O"})`);
      cpuMaybe();
    };
    msg(`輪到 ${pn(1)} (X)`); draw();
    grid.onclick = e => {
      const i = e.target.dataset.i;
      if (i === undefined || isCPU(turn)) return;   // 電腦回合,真人點擊無效
      move(+i);
    };
  }
};


/* ================= 2. 四子棋 ================= */
const c4 = {
  name:"四子棋", icon:"🔴", desc:"先連成四顆棋子者勝",
  start(){
    const R = 6, C = 7;
    let b = Array.from({length:R}, () => Array(C).fill(0)), turn = 1, over = false;
    turnNow = 1;
    $("stage").innerHTML = '<div class="c4"></div>';
    const grid = $("stage").firstChild;
    const cls = v => v===1 ? "a" : v===2 ? "b" : "";
    const draw = (w=[]) => {
      grid.innerHTML = "";
      for (let r=0; r<R; r++) for (let c=0; c<C; c++) {
        const d = document.createElement("div");
        d.className = "cell " + cls(b[r][c]) + (w.some(([y,x]) => y===r && x===c) ? " win" : "");
        d.dataset.c = c; grid.appendChild(d);
      }
    };
    const check = (r, c) => {
      const p = b[r][c];
      for (const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
        let cells = [[r,c]];
        for (const s of [1,-1]) {
          let y = r + dr*s, x = c + dc*s;
          while (y>=0 && y<R && x>=0 && x<C && b[y][x]===p) { cells.push([y,x]); y += dr*s; x += dc*s; }
        }
        if (cells.length >= 4) return cells;
      }
      return null;
    };
    const label = () => `輪到 ${pn(turn)} (${turn===1?"紅":"黃"}) — 點擊欄位落子`;

    /* ---- 電腦 ---- */
    const drop = c => { for (let r=R-1; r>=0; r--) if (!b[r][c]) return r; return -1; };
    const wins = (c, p) => {                      // p 下在 c 欄會不會贏
      const r = drop(c); if (r < 0) return false;
      b[r][c] = p; const w = !!check(r, c); b[r][c] = 0; return w;
    };
    const cpuPick = () => {
      const cols = [0,1,2,3,4,5,6].filter(c => drop(c) >= 0);
      if (Math.random() > cpuSmart()) return pickOne(cols);   // 失誤:亂下
      for (const c of cols) if (wins(c, 2)) return c;         // 我能贏
      for (const c of cols) if (wins(c, 1)) return c;         // 擋對手
      const safe = cols.filter(c => {                         // 避免送對手一勝
        const r = drop(c); b[r][c] = 2;
        const bad = r > 0 && wins(c, 1); b[r][c] = 0; return !bad;
      });
      const pool = (safe.length ? safe : cols).slice().sort((x,y) => Math.abs(x-3) - Math.abs(y-3));
      const best = Math.abs(pool[0] - 3);
      return pickOne(pool.filter(c => Math.abs(c-3) === best));
    };
    const cpuMaybe = () => {
      if (isCPU(turn) && !over) later(() => { if (!over) move(cpuPick()); }, cpuDelay());
    };

    const move = c => {
      if (over) return;
      for (let r=R-1; r>=0; r--) {
        if (!b[r][c]) {
          b[r][c] = turn;
          const w = check(r, c); draw(w || []);
          if (w) { over = true; win(turn); }
          else if (b[0].every(x => x)) { over = true; msg("平手!"); }
          else { turn = 3 - turn; turnNow = turn; msg(label()); cpuMaybe(); }
          return;
        }
      }
    };
    msg(label()); draw();
    grid.onclick = e => {
      if (e.target.dataset.c === undefined || isCPU(turn)) return;
      move(+e.target.dataset.c);
    };
  }
};


/* ================= 3. 反應對決 ================= */
const react = {
  name:"反應對決", icon:"⚡", desc:"變綠燈瞬間搶先按!先贏3回合",
  start(){
    let pts = {1:0,2:0}, state = "idle", goTime = 0;
    $("stage").innerHTML = `
      <div id="light">準備開始</div>
      <div id="pts" style="margin:8px"></div>
      <button id="go">開始回合</button>
      <div class="arena">
        <button class="pad a" data-p="1">玩家1<br>(按 A)</button>
        <button class="pad b" data-p="2">玩家2<br>(按 L)</button>
      </div>`;
    const light = $("light");
    const upd = () => $("pts").innerHTML = `${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`;
    upd(); msg("按下「開始回合」,等待綠燈,切勿搶跑!");

    const endRound = (w, text) => {
      state = "idle"; clearTimers(); pts[w]++; upd();
      if (pts[w] >= 3) {
        msg(`🏆 ${pn(w)} 贏得比賽!${text}`); addScore(w);
        $("go").textContent = "再玩一場"; pts = {1:0,2:0};
      } else { msg(`${pn(w)} 得分 ${text}`); $("go").textContent = "下一回合"; }
    };
    const press = p => {
      if (state === "waiting") {
        light.style.background = "#c0392b"; light.textContent = "搶跑!";
        endRound(3 - p, "(對手搶跑)");
      } else if (state === "go") {
        const t = Math.round(performance.now() - goTime);
        light.textContent = `${t} ms`; endRound(p, `(${t} ms)`);
      }
    };
    $("go").onclick = () => {
      if (state !== "idle") return;
      state = "waiting"; light.style.background = "#b8860b"; light.textContent = "等待…"; msg("");
      later(() => {
        state = "go"; goTime = performance.now();
        light.style.background = "#2ecc71"; light.textContent = "現在按!";
        if (isCPU(2)) later(() => press(2), [rnd(550,900), rnd(300,450), rnd(200,270)][cpuLevel-1]);
      }, rnd(1500, 5000));
    };
document.querySelectorAll(".pad").forEach(b => b.onpointerdown = () => { if (!isCPU(+b.dataset.p)) press(+b.dataset.p); });
    keyHandler = e => { const k = e.key.toLowerCase(); if (k==="a") press(1); if (k==="l") press(2); };
  }
};

/* ================= 4. 狂點大賽 ================= */
const mash = {
  name:"狂點大賽", icon:"👆", desc:"10 秒內誰點得比較多",
  start(){
    let cnt = {1:0,2:0}, running = false;
    $("stage").innerHTML = `
      <div class="big" id="timer">10.0</div>
      <div id="cnt" style="margin:8px;font-size:1.3rem"></div>
      <button id="go">開始!</button>
      <div class="arena">
        <button class="pad a" data-p="1">玩家1<br>(狂按 A)</button>
        <button class="pad b" data-p="2">玩家2<br>(狂按 L)</button>
      </div>`;
    const upd = () => $("cnt").innerHTML = `${pn(1)} ${cnt[1]} : ${cnt[2]} ${pn(2)}`;
    upd(); msg("按下開始後倒數 3 秒");
    const hit = p => { if (running) { cnt[p]++; upd(); } };
document.querySelectorAll(".pad").forEach(b => b.onpointerdown = () => { if (!isCPU(+b.dataset.p)) hit(+b.dataset.p); });
   
    keyHandler = e => { if (e.repeat) return; const k = e.key.toLowerCase(); if (k==="a") hit(1); if (k==="l") hit(2); };

    const finish = () => {
      running = false; $("go").disabled = false; $("go").textContent = "再來一次";
      win(cnt[1] === cnt[2] ? 0 : cnt[1] > cnt[2] ? 1 : 2, ` (${cnt[1]} : ${cnt[2]})`);
    };
    const begin = () => {
      running = true; msg("衝啊!!!");
      if (isCPU(2)) {
  const cps = [4, 6.5, 9][cpuLevel-1];             // 電腦每秒點幾下
  const cpuTick = () => { if (!running) return; hit(2); later(cpuTick, 1000 / cps * rnd(.75, 1.25)); };
  later(cpuTick, 300);
}
      const end = performance.now() + 10000;
      const tick = () => {
        const left = Math.max(0, end - performance.now());
        $("timer").textContent = (left / 1000).toFixed(1);
        if (left > 0) later(tick, 50); else finish();
      };
      tick();
    };
    $("go").onclick = () => {
      if (running) return;
      clearTimers(); cnt = {1:0,2:0}; upd(); $("go").disabled = true;
      let n = 3;
      const cd = () => { if (n > 0) { msg(`準備… ${n}`); n--; later(cd, 1000); } else begin(); };
      cd();
    };
  }
};

/* ================= 5. 猜拳對決 ================= */
const rps = {
  name:"猜拳對決", icon:"✊", desc:"輪流秘密出拳,先贏3回合",
  start(){
    const E = {r:"✊", p:"✋", s:"✌️"};
    const beat = {r:"s", s:"p", p:"r"};
    let pts = {1:0,2:0}, pick = {}, who = 1, lock = false;
    const hist = {r:0, p:0, s:0};
    turnNow = 1;
    $("stage").innerHTML = `
      <div id="pts" style="margin:8px"></div>
      <div id="rbox" style="font-size:2.5rem;min-height:3.5rem"></div>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:12px">
        ${Object.keys(E).map(k => `<button data-k="${k}" style="height:100px;width:100px;font-size:2.5rem;background:var(--card)">${E[k]}</button>`).join("")}
      </div>`;
    const upd = () => $("pts").innerHTML = `${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`;
    upd(); msg(`${pn(1)} 請出拳(對手請別偷看)`);

    const cpuChoice = () => {
      const keys = Object.keys(E);
      if (Math.random() < [0, .5, .85][cpuLevel-1]) {
        const pm = keys.sort((a,b) => hist[b] - hist[a])[0];   // 你最常出的拳
        return keys.find(k => beat[k] === pm);                  // 出能克制它的
      }
      return pickOne(keys);
    };
    const cpuMaybe = () => { if (isCPU(2)) later(() => choose(cpuChoice()), cpuDelay()); };

    const choose = k => {
      pick[who] = k;
      if (who === 1) {
        hist[k]++; who = 2; turnNow = 2; $("rbox").textContent = "🙈";
        msg(`${pn(2)} 請出拳`); cpuMaybe(); return;
      }
      who = 1; lock = true;
      const a = pick[1], c = pick[2];
      $("rbox").textContent = `${E[a]}  vs  ${E[c]}`;
      if (a === c) msg("平手!再來一次");
      else {
        const w = beat[a] === c ? 1 : 2; pts[w]++; upd();
        if (pts[w] >= 3) { msg(`🏆 ${pn(w)} 贏得比賽!`); addScore(w); return; }
        msg(`${pn(w)} 贏下此回合`);
      }
      later(() => { lock = false; turnNow = 1; $("rbox").textContent = ""; msg(`${pn(1)} 請出拳`); }, 1800);
    };
    document.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
      if (lock || isCPU(who)) return;
      choose(b.dataset.k);
    });
  }
};


/* ================= 6. 記憶翻牌 ================= */
const memory = {
  name:"記憶翻牌", icon:"🃏", desc:"輪流翻牌,配對成功再翻一次",
  start(){
    const em = ["🍎","🍌","🍇","🍓","🐶","🐱","🐼","🦊"];
    const cards = [...em, ...em].sort(() => Math.random() - .5);
    let open = [], matched = Array(16).fill(false), pts = {1:0,2:0}, turn = 1, lock = false;
    const known = new Set();                       // 電腦記得的牌
    const done = () => matched.every(x => x);
    turnNow = 1;
    $("stage").innerHTML = `<div id="pts" style="margin:8px"></div><div class="mem" id="mem"></div>`;
    const upd = () => $("pts").innerHTML = `${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`;
    const draw = () => {
      $("mem").innerHTML = cards.map((c,i) => {
        const show = matched[i] || open.includes(i);
        return `<button data-i="${i}" class="${matched[i] ? "done" : ""}">${show ? c : "❓"}</button>`;
      }).join("");
    };
    const label = () => msg(`輪到 ${pn(turn)}`);

    /* ---- 電腦 ---- */
    const cpuStep = () => {
      if (!isCPU(turn) || lock || done()) return;
      const free = cards.map((_,i) => i).filter(i => !matched[i] && !open.includes(i));
      let pick;
      if (Math.random() < cpuSmart()) {
        if (open.length === 1) {                   // 第二張:找記得的另一半
          pick = free.find(i => known.has(i) && cards[i] === cards[open[0]]);
        } else {                                   // 第一張:找記得的一對
          const ks = free.filter(i => known.has(i));
          pick = ks.find(i => ks.some(j => j !== i && cards[j] === cards[i]));
        }
      }
      if (pick === undefined) {                    // 不知道就翻沒看過的
        const unk = free.filter(i => !known.has(i));
        pick = pickOne(unk.length ? unk : free);
      }
      flip(pick);
    };
    const cpuMaybe = () => { if (isCPU(turn) && !done()) later(cpuStep, cpuDelay()); };

    const flip = i => {
      if (lock || matched[i] || open.includes(i)) return;
      open.push(i);
      if (Math.random() < [.3, .7, 1][cpuLevel-1]) known.add(i);   // 電腦記不記得
      draw();
      if (open.length < 2) { cpuMaybe(); return; }
      const [a, c] = open;
      if (cards[a] === cards[c]) {
        matched[a] = matched[c] = true; pts[turn]++; open = []; upd(); draw();
        if (done()) { win(pts[1] === pts[2] ? 0 : pts[1] > pts[2] ? 1 : 2, ` (${pts[1]} : ${pts[2]})`); }
        else { msg(`${pn(turn)} 配對成功!再翻一次`); cpuMaybe(); }
      } else {
        lock = true;
        later(() => { open = []; turn = 3 - turn; turnNow = turn; lock = false; draw(); label(); cpuMaybe(); }, 900);
      }
    };
    upd(); label(); draw();
    $("mem").onclick = e => {
      const b = e.target.closest("button"); if (!b || isCPU(turn)) return;
      flip(+b.dataset.i);
    };
  }
};

/* ================= 7. 貪食蛇雙人版 ================= */
const snake = {
  name:"貪食蛇對戰", icon:"🐍", desc:"出局後對手繼續玩,比長度與存活時間",
  rules:[
    "兩條蛇在同一個場地,吃到 🍎 就會變長。",
    "玩家1 用 W A S D 控制方向,玩家2 用 ↑ ← ↓ →(手機點方向按鈕)。",
    "撞牆、撞到自己或撞到對方的蛇就出局,出局的蛇會消失,對手繼續玩到出局為止。",
    "兩條蛇都出局後,長度較長者獲勝;長度一樣則活得比較久的獲勝。"
  ],
  start(){
    const N = 20, S = 20;
    const c = canvas(N*S, N*S,
      ctl(pad(1,[["▲","w"],["◀","a"],["▼","s"],["▶","d"]]) +
          pad(2,[["▲","arrowup"],["◀","arrowleft"],["▼","arrowdown"],["▶","arrowright"]])));
    const dirs = {
      w:[1,{x:0,y:-1}], s:[1,{x:0,y:1}], a:[1,{x:-1,y:0}], d:[1,{x:1,y:0}],
      arrowup:[2,{x:0,y:-1}], arrowdown:[2,{x:0,y:1}], arrowleft:[2,{x:-1,y:0}], arrowright:[2,{x:1,y:0}]
    };
    const sn = {
      1:{body:[{x:3,y:10},{x:2,y:10},{x:1,y:10}], dir:{x:1,y:0},  next:{x:1,y:0},  color:"#ff5d73"},
      2:{body:[{x:16,y:9},{x:17,y:9},{x:18,y:9}], dir:{x:-1,y:0}, next:{x:-1,y:0}, color:"#4da3ff"}
    };
    const alive = {1:true, 2:true}, eaten = {1:0, 2:0}, outAt = {1:0, 2:0};
    let food = null, over = false, acc = 0, tick = 0;
    const len = p => 3 + eaten[p];
    const eq = (a,b) => a.x === b.x && a.y === b.y;
    const placeFood = () => {
      do { food = {x:Math.floor(rnd(0,N)), y:Math.floor(rnd(0,N))}; }
      while ([...sn[1].body, ...sn[2].body].some(p => eq(p, food)));
    };
    placeFood();
    const info = () => msg([1,2].map(p =>
      `${pn(p)} ${alive[p] ? "長度 " + len(p) : "💀 出局(長度 " + len(p) + ")"}`).join(" ・ "));
    info();

    keyHandler = e => {
      const d = dirs[e.key.toLowerCase()]; if (!d || over || !alive[d[0]]) return;
      const s = sn[d[0]];
      if (d[1].x === -s.dir.x && d[1].y === -s.dir.y) return;  // 不能直接迴轉
      s.next = d[1];
    };

    const cpuSteer = () => {
      const s = sn[2], h = s.body[0];
      const dl = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}]
        .filter(d => !(d.x === -s.dir.x && d.y === -s.dir.y));
      const all = [...sn[1].body, ...sn[2].body];
      const blocked = (x,y) => x<0 || y<0 || x>=N || y>=N || all.some(b => b.x===x && b.y===y);
      const space = (x0,y0) => {
        const seen = new Set([x0+","+y0]), q = [[x0,y0]];
        while (q.length && seen.size < 80) {
          const [x,y] = q.shift();
          for (const d of dl.concat([{x:s.dir.x,y:s.dir.y}])) {
            const nx = x+d.x, ny = y+d.y, key = nx+","+ny;
            if (!seen.has(key) && !blocked(nx,ny)) { seen.add(key); q.push([nx,ny]); }
          }
        }
        return seen.size;
      };
      if (Math.random() < [.25, .08, 0][cpuLevel-1]) { s.next = pickOne(dl); return; }   // 失誤
      let safe = dl.filter(d => !blocked(h.x+d.x, h.y+d.y));
      if (!safe.length) return;
      if (cpuLevel === 3) {
        const roomy = safe.filter(d => space(h.x+d.x, h.y+d.y) >= s.body.length);
        if (roomy.length) safe = roomy;
      }
      safe.sort((a,b) =>
        Math.abs(h.x+a.x-food.x) + Math.abs(h.y+a.y-food.y) -
        Math.abs(h.x+b.x-food.x) - Math.abs(h.y+b.y-food.y));
      s.next = safe[0];
    };

    const finish = () => {
      over = true;
      const a = len(1), b = len(2);
      let w = a === b ? 0 : a > b ? 1 : 2;
      if (!w && outAt[1] !== outAt[2]) w = outAt[1] > outAt[2] ? 1 : 2;   // 長度一樣,活比較久的贏
      win(w, ` (長度 ${a} : ${b})`);
    };

    const step = () => {
      tick++;
      if (vsCPU && alive[2]) cpuSteer();
      let ate = false;
      for (const p of [1,2]) {
        if (!alive[p]) continue;
        const s = sn[p]; s.dir = s.next;
        const h = {x:s.body[0].x + s.dir.x, y:s.body[0].y + s.dir.y};
        s.body.unshift(h);
        if (eq(h, food)) { ate = true; eaten[p]++; } else s.body.pop();
      }
      if (ate) placeFood();
      const dead = p => {
        if (!alive[p]) return false;
        const s = sn[p], o = sn[3-p], h = s.body[0];
        return h.x<0 || h.y<0 || h.x>=N || h.y>=N ||
               s.body.slice(1).some(b => eq(b,h)) || o.body.some(b => eq(b,h));
      };
      const d = {1:dead(1), 2:dead(2)};      // 先一起判斷,再一起處理(同時撞才公平)
      for (const p of [1,2]) if (d[p]) { alive[p] = false; outAt[p] = tick; sn[p].body = []; }
      if (!alive[1] && !alive[2]) finish();
      else info();
    };

    const draw = () => {
      c.fillStyle = "#0d1020"; c.fillRect(0,0,N*S,N*S);
      c.font = "16px sans-serif"; c.fillText("🍎", food.x*S+S/2, food.y*S+S/2+1);
      for (const p of [1,2]) {
        c.fillStyle = sn[p].color;
        sn[p].body.forEach((b,i) => {
          c.globalAlpha = i === 0 ? 1 : .75;
          c.fillRect(b.x*S+1, b.y*S+1, S-2, S-2);
        });
        c.globalAlpha = 1;
      }
    };
    draw();
    loop(dt => {
      if (over) return;
      acc += dt;
      if (acc >= .12) { acc = 0; step(); draw(); }
    });
  }
};


/* ================= 8. 乒乓球 ================= */
const pong = {
  name:"乒乓球", icon:"🏓", desc:"玩家1:W/S ・ 玩家2:↑/↓,先得5分",
  start(){
    const W = 600, H = 400, PH = 80, PW = 10, R = 8;
    const c = canvas(W, H, ctl(pad(1,[["▲","w"],["▼","s"]]) + pad(2,[["▲","arrowup"],["▼","arrowdown"]])));
    let y1 = H/2 - PH/2, y2 = H/2 - PH/2, pts = {1:0,2:0}, over = false, pause = 0;
    let ball = {x:W/2, y:H/2, vx:0, vy:0};
    let aiOff = 0, aiDir = false;
    const serve = dir => {
      ball = {x:W/2, y:H/2, vx:300*dir, vy:rnd(-150,150)}; pause = .8;
    };
    serve(Math.random() < .5 ? 1 : -1);
    const info = () => msg(`${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`);
    info();

    const draw = () => {
      c.fillStyle = "#0d1020"; c.fillRect(0,0,W,H);
      c.fillStyle = "#2a3050";
      for (let y=0; y<H; y+=24) c.fillRect(W/2-2, y, 4, 12);
      c.fillStyle = "#ff5d73"; c.fillRect(20, y1, PW, PH);
      c.fillStyle = "#4da3ff"; c.fillRect(W-20-PW, y2, PW, PH);
      c.fillStyle = "#fff"; c.beginPath(); c.arc(ball.x, ball.y, R, 0, 7); c.fill();
    };
    loop(dt => {
      if (over) return;
      const sp = 340 * dt;
      if (K["w"]) y1 -= sp;
      if (K["s"]) y1 += sp;
      if (K["arrowup"]) y2 -= sp;
      if (K["arrowdown"]) y2 += sp;
      y1 = clamp(y1, 0, H-PH); y2 = clamp(y2, 0, H-PH);
if (isCPU(2)) {
  if ((ball.vx > 0) !== aiDir) { aiDir = ball.vx > 0; aiOff = rnd(-1,1) * PH * [.7,.4,.12][cpuLevel-1]; }
  const tg = ball.vx > 0 ? ball.y + aiOff : H/2;     // 球過來才追,否則回中間
  const diff = tg - (y2 + PH/2);
  const mv = [200, 290, 340][cpuLevel-1] * dt;
  if (Math.abs(diff) > 6) y2 += Math.sign(diff) * Math.min(mv, Math.abs(diff));
  y2 = clamp(y2, 0, H-PH);
}

      if (pause > 0) pause -= dt;
      else {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); }
        if (ball.y > H-R) { ball.y = H-R; ball.vy = -Math.abs(ball.vy); }
        // 左拍
        if (ball.vx < 0 && ball.x-R <= 30 && ball.x > 10 && Math.abs(ball.y-(y1+PH/2)) <= PH/2+R) {
          ball.vx = Math.min(700, Math.abs(ball.vx) * 1.06);
          ball.vy += (ball.y-(y1+PH/2)) / (PH/2) * 180; ball.x = 30+R;
        }
        // 右拍
        if (ball.vx > 0 && ball.x+R >= W-30 && ball.x < W-10 && Math.abs(ball.y-(y2+PH/2)) <= PH/2+R) {
          ball.vx = -Math.min(700, Math.abs(ball.vx) * 1.06);
          ball.vy += (ball.y-(y2+PH/2)) / (PH/2) * 180; ball.x = W-30-R;
        }
        ball.vy = clamp(ball.vy, -450, 450);
        // 得分
        let scorer = 0;
        if (ball.x < -R) scorer = 2;
        if (ball.x > W+R) scorer = 1;
        if (scorer) {
          pts[scorer]++; info();
          if (pts[scorer] >= 5) { over = true; win(scorer, ` (${pts[1]} : ${pts[2]})`); }
          else serve(scorer === 1 ? -1 : 1);
        }
      }
      draw();
    });
  }
};

/* ================= 釣魚 / 釣蝦 共用邏輯 ================= */
function makeFishing(cfg) {
  return {
    name:cfg.name, icon:cfg.icon, desc:cfg.desc,
    start(){
      let t = cfg.time, over = false;
      const P = {
        1:{s:0, st:"idle", wait:0, bite:0, pen:0},
        2:{s:0, st:"idle", wait:0, bite:0, pen:0}
      };
      const pond = p => `
        <div>
          <div class="pond" id="pd${p}">
            <div class="pt" id="pt${p}"></div>
<div class="bob" id="bob${p}">${cfg.bob}</div>
            <div class="st" id="st${p}"></div>
          </div>
          ${pad(p, [[`${cfg.icon} 拋竿 / 收竿 (${p===1?"F":"Enter"})`, p===1?"f":"enter"]])}
        </div>`;
      $("stage").innerHTML = `<div class="big" id="timer">${cfg.time}</div><div class="ponds">${pond(1)}${pond(2)}</div>`;
      const say = (p, t) => $("st"+p).textContent = t;
      const draw = () => {
        for (const p of [1,2]) {
          $("pt"+p).innerHTML = `${pn(p)} ${P[p].s} 分`;
          $("bob"+p).classList.toggle("sink", P[p].st === "bite");
        }
      };
      const total = cfg.loot.reduce((a,l) => a + l[2], 0);
      const roll = () => {
        let r = Math.random() * total;
        for (const l of cfg.loot) { r -= l[2]; if (r <= 0) return l; }
        return cfg.loot[0];
      };
      const act = p => {
        if (over) return;
        const s = P[p];
        if (s.st === "idle") {
          s.st = "wait"; s.wait = rnd(cfg.min, cfg.max); say(p, "等待魚上鉤…");
        } else if (s.st === "wait") {
          s.st = "pen"; s.pen = 1; say(p, "太早收竿了!");
        } else if (s.st === "bite") {
          const [e, v, , name] = roll();
          s.s += v; s.st = "idle";
          say(p, `${e} ${name} ${v >= 0 ? "+" : ""}${v}`);
        }
        draw();
      };
      keyHandler = e => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();
        if (k === "f") act(1);
        if (k === "enter") act(2);
      };
      let cpuLast = "", cpuT = 0;
      msg(`${cfg.time} 秒內釣最多分!浮標下沉時立刻收竿`);
      say(1, "按下拋竿開始"); say(2, "按下拋竿開始"); draw();

      loop(dt => {
        if (over) return;
        t -= dt;
        $("timer").textContent = Math.max(0, Math.ceil(t));
        if (isCPU(2)) {
  const s = P[2];
  if (s.st !== cpuLast) {                          // 狀態變了,重新決定反應時間
    cpuLast = s.st;
    cpuT = s.st === "idle" ? rnd(.3,.8)
         : s.st === "bite" ? cfg.window * [rnd(.7,1.3), rnd(.3,.6), rnd(.1,.25)][cpuLevel-1]
         : 99;
  }
  cpuT -= dt;
  if (cpuT <= 0 && (s.st === "idle" || s.st === "bite")) act(2);
}
        for (const p of [1,2]) {
          const s = P[p];
          if (s.st === "wait") {
            s.wait -= dt;
            if (s.wait <= 0) { s.st = "bite"; s.bite = cfg.window; say(p, "有魚!快收竿!"); draw(); }
          } else if (s.st === "bite") {
            s.bite -= dt;
            if (s.bite <= 0) { s.st = "idle"; say(p, "魚跑掉了…"); draw(); }
          } else if (s.st === "pen") {
            s.pen -= dt;
            if (s.pen <= 0) { s.st = "idle"; say(p, "可以再次拋竿"); draw(); }
          }
        }
        if (t <= 0) {
          over = true; $("timer").textContent = 0;
          win(P[1].s === P[2].s ? 0 : P[1].s > P[2].s ? 1 : 2, ` (${P[1].s} : ${P[2].s})`);
        }
      });
    }
  };
}

/* ================= 9. 釣魚 ================= */
const fishing = makeFishing({
  name:"釣魚", icon:"🎣", bob:"🐟", desc:"45 秒內釣最多分,小心別太早收竿",
  time:45, min:1.2, max:3.5, window:0.9,
  loot:[ ["🐟",1,45,"小魚"], ["🐠",2,28,"熱帶魚"], ["🐡",3,15,"河豚"], ["🦈",6,5,"鯊魚"], ["👢",-1,7,"破靴子"] ]
});

/* ================= 10. 釣蝦 ================= */
const shrimp = makeFishing({
  name:"釣蝦", icon:"🦐", bob:"🦐", desc:"咬餌時間更短,考驗手速",
  time:45, min:0.8, max:2.8, window:0.6,
  loot:[ ["🦐",1,45,"小蝦"], ["🦀",2,25,"螃蟹"], ["🦞",4,15,"龍蝦"], ["🦑",3,8,"小卷"], ["🥫",-1,7,"空罐頭"] ]
});

/* ================= 11. 撈金魚 ================= */
const scoop = {
  name:"撈金魚", icon:"🐠", desc:"移動漁網,對準金魚按撈取鍵",
  start(){
    const W = 600, H = 400, RAD = 42;
    const c = canvas(W, H,
      ctl(pad(1,[["▲","w"],["◀","a"],["▼","s"],["▶","d"],["撈 F","f"]]) +
          pad(2,[["▲","arrowup"],["◀","arrowleft"],["▼","arrowdown"],["▶","arrowright"],["撈 ⏎","enter"]])));
    const net = {1:{x:150,y:200,cd:0,flash:0,color:"#ff5d73"}, 2:{x:450,y:200,cd:0,flash:0,color:"#4da3ff"}};
    const pts = {1:0,2:0};
    const types = [ ["🐟",1,70,50], ["🐠",2,150,25], ["🐡",-1,90,25] ];  // 圖案, 分數, 速度, 權重
    let fish = [], t = 30, over = false;
    const spawn = () => {
      let r = Math.random() * 100, ty = types[0];
      for (const x of types) { r -= x[3]; if (r <= 0) { ty = x; break; } }
      const a = rnd(0, Math.PI*2);
      fish.push({x:rnd(40,W-40), y:rnd(40,H-40), vx:Math.cos(a)*ty[2], vy:Math.sin(a)*ty[2], e:ty[0], v:ty[1]});
    };
    for (let i=0; i<10; i++) spawn();

    const info = () => msg(`${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)} ・ 剩 ${Math.max(0,Math.ceil(t))} 秒 ・ 🐡 扣分`);
    info();

    const cast = p => {
      const n = net[p]; if (n.cd > 0 || over) return;
      n.cd = .45; n.flash = .2;
      fish = fish.filter(f => {
        if (Math.hypot(f.x-n.x, f.y-n.y) <= RAD) { pts[p] += f.v; return false; }
        return true;
      });
      while (fish.length < 10) spawn();
      info();
    };
    keyHandler = e => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "f") cast(1);
      if (k === "enter") cast(2);
    };

    loop(dt => {
      if (over) return;
      t -= dt;
      const sp = 260 * dt;
      if (K["a"]) net[1].x -= sp; if (K["d"]) net[1].x += sp;
      if (K["w"]) net[1].y -= sp; if (K["s"]) net[1].y += sp;
           if (K["arrowleft"]) net[2].x -= sp; if (K["arrowright"]) net[2].x += sp;
      if (K["arrowup"]) net[2].y -= sp; if (K["arrowdown"]) net[2].y += sp;

      if (isCPU(2)) {
        const n = net[2]; let tg = null, bs = -1e9;
        for (const f of fish) {
          if (f.v < 0) continue;                                  // 不撈河豚
          const sc = f.v * 60 - Math.hypot(f.x-n.x, f.y-n.y);     // 高分且近的優先
          if (sc > bs) { bs = sc; tg = f; }
        }
        if (tg) {
          const dx = tg.x-n.x, dy = tg.y-n.y, d = Math.hypot(dx,dy);
          const mv = [150, 210, 260][cpuLevel-1] * dt;
          if (d > 4) { n.x += dx/d * Math.min(mv,d); n.y += dy/d * Math.min(mv,d); }
          if (d <= RAD * [.4, .6, .8][cpuLevel-1]) cast(2);
        }
      }

      for (const p of [1,2]) {
        const n = net[p];
        n.x = clamp(n.x, 0, W); n.y = clamp(n.y, 0, H);
        n.cd = Math.max(0, n.cd - dt); n.flash = Math.max(0, n.flash - dt);
      }

      fish.forEach(f => {
        f.x += f.vx*dt; f.y += f.vy*dt;
        if (f.x < 20 || f.x > W-20) f.vx *= -1;
        if (f.y < 20 || f.y > H-20) f.vy *= -1;
        f.x = clamp(f.x, 20, W-20); f.y = clamp(f.y, 20, H-20);
        if (Math.random() < dt*.6) { const a = Math.atan2(f.vy,f.vx) + rnd(-.8,.8), s = Math.hypot(f.vx,f.vy); f.vx = Math.cos(a)*s; f.vy = Math.sin(a)*s; }
      });
      // 畫面
      c.fillStyle = "#0e4a7a"; c.fillRect(0,0,W,H);
      c.font = "28px sans-serif";
      fish.forEach(f => {
        c.save(); c.translate(f.x, f.y);
        if (f.vx < 0) c.scale(-1, 1);
        c.fillText(f.e, 0, 0); c.restore();
      });
      for (const p of [1,2]) {
        const n = net[p];
        c.strokeStyle = n.color; c.lineWidth = n.flash > 0 ? 7 : 3;
        c.globalAlpha = n.cd > 0 ? .5 : 1;
        c.beginPath(); c.arc(n.x, n.y, RAD, 0, 7); c.stroke();
        c.fillStyle = n.color; c.font = "bold 14px sans-serif"; c.fillText("P"+p, n.x, n.y);
        c.globalAlpha = 1;
      }
      if (t <= 0) { over = true; info(); win(pts[1] === pts[2] ? 0 : pts[1] > pts[2] ? 1 : 2, ` (${pts[1]} : ${pts[2]})`); }
      else if (Math.floor(t*10) % 5 === 0) info();
    });
  }
};

/* ================= 大廳 ================= */
const games = [ttt, c4, react, mash, rps, memory, snake, pong, fishing, shrimp, scoop];

$("menu").innerHTML = games.map((g,i) =>
  `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
).join("");

function reset(){
  clearTimers();
  cleanups.forEach(f => f()); cleanups = [];
  keyHandler = null;
  turnNow = 0;
  for (const k in K) delete K[k];
  $("stage").innerHTML = "";
}
// 每款遊戲的 start() 執行前,自動清除上一局的計時器與動畫
games.forEach(g => { const s = g.start; g.start = function(){ reset(); s.call(g); }; });

function play(i){
  current = games[i];
  $("menu").style.display = "none";
  $("game").style.display = "block";
  $("gtitle").textContent = current.icon + " " + current.name;
  current.start();
}
function back(){
  reset(); current = null;
  $("game").style.display = "none";
  $("menu").style.display = "grid";
  msg("");
}
/* ===== 電腦模式開關 ===== */
$("cpuOn").onchange = e => {
  if (e.target.checked && $("netInfo").style.display !== "none") {
    e.target.checked = false;
    alert("線上連線中,無法使用電腦模式");
    return;
  }
  vsCPU = e.target.checked; applyCpuUI();
  if (current) current.start();          // 切換後重開目前遊戲
};
$("cpuLevel").onchange = e => {
  cpuLevel = +e.target.value;
  if (current && vsCPU) current.start();   // 換難度後重開目前遊戲
};
