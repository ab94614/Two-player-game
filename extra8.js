/* ========== 新增小遊戲 7：吃豆人對戰 / 接水果 / 數字接龍 ========== */
(function () {
  const COL = { 1:"#ff5d73", 2:"#4da3ff" };
  const mk = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  /* ---------- 吃豆人對戰 ---------- */
  const pac = {
    name:"吃豆人對戰", icon:"👻", desc:"共用迷宮搶豆子,吃得多者勝",
    rules:[
      "共用一個迷宮,豆子散布各處。",
      "玩家1 用 W A S D,玩家2 用方向鍵(手機點按鈕),按一次方向就會持續前進。",
      "走過的豆子歸你,60 秒內吃得比較多者獲勝。",
      "豆子吃光也會提前結算。"
    ],
    start(){
      const M = [
        "###############",
        "#.............#",
        "#.##.#####.##.#",
        "#.............#",
        "#.##.#.#.#.##.#",
        "#....#...#....#",
        "####.#.#.#.####",
        "#.............#",
        "#.##.#####.##.#",
        "#..#.......#..#",
        "##.#.#.#.#.#.##",
        "#....#...#....#",
        "#.##.#####.##.#",
        "#.............#",
        "###############"
      ];
      const N = 15, CS = 24, LIM = 60;
      const c = canvas(N * CS, N * CS, ctl(
        pad(1,[["▲","w"],["◀","a"],["▼","s"],["▶","d"]]) +
        pad(2,[["▲","arrowup"],["◀","arrowleft"],["▼","arrowdown"],["▶","arrowright"]])));
      const g = M.map(r => r.split("").map(ch => ch === "#" ? 1 : 2));
      g[1][1] = 0; g[13][13] = 0;
      const P = { 1:{ x:1, y:1, dx:0, dy:0, sc:0, t:0 }, 2:{ x:13, y:13, dx:0, dy:0, sc:0, t:0 } };
      let total = 0; g.forEach(r => r.forEach(v => { if (v === 2) total++; }));
      let el = 0, over = false;
      const DIR = { w:[1,0,-1], a:[1,-1,0], s:[1,0,1], d:[1,1,0],
                    arrowup:[2,0,-1], arrowleft:[2,-1,0], arrowdown:[2,0,1], arrowright:[2,1,0] };
      keyHandler = e => {
        const d = DIR[e.key.toLowerCase()]; if (!d) return;
        if (e.key.startsWith("Arrow")) e.preventDefault();
        P[d[0]].dx = d[1]; P[d[0]].dy = d[2];
      };
      const draw = () => {
        c.fillStyle = "#0d1020"; c.fillRect(0, 0, N * CS, N * CS);
        g.forEach((r, y) => r.forEach((v, x) => {
          if (v === 1) { c.fillStyle = "#3a4070"; c.fillRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2); }
          else if (v === 2) { c.fillStyle = "#ffd34d"; c.beginPath(); c.arc(x * CS + CS/2, y * CS + CS/2, 3, 0, 7); c.fill(); }
        }));
        for (const p of [1,2]) {
          c.fillStyle = COL[p]; c.beginPath();
          c.arc(P[p].x * CS + CS/2, P[p].y * CS + CS/2, CS/2 - 2, 0, 7); c.fill();
        }
      };
      const info = () => msg(`${pn(1)} ${P[1].sc} : ${P[2].sc} ${pn(2)} ・ 剩 ${Math.max(0, Math.ceil(LIM - el))} 秒`);
      draw(); info();
      loop(dt => {
        if (over) return;
        el += dt;
        for (const p of [1,2]) {
          const s = P[p];
          s.t += dt;
          if (s.t < .16) continue;
          s.t = 0;
          const nx = s.x + s.dx, ny = s.y + s.dy;
          if ((s.dx || s.dy) && g[ny][nx] !== 1) {
            s.x = nx; s.y = ny;
            if (g[ny][nx] === 2) { g[ny][nx] = 0; s.sc++; total--; }
          }
        }
        draw(); info();
        if (total <= 0 || el >= LIM) {
          over = true;
          win(P[1].sc === P[2].sc ? 0 : P[1].sc > P[2].sc ? 1 : 2, ` (${P[1].sc} : ${P[2].sc})`);
        }
      });
    }
  };

  /* ---------- 接水果 ---------- */
  const PW = 300, H = 400, GAP = 20, W = PW * 2 + GAP;
  const fruit = {
    name:"接水果", icon:"🍎", desc:"左右兩個視窗接水果,小心炸彈",
    rules:[
      "左右兩個視窗,掉落的水果與炸彈完全一樣。",
      "玩家1 用 A / D 移動籃子,玩家2 用 ← / →(手機點 ◀ ▶)。",
      "接到水果 +1 分,🍒 稀有水果 +3 分,接到炸彈 -3 分。",
      "60 秒後結算,分數高者獲勝。"
    ],
    start(){
      const c = canvas(W, H, ctl(pad(1,[["◀","a"],["▶","d"]]) + pad(2,[["◀","arrowleft"],["▶","arrowright"]])));
      const rng = mk(Date.now() & 0xffffff), LIM = 60;
      const S = { 1:{ x:PW/2, sc:0, items:[] }, 2:{ x:PW/2, sc:0, items:[] } };
      let el = 0, sp = 1, over = false;
      const dirKeys = { 1:["a","d"], 2:["arrowleft","arrowright"] };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.font = "26px sans-serif"; c.textAlign = "center";
          for (const it of S[p].items) c.fillText(it.e, it.x, it.y);
          c.fillStyle = COL[p]; c.fillRect(S[p].x - 32, H - 24, 64, 12);
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left";
          c.fillText(names[p], 8, 22); c.textAlign = "right"; c.fillText(`${S[p].sc} 分`, PW - 8, 22);
          c.strokeStyle = "#3a4070"; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      const info = () => msg(`${pn(1)} ${S[1].sc} : ${S[2].sc} ${pn(2)} ・ 剩 ${Math.max(0, Math.ceil(LIM - el))} 秒`);
      draw(); info();
      let sp_t = .5;
      loop(dt => {
        if (over) return;
        el += dt; sp_t -= dt;
        if (sp_t <= 0) {
          sp_t = Math.max(.3, .6 - el * .004);
          const r = rng(), x = 20 + rng() * (PW - 40);
          const it = r < .2 ? { e:"💣", v:-3 } : r < .3 ? { e:"🍒", v:3 } : { e:["🍎","🍌","🍇"][Math.floor(rng() * 3)], v:1 };
          for (const p of [1,2]) S[p].items.push({ x, y:-10, e:it.e, v:it.v });
        }
        for (const p of [1,2]) {
          const s = S[p], k = dirKeys[p];
          s.x = clamp(s.x + ((K[k[1]] ? 1 : 0) - (K[k[0]] ? 1 : 0)) * 300 * dt, 32, PW - 32);
          s.items = s.items.filter(it => {
            it.y += (150 + el * 2) * dt;
            if (it.y > H - 34 && it.y < H - 8 && Math.abs(it.x - s.x) < 38) { s.sc += it.v; return false; }
            return it.y < H + 20;
          });
        }
        draw(); info();
        if (el >= LIM) {
          over = true;
          win(S[1].sc === S[2].sc ? 0 : S[1].sc > S[2].sc ? 1 : 2, ` (${S[1].sc} : ${S[2].sc})`);
        }
      });
    }
  };

  /* ---------- 數字接龍 ---------- */
  const seq = {
    name:"數字接龍", icon:"🔢", desc:"各有一塊棋盤,先依序點完 1~25 者勝",
    rules:[
      "左右各有一塊 5×5 棋盤,上面隨機排著 1 到 25(兩邊排法不同)。",
      "玩家1 點左邊,玩家2 點右邊,各自依序點 1、2、3……",
      "點錯會鎖定 0.8 秒,不能亂點。",
      "先點完 25 的人獲勝。"
    ],
    start(){
      const shuf = () => Array.from({length:25}, (_, i) => i + 1).sort(() => Math.random() - .5);
      const B = { 1:shuf(), 2:shuf() };
      const nx = { 1:1, 2:1 }, lock = { 1:false, 2:false };
      let over = false;
      const panel = p => `<div style="flex:1;max-width:300px;padding:8px;border:3px solid ${p === 1 ? "#ff5d73" : "#4da3ff"};border-radius:14px">
        <div id="sqi${p}" style="font-weight:900;margin-bottom:6px"></div>
        <div id="sqb${p}" style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px"></div></div>`;
      $("stage").innerHTML = `<div id="sqw" style="display:flex;gap:14px;justify-content:center;margin:10px auto">${panel(1)}${panel(2)}</div>`;
      const draw = p => {
        $("sqi" + p).innerHTML = `${pn(p)} ・ 下一個:<b>${Math.min(nx[p], 25)}</b>`;
        $("sqb" + p).innerHTML = B[p].map(n =>
          `<button data-p="${p}" data-n="${n}" style="height:48px;padding:0;font-size:1.2rem;font-weight:900;${n < nx[p] ? "opacity:.2;" : ""}background:var(--card)">${n}</button>`).join("");
      };
      draw(1); draw(2); msg("搶著依序點完 1~25!");
      $("sqw").onpointerdown = e => {
        const b = e.target.closest("button[data-n]"); if (!b || over) return;
        const p = +b.dataset.p, n = +b.dataset.n;
        if (lock[p] || n < nx[p]) return;
        if (n === nx[p]) {
          nx[p]++; draw(p);
          if (nx[p] > 25) { over = true; win(p, ""); }
        } else {
          lock[p] = true; b.style.background = "#7a2b38";
          later(() => { lock[p] = false; if (!over) draw(p); }, 800);
        }
      };
    }
  };


  [pac, fruit, seq].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
