/* ========== 新增小遊戲 6：俄羅斯方塊對戰 / 黑白棋 / 轉盤對決 ========== */
(function () {
  const COL = { 1:"#ff5d73", 2:"#4da3ff" };
  const mk = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  /* ---------- 俄羅斯方塊對戰 ---------- */
  const PW = 300, H = 400, GAP = 20, W = PW * 2 + GAP;
  const TET = [
    { c:"#4dd9ff", s:[[-1,0],[0,0],[1,0],[2,0]] },
    { c:"#ffd34d", s:[[0,0],[1,0],[0,1],[1,1]] },
    { c:"#b06bff", s:[[-1,0],[0,0],[1,0],[0,1]] },
    { c:"#2ecc71", s:[[0,0],[1,0],[-1,1],[0,1]] },
    { c:"#ff5d73", s:[[-1,0],[0,0],[0,1],[1,1]] },
    { c:"#4da3ff", s:[[-1,0],[0,0],[1,0],[-1,1]] },
    { c:"#ff9f4d", s:[[-1,0],[0,0],[1,0],[1,1]] }
  ];
  const tetris = {
    name:"俄羅斯方塊對戰", icon:"🧩", desc:"消 2 行以上送垃圾行,先堆到頂的人輸",
    rules:[
      "左右兩個視窗,掉落的方塊順序完全一樣。",
      "玩家1:A / D 左右、W 旋轉、S 下移、空白鍵硬降。玩家2:← / → 左右、↑ 旋轉、↓ 下移、Enter 硬降(手機點按鈕)。",
      "一次消 2 行以上會送垃圾行給對手(2 行送 1、3 行送 2、4 行送 4)。堆到頂就出局,但對手可繼續玩;存活者消的行數超過出局者就獲勝,兩人都出局則比總消行數。"
    ],
    start(){
      const CS = 18, N = 10, R = 20, BX = (PW - N * CS) / 2, BY = 30;
      const c = canvas(W, H, ctl(
        pad(1,[["◀","a"],["▶","d"],["⟳","w"],["▼","s"],["⤓"," "]]) +
        pad(2,[["◀","arrowleft"],["▶","arrowright"],["⟳","arrowup"],["▼","arrowdown"],["⤓","enter"]])));
      const rng = mk(Date.now() & 0xffffff), seq = [];
      const piece = i => { while (seq.length <= i) seq.push(Math.floor(rng() * 7)); return seq[i]; };
      const S = {};
      const fits = (s, cells, x, y) => cells.every(([dx, dy]) => {
        const cx = x + dx, cy = y + dy;
        return cx >= 0 && cx < N && cy < R && (cy < 0 || !s.g[cy][cx]);
      });
      const spawn = s => {
        const t = piece(s.i++);
        s.t = t; s.cells = TET[t].s.map(a => a.slice()); s.x = 4; s.y = 0; s.tm = 0;
        if (!fits(s, s.cells, s.x, s.y)) s.alive = false;
      };
      for (const p of [1,2]) {
        S[p] = { g: Array.from({length:R}, () => Array(N).fill(0)), i:0, alive:true, lines:0, pend:0 };
        spawn(S[p]);
      }
      let el = 0, over = false;
      const lock = p => {
        const s = S[p], o = S[3 - p];
        s.cells.forEach(([dx, dy]) => { const cy = s.y + dy; if (cy >= 0) s.g[cy][s.x + dx] = TET[s.t].c; });
        let n = 0;
        for (let y = R - 1; y >= 0; y--) {
          if (s.g[y].every(v => v)) { s.g.splice(y, 1); n++; y++; }
        }
        while (s.g.length < R) s.g.unshift(Array(N).fill(0));
        s.lines += n;
        let send = n >= 4 ? 4 : n >= 2 ? n - 1 : 0;
        const cancel = Math.min(s.pend, send); s.pend -= cancel; send -= cancel;
        o.pend += send;
        if (n === 0 && s.pend > 0) {
          for (let k = 0; k < s.pend; k++) {
            if (s.g[0].some(v => v)) s.alive = false;
            s.g.shift();
            const row = Array(N).fill("#666"); row[Math.floor(rng() * N)] = 0;
            s.g.push(row);
          }
          s.pend = 0;
        }
        spawn(s);
      };
      const act = (p, k) => {
        const s = S[p]; if (!s.alive || over || el < 1) return;
        if (k === "L" && fits(s, s.cells, s.x - 1, s.y)) s.x--;
        else if (k === "R" && fits(s, s.cells, s.x + 1, s.y)) s.x++;
        else if (k === "D") { if (fits(s, s.cells, s.x, s.y + 1)) s.y++; else lock(p); }
                else if (k === "H") {
          while (fits(s, s.cells, s.x, s.y + 1)) s.y++;
          lock(p);
        }
        else if (k === "U" && s.t !== 1) {
          const rc = s.cells.map(([x, y]) => [-y, x]);
          for (const kx of [0, -1, 1, -2, 2]) if (fits(s, rc, s.x + kx, s.y)) { s.cells = rc; s.x += kx; break; }
        }
      };
      const KM = { a:[1,"L"], d:[1,"R"], w:[1,"U"], s:[1,"D"], " ":[1,"H"],
                   arrowleft:[2,"L"], arrowright:[2,"R"], arrowup:[2,"U"], arrowdown:[2,"D"], enter:[2,"H"] };
      keyHandler = e => {
        const m = KM[e.key.toLowerCase()]; if (!m) return;
        if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
        if (m[1] === "H" && e.repeat) return;
        act(m[0], m[1]);
      };
      msg("玩家1:A D W S 空白硬降 ・ 玩家2:← → ↑ ↓ Enter 硬降。消 2 行以上送垃圾行!");
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.fillStyle = "#1c2033"; c.fillRect(BX, BY, N * CS, R * CS);
          s.g.forEach((row, y) => row.forEach((v, x) => {
            if (v) { c.fillStyle = v; c.fillRect(BX + x * CS + 1, BY + y * CS + 1, CS - 2, CS - 2); }
          }));
          if (s.alive) {
            c.fillStyle = TET[s.t].c;
            s.cells.forEach(([dx, dy]) => {
              const cy = s.y + dy; if (cy < 0) return;
              c.fillRect(BX + (s.x + dx) * CS + 1, BY + cy * CS + 1, CS - 2, CS - 2);
            });
          }
          if (s.pend > 0) { c.fillStyle = "#ff5d73"; c.fillRect(BX - 8, BY + (R - s.pend) * CS, 5, s.pend * CS); }
          c.font = "bold 16px sans-serif"; c.fillStyle = "#fff"; c.textAlign = "left";
          c.fillText(names[p], 8, 22); c.textAlign = "right"; c.fillText(`${s.lines} 行`, PW - 8, 22);
          c.textAlign = "center";
          if (!s.alive) {
            c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(0, 0, PW, H);
            c.fillStyle = "#fff"; c.font = "bold 32px sans-serif"; c.fillText("出局", PW / 2, H / 2);
          } else if (el < 1) { c.fillStyle = "#fff"; c.font = "bold 24px sans-serif"; c.fillText("準備!", PW / 2, H / 2); }
          c.strokeStyle = COL[p]; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      draw();
      loop(dt => {
        if (over) return;
        el += dt;
        if (el > 1) {
          const iv = Math.max(.1, .7 - el * .006);
          for (const p of [1,2]) {
            const s = S[p]; if (!s.alive) continue;
            s.tm += dt;
            if (s.tm >= iv) { s.tm = 0; if (fits(s, s.cells, s.x, s.y + 1)) s.y++; else lock(p); }
          }
        }
        draw();
        const a = S[1], b = S[2];
        if (!a.alive && !b.alive) {
          over = true;
          win(a.lines === b.lines ? 0 : a.lines > b.lines ? 1 : 2, ` (${a.lines} : ${b.lines} 行)`);
        } else if (!a.alive && b.lines > a.lines) {
          over = true; win(2, ` (${a.lines} : ${b.lines} 行)`);
        } else if (!b.alive && a.lines > b.lines) {
          over = true; win(1, ` (${a.lines} : ${b.lines} 行)`);
        }
      });
    }
  };

  /* ---------- 黑白棋 ---------- */
  const othello = {
    name:"黑白棋", icon:"⚫", desc:"夾住對方的棋就翻面,棋子多者勝",
    rules:[
      "8×8 棋盤,玩家1 執黑棋,玩家2 執白棋,黑棋先下。",
      "每一步必須夾住對方至少一顆棋,被夾住的棋全部翻成自己的顏色。",
      "畫面上的小圓點是可以下的位置。沒地方可下時會自動跳過。",
      "雙方都無處可下時結束,棋子多的人獲勝。"
    ],
    start(){
      const N = 8, D = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
      const b = Array(N*N).fill(0);
      b[27] = 2; b[28] = 1; b[35] = 1; b[36] = 2;
      let turn = 1, over = false;
      turnNow = 1;
      $("stage").innerHTML = '<div id="og" style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px;max-width:380px;margin:12px auto;padding:8px;background:#1d6b3a;border-radius:12px"></div>';
      const flips = (i, p) => {
        const x = i % N, y = (i / N) | 0, r = [];
        if (b[i]) return r;
        for (const [dx, dy] of D) {
          const line = []; let nx = x + dx, ny = y + dy;
          while (nx >= 0 && ny >= 0 && nx < N && ny < N && b[ny*N + nx] === 3 - p) { line.push(ny*N + nx); nx += dx; ny += dy; }
          if (line.length && nx >= 0 && ny >= 0 && nx < N && ny < N && b[ny*N + nx] === p) r.push(...line);
        }
        return r;
      };
      const moves = p => b.map((_, i) => i).filter(i => flips(i, p).length);
      const count = p => b.filter(v => v === p).length;
      const draw = () => {
        const ok = new Set(over ? [] : moves(turn));
        $("og").innerHTML = b.map((v, i) => {
          const t = v ? `<span style="display:block;width:70%;aspect-ratio:1;margin:auto;border-radius:50%;background:${v === 1 ? "#111" : "#f3f3f3"}"></span>`
                      : ok.has(i) ? `<span style="display:block;width:24%;aspect-ratio:1;margin:auto;border-radius:50%;background:rgba(255,255,255,.35)"></span>` : "";
          return `<button data-i="${i}" style="aspect-ratio:1;padding:0;background:#2a8a4d">${t}</button>`;
        }).join("");
      };
      const info = () => msg(`輪到 ${pn(turn)}(${turn === 1 ? "黑" : "白"})・ 黑 ${count(1)} : ${count(2)} 白`);
      const finish = () => {
        over = true; turnNow = 0; draw();
        const a = count(1), c = count(2);
        win(a === c ? 0 : a > c ? 1 : 2, ` (黑 ${a} : ${c} 白)`);
      };
      info(); draw();
      $("og").onclick = e => {
        const el = e.target.closest("button[data-i]"); if (!el || over) return;
        const i = +el.dataset.i, f = flips(i, turn);
        if (!f.length) return;
        b[i] = turn; f.forEach(k => b[k] = turn);
        turn = 3 - turn;
        if (!moves(turn).length) {
          const skipped = turn;
          turn = 3 - turn;
          if (!moves(turn).length) { finish(); return; }
          draw(); turnNow = turn;
          msg(`${pn(skipped)} 無處可下,跳過 ・ 輪到 ${pn(turn)}`);
          return;
        }
        turnNow = turn; draw(); info();
      };
    }
  };

  /* ---------- 轉盤對決 ---------- */
  const wheel = {
    name:"轉盤對決", icon:"🎡", desc:"指針快速轉動,抓時機按停,5 次總分高者勝",
    rules:[
      "轉盤有 8 格分數,有高有低,甚至會扣分。",
      "輪到你時,指針會快速轉動,按「停」鍵停住,指針停在哪格就得幾分。",
      "兩人輪流,每人 5 次。",
      "5 次後總分高者獲勝。"
    ],
    start(){
      const V = [3, -2, 5, 0, 2, -3, 4, 1], ROUNDS = 5;
      const sc = {1:0,2:0}, cnt = {1:0,2:0};
      let turn = 1, pos = 0, spin = true, over = false, last = -1;
      turnNow = 1;
      $("stage").innerHTML = `<div id="pts" style="margin:8px"></div>
        <div id="wh" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:360px;margin:12px auto"></div>
        <button id="stop" style="font-size:1.6rem;padding:14px 48px">🛑 停!</button>`;
      const cells = () => V.map((v, i) =>
        `<div data-w="${i}" style="padding:16px 0;border-radius:12px;font-size:1.6rem;font-weight:900;background:var(--card);color:${v < 0 ? "#ff5d73" : v === 0 ? "#aaa" : "#2ecc71"}">${v > 0 ? "+" : ""}${v}</div>`).join("");
      const paint = (hl, color) => {
        $("wh").innerHTML = cells();
        const d = $("wh").children[hl];
        if (d) { d.style.outline = `4px solid ${color || "#ffd34d"}`; d.style.transform = "scale(1.08)"; }
      };
      const upd = () => $("pts").innerHTML = `${pn(1)} ${sc[1]}(${cnt[1]}/${ROUNDS}) : ${sc[2]}(${cnt[2]}/${ROUNDS}) ${pn(2)}`;
      upd(); paint(0); msg(`輪到 ${pn(turn)},抓時機按「停」!`);
      $("stop").onclick = () => {
        if (!spin || over) return;
        spin = false;
        const i = Math.floor(pos) % 8, v = V[i];
        sc[turn] += v; cnt[turn]++; upd(); paint(i, COL[turn]);
        msg(`${pn(turn)} 停在 ${v > 0 ? "+" : ""}${v}`);
        if (cnt[1] >= ROUNDS && cnt[2] >= ROUNDS) {
          over = true; turnNow = 0;
          later(() => win(sc[1] === sc[2] ? 0 : sc[1] > sc[2] ? 1 : 2, ` (${sc[1]} : ${sc[2]})`), 1000);
          return;
        }
        later(() => {
          turn = 3 - turn; turnNow = turn; spin = true; last = -1;
          msg(`輪到 ${pn(turn)},抓時機按「停」!`);
        }, 1200);
      };
      loop(dt => {
        if (!spin || over) return;
        pos = (pos + dt * (14 + Math.random() * 6)) % 8;
        const i = Math.floor(pos);
        if (i !== last) { last = i; paint(i); }
      });
    }
  };

  /* ---------- 註冊到大廳 ---------- */
  [tetris, othello, wheel].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
