/* ========== 新增小遊戲 5：跳跳鳥 / 賽車閃避 / 海戰棋 ========== */
(function () {
  const PW = 300, H = 400, GAP = 20, W = PW * 2 + GAP;
  const COL = { 1:"#ff5d73", 2:"#4da3ff" };
  const ox = p => p === 1 ? 0 : PW + GAP;
  const mk = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const panel = (c, p, fn) => {
    c.save(); c.beginPath(); c.rect(ox(p), 0, PW, H); c.clip(); c.translate(ox(p), 0);
    fn(); c.restore();
  };
  const frame = c => {
    c.strokeStyle = "#3a4070"; c.lineWidth = 2;
    c.strokeRect(1, 1, PW-2, H-2); c.strokeRect(PW+GAP+1, 1, PW-2, H-2);
  };
  const hud = (c, left, right) => {
    c.font = "bold 16px sans-serif"; c.fillStyle = "#fff";
    c.textAlign = "left";  c.fillText(left, 8, 22);
    c.textAlign = "right"; c.fillText(right, PW - 8, 22);
    c.textAlign = "center";
  };
  const out = (c, text) => {
    c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(0, 0, PW, H);
    c.fillStyle = "#fff"; c.font = "bold 32px sans-serif"; c.fillText("出局", PW/2, H/2 - 14);
    c.font = "bold 18px sans-serif"; c.fillText(text, PW/2, H/2 + 20);
  };

  /* ---------- 跳跳鳥 ---------- */
  const flappy = {
    name:"跳跳鳥", icon:"🐤", desc:"左右兩個小視窗,穿過一樣的水管",
    rules:[
      "畫面分成左右兩個小視窗,水管位置完全一樣。",
      "玩家1 按 W 拍翅膀,玩家2 按 ↑(手機點「跳」按鈕)。",
      "撞到水管、掉到地面或飛出天花板就出局。",
      "穿過水管越多越好。一人出局後,另一人只要超過對方分數就立刻獲勝;兩邊都出局則比分數。"
    ],
    start(){
      const c = canvas(W, H, ctl(pad(1,[["跳 W","w"]]) + pad(2,[["跳 ↑","arrowup"]])));
      const seed = Date.now() & 0xffffff, BX = 70, PIPE = 44, GH = 56;
      const S = {};
      const add = (s, x) => s.pipes.push({ x, gy: 90 + s.rng() * (H - 180), done:false });
      for (const p of [1,2]) {
        S[p] = { rng: mk(seed), y: H/2, vy: 0, alive: true, sc: 0, pipes: [] };
        add(S[p], PW + 40);
      }
      let el = 0, over = false;
      msg("玩家1:W 跳 ・ 玩家2:↑ 跳。穿過水管!");
      const flap = p => { const s = S[p]; if (s.alive && el > 1 && !over) s.vy = -290; };
      keyHandler = e => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();
        if (k === "w") flap(1);
        if (k === "arrowup") flap(2);
      };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) panel(c, p, () => {
          const s = S[p];
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.fillStyle = "#2ecc71";
          for (const q of s.pipes) {
            c.fillRect(q.x, 0, PIPE, q.gy - GH);
            c.fillRect(q.x, q.gy + GH, PIPE, H - q.gy - GH);
          }
          if (s.alive) { c.font = "26px sans-serif"; c.fillText("🐤", BX, s.y); }
          hud(c, names[p], `${s.sc} 分`);
          if (!s.alive) out(c, `最終 ${s.sc} 分`);
          else if (el < 1) { c.fillStyle = "#fff"; c.font = "bold 24px sans-serif"; c.fillText("準備!", PW/2, H/2); }
        });
        frame(c);
      };
      draw();
      loop(dt => {
        if (over) return;
        el += dt;
        if (el > 1) for (const p of [1,2]) {
          const s = S[p]; if (!s.alive) continue;
          s.vy = Math.min(500, s.vy + 900 * dt); s.y += s.vy * dt;
          for (const q of s.pipes) q.x -= 130 * dt;
          while (s.pipes.length && s.pipes[0].x < -PIPE - 10) s.pipes.shift();
          const last = s.pipes[s.pipes.length - 1];
          if (last.x < PW) add(s, last.x + 170);
          for (const q of s.pipes) {
            if (!q.done && q.x + PIPE < BX - 10) { q.done = true; s.sc++; }
            if (BX + 10 > q.x && BX - 10 < q.x + PIPE && (s.y - 10 < q.gy - GH || s.y + 10 > q.gy + GH)) s.alive = false;
          }
          if (s.y > H - 10 || s.y < 10) s.alive = false;
        }
        const a = S[1], b = S[2];
        let w = null;
        if (!a.alive && !b.alive) w = a.sc === b.sc ? 0 : a.sc > b.sc ? 1 : 2;
        else if (!a.alive && b.sc > a.sc) w = 2;
        else if (!b.alive && a.sc > b.sc) w = 1;
        draw();
        if (w !== null) { over = true; win(w, ` (${a.sc} : ${b.sc} 分)`); }
        else msg(`${pn(1)} ${a.sc} 分 ・ ${pn(2)} ${b.sc} 分`);
      });
    }
  };

  /* ---------- 賽車閃避 ---------- */
  const racer = {
    name:"賽車閃避", icon:"🏎️", desc:"左右兩條 3 線道,換線閃避障礙車",
    rules:[
      "畫面分成左右兩個小視窗,各有 3 條線道,障礙車完全一樣。",
      "玩家1 用 A / D 換線,玩家2 用 ← / →(手機點 ◀ ▶)。",
      "撞到障礙車就出局,速度會越來越快。",
      "撐得比較久的人獲勝。一人出局後,另一人只要撐得更久就立刻獲勝。"
    ],
    start(){
      const c = canvas(W, H, ctl(pad(1,[["◀","a"],["▶","d"]]) + pad(2,[["◀","arrowleft"],["▶","arrowright"]])));
      const rng = mk(Date.now() & 0xffffff), LW = PW / 3, PY = H - 70;
      const S = { 1:{ lane:1, alive:true, t:0, cars:[] }, 2:{ lane:1, alive:true, t:0, cars:[] } };
      let el = 0, sp = 0, spawnT = 1, over = false;
      msg("玩家1:A / D 換線 ・ 玩家2:← / →。閃開障礙車!");
      keyHandler = e => {
        const k = e.key.toLowerCase();
        if (k === "a") S[1].lane = Math.max(0, S[1].lane - 1);
        if (k === "d") S[1].lane = Math.min(2, S[1].lane + 1);
        if (k === "arrowleft")  S[2].lane = Math.max(0, S[2].lane - 1);
        if (k === "arrowright") S[2].lane = Math.min(2, S[2].lane + 1);
      };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) panel(c, p, () => {
          const s = S[p];
          c.fillStyle = "#1c2033"; c.fillRect(0, 0, PW, H);
          c.fillStyle = "#3a4070";
          for (let i = 1; i < 3; i++) for (let y = (el * sp * .5) % 40 - 40; y < H; y += 40) c.fillRect(i * LW - 2, y, 4, 20);
          c.font = "34px sans-serif";
          for (const r of s.cars) c.fillText("🚙", r.l * LW + LW/2, r.y);
          if (s.alive) { c.fillStyle = COL[p]; c.fillRect(s.lane * LW + LW/2 - 16, PY - 22, 32, 44); c.fillStyle = "#fff"; c.fillRect(s.lane * LW + LW/2 - 10, PY - 14, 20, 10); }
          hud(c, names[p], `${(s.alive ? el : s.t).toFixed(1)} 秒`);
          if (!s.alive) out(c, `撐了 ${s.t.toFixed(1)} 秒`);
        });
        frame(c);
      };
      draw();
      loop(dt => {
        if (over) return;
        el += dt; spawnT -= dt;
        sp = Math.min(520, 220 + el * 7);
        if (spawnT <= 0) {
          spawnT = Math.max(.4, .95 - el * .01);
          const free = Math.floor(rng() * 3), n = rng() < .35 ? 1 : 2, lanes = [0,1,2].filter(l => l !== free);
          if (n === 1) lanes.splice(Math.floor(rng() * 2), 1);
          for (const p of [1,2]) for (const l of lanes) S[p].cars.push({ l, y:-30 });
        }
        for (const p of [1,2]) {
          const s = S[p]; if (!s.alive) continue;
          s.cars = s.cars.filter(r => {
            r.y += sp * dt;
            if (r.l === s.lane && r.y > PY - 40 && r.y < PY + 36) { s.alive = false; s.t = el; }
            return r.y < H + 40;
          });
        }
        const a = S[1], b = S[2];
        let w = null;
        if (!a.alive && !b.alive) w = a.t === b.t ? 0 : a.t > b.t ? 1 : 2;
        else if (!a.alive && el > a.t) w = 2;
        else if (!b.alive && el > b.t) w = 1;
        if (w !== null && (!a.alive || !b.alive) && a.alive !== b.alive) {
          // 一人出局後,存活者撐得更久才結算
        }
        draw();
        if (w !== null) { over = true; const ta = a.alive ? el : a.t, tb = b.alive ? el : b.t; win(w, ` (${ta.toFixed(1)} : ${tb.toFixed(1)} 秒)`); }
      });
    }
  };

  /* ---------- 海戰棋 ---------- */
  const navy = {
    name:"海戰棋", icon:"🚢", desc:"輪流轟炸對方海域,先擊沉全部船艦者勝",
    rules:[
      "雙方各有一片 6×6 海域,隨機藏著 3 艘船(長度 3、2、2)。",
      "輪到你時,點對方的海域來攻擊。畫面只會顯示命中與落空,看不到船的位置。",
      "命中可以再射一次,落空就換對方。擊沉整艘船會有提示。",
      "先擊沉對方全部船艦的人獲勝。"
    ],
    start(){
      const N = 6, LENS = [3,2,2], TOTAL = 7;
      const mkBoard = () => {
        const sh = Array(N*N).fill(0);
        LENS.forEach((len, id) => {
          for (;;) {
            const h = Math.random() < .5, x = Math.floor(rnd(0, h ? N - len + 1 : N)), y = Math.floor(rnd(0, h ? N : N - len + 1));
            const cells = Array.from({length:len}, (_, k) => (h ? y*N + x + k : (y+k)*N + x));
            if (cells.every(i => !sh[i])) { cells.forEach(i => sh[i] = id + 1); break; }
          }
        });
        return sh;
      };
      const ship = { 1: mkBoard(), 2: mkBoard() };      // 擁有者 → 船位置
      const shot = { 1: Array(N*N).fill(0), 2: Array(N*N).fill(0) };   // 0 未射 1 落空 2 命中
      const hits = { 1:0, 2:0 };
      let turn = 1, over = false;
      turnNow = 1;
      const board = b => {
        const cells = shot[b].map((v, i) => {
          const t = v === 2 ? "💥" : v === 1 ? "🌊" : "";
          const bg = v === 2 ? "#7a2b38" : v === 1 ? "#1e4a7a" : "#2a3a5c";
          return `<button data-b="${b}" data-i="${i}" style="height:40px;padding:0;font-size:1.1rem;background:${bg}">${t}</button>`;
        }).join("");
        return `<div style="flex:1"><div style="margin:4px;font-weight:900">${pn(b)} 的海域</div>
          <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:3px;padding:6px;border:3px solid ${COL[b]};border-radius:12px">${cells}</div></div>`;
      };
      const draw = () => $("stage").innerHTML = `<div id="nv" style="display:flex;gap:14px;max-width:640px;margin:10px auto">${board(1)}${board(2)}</div>`;
      const label = () => msg(`輪到 ${pn(turn)} 攻擊 ${pn(3 - turn)} 的海域 ・ 已命中 ${hits[turn]}/${TOTAL}`);
      label(); draw();
      $("stage").onclick = e => {
        const b = e.target.closest("button[data-i]"); if (!b || over) return;
        const owner = +b.dataset.b, i = +b.dataset.i;
        if (owner !== 3 - turn || shot[owner][i]) return;
        const id = ship[owner][i];
        if (!id) {
          shot[owner][i] = 1; draw();
          turn = 3 - turn; turnNow = turn; label(); return;
        }
        shot[owner][i] = 2; hits[turn]++; draw();
        if (hits[turn] >= TOTAL) { over = true; turnNow = 0; win(turn, " (擊沉所有船艦)"); return; }
        const sunk = ship[owner].every((v, k) => v !== id || shot[owner][k] === 2);
        msg(`${pn(turn)} ${sunk ? "擊沉一艘船!" : "命中!"}再射一次 ・ 已命中 ${hits[turn]}/${TOTAL}`);
      };
    }
  };

  /* ---------- 註冊到大廳 ---------- */
  [flappy, racer, navy].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
