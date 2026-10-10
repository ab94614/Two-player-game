/* ========== 新增小遊戲 4：射擊靶 / 踩地雷對戰 / 打磚塊 ========== */
(function () {
  const COL = { 1:"#ff5d73", 2:"#4da3ff" };
  const BG  = { 1:"rgba(255,93,115,.12)", 2:"rgba(77,163,255,.12)" };

  /* ---------- 射擊靶 ---------- */
  const shoot = {
    name:"射擊靶", icon:"🎯", desc:"靶子會縮小,越早點到分數越高",
    rules:[
      "左邊是玩家1 的靶區,右邊是玩家2 的,兩邊靶子出現的位置一樣。",
      "靶子出現後會慢慢縮小,0.4 秒內點到得 3 分,0.8 秒內 2 分,之後 1 分。",
      "每個靶只能打一次,沒點到就消失。共 20 個靶。",
      "20 個靶結束後,分數高的人獲勝。"
    ],
    start(){
      const N = 20, CY = 1.4, LIFE = 1.2;
      const pos = Array.from({length:N}, () => [rnd(5,90), rnd(5,78)]);
      const pts = {1:0,2:0}, hit = {1:-1,2:-1};
      let el = 0, over = false;
      const panel = p => `<div data-p="${p}" style="flex:1;position:relative;height:280px;border:3px solid ${COL[p]};border-radius:16px;background:${BG[p]};overflow:hidden">
        <button data-p="${p}" data-t="1" style="position:absolute;display:none;border-radius:50%;padding:0;font-size:1.4rem;background:#ffd34d;color:#12141f">🎯</button></div>`;
      $("stage").innerHTML = `<div class="big" id="timer">${Math.ceil(N*CY)}</div>
        <div id="pts" style="margin:6px"></div>
        <div id="sh" style="display:flex;gap:16px">${panel(1)}${panel(2)}</div>`;
      const upd = () => $("pts").innerHTML = `${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`;
      const btn = p => document.querySelector(`#sh button[data-p="${p}"]`);
      upd(); msg("越早點到靶子分數越高!");
      $("sh").onpointerdown = e => {
        const b = e.target.closest("button[data-t]"); if (!b || over) return;
        const p = +b.dataset.p, idx = Math.floor(el / CY), ph = el % CY;
        if (ph >= LIFE || hit[p] === idx) return;
        hit[p] = idx;
        pts[p] += ph < .4 ? 3 : ph < .8 ? 2 : 1;
        b.style.display = "none"; upd();
      };
      loop(dt => {
        if (over) return;
        el += dt;
        const idx = Math.floor(el / CY), ph = el % CY;
        $("timer").textContent = Math.max(0, Math.ceil(N * CY - el));
        if (idx >= N) {
          over = true; $("timer").textContent = 0;
          for (const p of [1,2]) btn(p).style.display = "none";
          win(pts[1] === pts[2] ? 0 : pts[1] > pts[2] ? 1 : 2, ` (${pts[1]} : ${pts[2]})`);
          return;
        }
        const size = Math.round(70 - ph / LIFE * 40);
        const [x, y] = pos[idx];
        for (const p of [1,2]) {
          const b = btn(p);
          if (ph < LIFE && hit[p] !== idx) {
            b.style.display = "block";
            b.style.width = b.style.height = size + "px";
            b.style.left = `calc(${x}% - ${x / 100 * size}px)`;
            b.style.top  = `calc(${y}% - ${y / 100 * size}px)`;
          } else b.style.display = "none";
        }
      });
    }
  };

  /* ---------- 踩地雷對戰 ---------- */
  const mines = {
    name:"踩地雷對戰", icon:"💣", desc:"輪流翻格,踩到地雷的人輸",
    rules:[
      "8×8 棋盤共有 10 顆地雷,兩人共用同一個棋盤,輪流點一格。",
      "數字代表周圍 8 格有幾顆地雷。第一手一定安全。",
      "翻開的格子算在翻的那個人頭上,翻到空白會連鎖展開。",
      "踩到地雷的人直接輸。若所有安全格都翻完,翻開格數多的人獲勝。"
    ],
    start(){
      const N = 8, M = 10, SAFE = N*N - M;
      const mine = Array(N*N).fill(false), cnt = Array(N*N).fill(0), own = Array(N*N).fill(0);
      const got = {1:0,2:0};
      let turn = 1, first = true, over = false, boom = -1;
      turnNow = 1;
      $("stage").innerHTML = '<div id="mg" style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px;max-width:360px;margin:12px auto"></div>';
      const nb = i => {
        const x = i % N, y = (i / N) | 0, r = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N) r.push(ny * N + nx);
        }
        return r;
      };
      const NC = ["", "#4da3ff", "#2ecc71", "#ff5d73", "#8a93ff", "#ffd34d", "#1abc9c", "#fff", "#aaa"];
      const draw = () => {
        $("mg").innerHTML = own.map((o, i) => {
          let t = "", st = "background:var(--card);";
          if (o) {
            st = `background:${o === 1 ? "#5a2a33" : "#223a5c"};`;
            t = cnt[i] ? `<span style="color:${NC[cnt[i]]};font-weight:900">${cnt[i]}</span>` : "";
          } else if (over && mine[i]) {
            st = i === boom ? "background:#c0392b;" : "background:#444;"; t = "💣";
          }
          return `<button data-i="${i}" style="${st}height:40px;padding:0;font-size:1.1rem">${t}</button>`;
        }).join("");
      };
      const info = () => msg(`輪到 ${pn(turn)} ・ ${pn(1)} ${got[1]} : ${got[2]} ${pn(2)}`);
      const place = safeI => {
        const ban = new Set([safeI, ...nb(safeI)]);
        let n = 0;
        while (n < M) {
          const i = Math.floor(rnd(0, N*N));
          if (!mine[i] && !ban.has(i)) { mine[i] = true; n++; }
        }
        for (let i = 0; i < N*N; i++) cnt[i] = nb(i).filter(j => mine[j]).length;
      };
      const reveal = (i, p) => {
        const st = [i];
        while (st.length) {
          const k = st.pop();
          if (own[k] || mine[k]) continue;
          own[k] = p; got[p]++;
          if (cnt[k] === 0) st.push(...nb(k));
        }
      };
      info(); draw();
      $("mg").onclick = e => {
        const b = e.target.closest("button[data-i]"); if (!b || over) return;
        const i = +b.dataset.i; if (own[i]) return;
        if (first) { place(i); first = false; }
        if (mine[i]) {
          over = true; turnNow = 0; boom = i; draw();
          win(3 - turn, ` (${esc(names[turn])} 踩到地雷)`); return;
        }
        reveal(i, turn); draw();
        if (got[1] + got[2] >= SAFE) {
          over = true; turnNow = 0;
          win(got[1] === got[2] ? 0 : got[1] > got[2] ? 1 : 2, ` (${got[1]} : ${got[2]})`); return;
        }
        turn = 3 - turn; turnNow = turn; info();
      };
    }
  };

  /* ---------- 打磚塊 ---------- */
  const bricks = {
    name:"打磚塊", icon:"🧱", desc:"左右兩個小視窗,先清光磚塊者勝",
    rules:[
      "畫面分成左右兩個小視窗,磚塊排列完全一樣。",
      "玩家1 用 A / D 移動擋板,玩家2 用 ← / →(手機點 ◀ ▶)。",
      "球掉出畫面扣 1 條命,每人 3 條命。",
      "先把自己那邊的磚塊全部打光的人獲勝;兩邊都出局則打掉較多磚塊者獲勝。"
    ],
    start(){
      const PW = 300, H = 400, GAP = 20, W = PW*2 + GAP, SP = 300, R = 6, PAD = 64;
      const c = canvas(W, H, ctl(pad(1,[["◀","a"],["▶","d"]]) + pad(2,[["◀","arrowleft"],["▶","arrowright"]])));
      const RC = ["#ff5d73","#ff9f4d","#ffd34d","#2ecc71","#4da3ff"];
      const keys = { 1:["a","d"], 2:["arrowleft","arrowright"] };
      const S = {};
      for (const p of [1,2]) S[p] = { x:PW/2, bx:PW/2, by:H-42, vx:0, vy:0, hp:3, wait:1, br:Array(30).fill(true), sc:0, alive:true };
      let over = false;
      const info = () => msg(`${pn(1)} 磚 ${S[1].sc}/30 ❤️${S[1].hp} ・ ${pn(2)} 磚 ${S[2].sc}/30 ❤️${S[2].hp}`);
      info();
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          s.br.forEach((a, i) => {
            if (!a) return;
            c.fillStyle = RC[(i / 6) | 0];
            c.fillRect((i % 6) * 50 + 1, 40 + ((i / 6) | 0) * 16 + 1, 48, 14);
          });
          if (s.alive) {
            c.fillStyle = COL[p]; c.fillRect(s.x - PAD/2, H - 30, PAD, 10);
            c.fillStyle = "#fff"; c.beginPath(); c.arc(s.bx, s.by, R, 0, 7); c.fill();
          } else {
            c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(0, 0, PW, H);
            c.fillStyle = "#fff"; c.font = "bold 32px sans-serif"; c.fillText("出局", PW/2, H/2);
          }
          c.restore();
        }
        c.strokeStyle = "#3a4070"; c.lineWidth = 2;
        c.strokeRect(1, 1, PW-2, H-2); c.strokeRect(PW+GAP+1, 1, PW-2, H-2);
      };
      draw();
      loop(dt => {
        if (over) return;
        let changed = false;
        for (const p of [1,2]) {
          const s = S[p]; if (!s.alive) continue;
          const dir = (K[keys[p][1]] ? 1 : 0) - (K[keys[p][0]] ? 1 : 0);
          s.x = clamp(s.x + dir * 320 * dt, PAD/2, PW - PAD/2);
          if (s.wait > 0) {
            s.wait -= dt; s.bx = s.x; s.by = H - 42;
            if (s.wait <= 0) { s.vx = rnd(-120, 120); s.vy = -Math.sqrt(SP*SP - s.vx*s.vx); }
            continue;
          }
          for (let k = 0; k < 2; k++) {
            const h = dt / 2;
            s.bx += s.vx * h; s.by += s.vy * h;
            if (s.bx < R)    { s.bx = R;    s.vx =  Math.abs(s.vx); }
            if (s.bx > PW-R) { s.bx = PW-R; s.vx = -Math.abs(s.vx); }
            if (s.by < R)    { s.by = R;    s.vy =  Math.abs(s.vy); }
            if (s.vy > 0 && s.by + R >= H - 30 && s.by < H - 20 && Math.abs(s.bx - s.x) <= PAD/2 + R) {
              const off = clamp((s.bx - s.x) / (PAD/2), -1, 1);
              s.vx = off * 220; s.vy = -Math.sqrt(SP*SP - s.vx*s.vx); s.by = H - 30 - R;
            }
            const col = Math.floor(s.bx / 50), row = Math.floor((s.by - 40) / 16);
            if (row >= 0 && row < 5 && col >= 0 && col < 6 && s.br[row*6 + col]) {
              s.br[row*6 + col] = false; s.sc++; s.vy = -s.vy; changed = true;
            }
            if (s.by > H + R) {
              s.hp--; changed = true;
              if (s.hp <= 0) s.alive = false; else { s.wait = 1; s.vx = s.vy = 0; }
              break;
            }
          }
        }
        if (changed) info();
        for (const p of [1,2]) if (S[p].sc >= 30) { over = true; draw(); win(p, " (清光磚塊)"); return; }
        if (!S[1].alive && !S[2].alive) {
          over = true; draw();
          win(S[1].sc === S[2].sc ? 0 : S[1].sc > S[2].sc ? 1 : 2, ` (${S[1].sc} : ${S[2].sc} 磚)`);
          return;
        }
        draw();
      });
    }
  };

  /* ---------- 註冊到大廳 ---------- */
  [shoot, mines, bricks].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
