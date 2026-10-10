/* ========== 新增小遊戲 12:套圈圈 / 夾娃娃機 / 取石子 / 點格棋 ========== */
(function () {
  const COL = { 1:"#ff5d73", 2:"#4da3ff" };
  const setTurn = t => { try { turnNow = t; } catch (e) {} };
  const mk = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const PW = 300, GAP = 20, W = PW * 2 + GAP;
  const tri = x => Math.abs(((x % 2) + 2) % 2 - 1);
  const EM = { 1:"🍬", 2:"🎁", 3:"🏆", 5:"💎" };

  /* ---------- 套圈圈 ---------- */
  const ring = {
    name:"套圈圈", icon:"🎪", desc:"鎖定左右與遠近,把圈圈套中獎品",
    rules:[
      "左右各一個攤位,獎品位置完全相同,越遠的獎品分數越高。",
      "玩家1 按 S,玩家2 按 ↓(手機按「丟」)。第一次按鎖定左右,第二次按鎖定遠近。",
      "圈圈落點要靠近獎品才算套中,已套中的獎品不能再套。",
      "每人 6 圈,總分高者獲勝。"
    ],
    start(){
      const H = 420, T = 6, Y0 = 70, Y1 = 330;
      const c = canvas(W, H, ctl(pad(1,[["丟","s"]]) + pad(2,[["丟","arrowdown"]])));
      const rng = mk(Date.now() & 0xffffff);
      const pr = []; let tries = 0;
      while (pr.length < 6 && tries++ < 500) {
        const x = 40 + rng() * (PW - 80), y = 100 + rng() * 190;
        if (pr.every(q => Math.hypot(q.x - x, q.y - y) > 52)) pr.push({ x, y, v: y < 150 ? 5 : y < 200 ? 3 : y < 250 ? 2 : 1 });
      }
      const spd = Array.from({length:T}, (_, i) => ({ x:.7 + rng() * .6 + i * .05, y:.8 + rng() * .6 + i * .05 }));
      const mkS = () => ({ n:0, sc:0, ph:0, t:0, x:0, land:[], w:0, taken:pr.map(() => false) });
      const S = { 1:mkS(), 2:mkS() };
      let over = false;
      const cur = s => { const q = spd[Math.min(s.n, T - 1)]; return [20 + (PW - 40) * tri(s.t * q.x), Y0 + (Y1 - Y0) * tri(s.t * q.y)]; };
      const KM = { s:1, arrowdown:2 };
      keyHandler = e => {
        const p = KM[e.key.toLowerCase()]; if (!p || e.repeat || over) return;
        if (e.key.startsWith("Arrow")) e.preventDefault();
        const s = S[p]; if (s.n >= T) return;
        if (s.ph === 0) { s.x = cur(s)[0]; s.ph = 1; s.t = 0; }
        else if (s.ph === 1) {
          const y = cur(s)[1]; let v = 0, bi = -1, bd = 22;
          pr.forEach((q, i) => { const d = Math.hypot(s.x - q.x, y - q.y); if (!s.taken[i] && d < bd) { bd = d; bi = i; } });
          if (bi >= 0) { s.taken[bi] = true; v = pr[bi].v; }
          s.land.push({ x:s.x, y, v }); s.sc += v; s.n++; s.ph = 2; s.w = .7;
        }
      };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.fillStyle = "#3a2a1a"; c.fillRect(10, 50, PW - 20, 300);
          c.textAlign = "center"; c.font = "28px sans-serif";
          pr.forEach((q, i) => {
            c.globalAlpha = s.taken[i] ? .3 : 1; c.fillText(EM[q.v], q.x, q.y + 10);
            c.globalAlpha = 1; c.font = "bold 12px sans-serif"; c.fillStyle = "#fff"; c.fillText(q.v, q.x, q.y + 28); c.font = "28px sans-serif";
          });
          c.lineWidth = 3;
          for (const l of s.land) { c.strokeStyle = l.v ? COL[p] : "#777"; c.beginPath(); c.arc(l.x, l.y, 18, 0, 7); c.stroke(); }
          if (s.n < T && s.ph < 2) {
            const [x, y] = cur(s); const px = s.ph === 0 ? x : s.x, py = s.ph === 0 ? 385 : y;
            c.strokeStyle = "#ffd34d"; c.beginPath(); c.arc(px, py, 18, 0, 7); c.stroke();
            c.strokeStyle = "#ffd34d55"; c.lineWidth = 1; c.beginPath(); c.moveTo(px, 50); c.lineTo(px, 400); c.stroke();
          }
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left"; c.fillText(names[p], 8, 22);
          c.textAlign = "right"; c.fillText(`${s.sc} 分`, PW - 8, 22);
          c.textAlign = "center"; c.fillText(`剩 ${T - s.n} 圈`, PW / 2, H - 6);
          c.strokeStyle = COL[p]; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      msg("先鎖左右,再鎖遠近!");
      loop(dt => {
        if (over) return;
        for (const p of [1,2]) {
          const s = S[p]; s.t += dt;
          if (s.ph === 2) { s.w -= dt; if (s.w <= 0) { s.ph = 0; s.t = 0; } }
        }
        draw();
        msg(`${pn(1)} ${S[1].sc} : ${S[2].sc} ${pn(2)}`);
        if (S[1].n >= T && S[2].n >= T) {
          over = true; win(S[1].sc === S[2].sc ? 0 : S[1].sc > S[2].sc ? 1 : 2, ` (${S[1].sc} : ${S[2].sc})`);
        }
      });
    }
  };

    /* ---------- 夾娃娃機 ---------- */
  const claw = {
    name:"夾娃娃機", icon:"🕹️", desc:"獎品會移動,爪子要抓準時機,還可能中途掉落",
    rules:[
      "左右各一台娃娃機,獎品排列、移動方式、掉落結果完全相同。",
      "獎品會左右移動,分數越高的獎品越小、越難夾,也越容易在升起時掉落。",
      "爪子會左右擺動。玩家1 按 S,玩家2 按 ↓(手機按「夾」),爪子在當下位置下降。",
      "爪子下方有獎品才夾得到,但升起時可能掉落,掉了就沒分。",
      "每人 6 次,總分高者獲勝。"
    ],
    start(){
      const H = 440, T = 6, TOP = 60, BOT = 340;
      const c = canvas(W, H, ctl(pad(1,[["夾","s"]]) + pad(2,[["夾","arrowdown"]])));
      const rng = mk(Date.now() & 0xffffff);
      const RAD = { 1:26, 2:22, 3:18, 5:12 }, DROP = { 1:.05, 2:.15, 3:.25, 5:.4 };
      const vals = [1,1,2,2,3,5].sort(() => rng() - .5);
      const pr = vals.map((v, i) => ({ v, b:30 + i * 48, a:20 + rng() * 25, f:.5 + rng() * .9, ph:rng() * 6 }));
      const px = (q, t) => clamp(q.b + Math.sin(t * q.f + q.ph) * q.a, 20, PW - 20);
      const spd = Array.from({length:T}, (_, i) => 1.1 + rng() * .8 + i * .08);
      const dr = Array.from({length:T}, () => rng());
      const mkS = () => ({ n:0, sc:0, ph:0, t:0, x:0, cy:TOP, carry:null, ci:-1, taken:pr.map(() => false), msgT:0, msg:"" });
      const S = { 1:mkS(), 2:mkS() };
      let over = false, gt = 0;
      const swing = s => 25 + (PW - 50) * tri(s.t * spd[Math.min(s.n, T - 1)]);
      const KM = { s:1, arrowdown:2 };
      keyHandler = e => {
        const p = KM[e.key.toLowerCase()]; if (!p || e.repeat || over) return;
        if (e.key.startsWith("Arrow")) e.preventDefault();
        const s = S[p]; if (s.n >= T || s.ph !== 0) return;
        s.x = swing(s); s.ph = 1;
      };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.fillStyle = "#1c2036"; c.fillRect(8, 40, PW - 16, 350);
          c.fillStyle = "#555"; c.fillRect(8, 40, PW - 16, 8);
          c.textAlign = "center";
          pr.forEach((q, i) => {
            if (s.taken[i]) return;
            const x = px(q, gt);
            c.font = (q.v >= 5 ? 22 : q.v >= 3 ? 25 : 28) + "px sans-serif"; c.fillStyle = "#fff";
            c.fillText(EM[q.v], x, 372);
            c.font = "bold 12px sans-serif"; c.fillText(q.v, x, 392);
          });
          const x = s.ph === 0 ? swing(s) : s.x;
          c.strokeStyle = "#aaa"; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 44); c.lineTo(x, s.cy); c.stroke();
          c.strokeStyle = COL[p]; c.lineWidth = 4; c.beginPath();
          c.moveTo(x - 16, s.cy + 14); c.lineTo(x - 12, s.cy); c.lineTo(x + 12, s.cy); c.lineTo(x + 16, s.cy + 14); c.stroke();
          if (s.carry) { c.font = "26px sans-serif"; c.fillText(s.carry, x, s.cy + 32); }
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left"; c.fillText(names[p], 8, 22);
          c.textAlign = "right"; c.fillText(`${s.sc} 分`, PW - 8, 22);
          c.textAlign = "center"; c.fillText(`剩 ${T - s.n} 次`, PW / 2, 414);
          if (s.msgT > 0) { c.fillStyle = "#ffd34d"; c.font = "bold 18px sans-serif"; c.fillText(s.msg, PW / 2, 215); }
          c.strokeStyle = COL[p]; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      msg("獎品會動,抓準時機!");
      loop(dt => {
        if (over) return;
        gt += dt;
        for (const p of [1,2]) {
          const s = S[p]; s.t += dt; s.msgT -= dt;
          if (s.ph === 1) {
            s.cy += 320 * dt;
            if (s.cy >= BOT) {
              s.cy = BOT; let bi = -1, bd = 99;
              pr.forEach((q, i) => {
                if (s.taken[i]) return;
                const d = Math.abs(px(q, gt) - s.x);
                if (d < RAD[q.v] && d < bd) { bd = d; bi = i; }
              });
              if (bi >= 0) { s.ci = bi; s.carry = EM[pr[bi].v]; }
              else { s.msg = "夾空了!"; s.msgT = 1; }
              s.ph = 2;
            }
          } else if (s.ph === 2) {
            s.cy -= 320 * dt;
            if (s.ci >= 0 && s.cy < 200) {
              const q = pr[s.ci];
              if (dr[Math.min(s.n, T - 1)] < DROP[q.v]) { s.msg = "掉了!"; s.msgT = 1; s.carry = null; s.ci = -1; }
            }
            if (s.cy <= TOP) {
              s.cy = TOP;
              if (s.ci >= 0) { s.taken[s.ci] = true; s.sc += pr[s.ci].v; s.msg = "+" + pr[s.ci].v; s.msgT = 1; }
              s.carry = null; s.ci = -1; s.n++; s.ph = 0; s.t = 0;
            }
          }
        }
        draw();
        msg(`${pn(1)} ${S[1].sc} : ${S[2].sc} ${pn(2)}`);
        if (S[1].n >= T && S[2].n >= T) {
          over = true; win(S[1].sc === S[2].sc ? 0 : S[1].sc > S[2].sc ? 1 : 2, ` (${S[1].sc} : ${S[2].sc})`);
        }
      });
    }
  };


  /* ---------- 取石子 (Nim) ---------- */
  const nim = {
    name:"取石子", icon:"💎", desc:"輪流取石子,拿走最後一顆者勝",
    rules:[
      "桌上有 3 堆石子,分別是 3、5、7 顆。",
      "輪流點一顆石子,會拿走「該堆中這顆和它右邊所有的石子」。",
      "每回合只能從同一堆拿,至少拿 1 顆。",
      "拿走最後一顆石子的人獲勝。"
    ],
    start(){
      const heaps = [3, 5, 7]; let turn = 1, over = false;
      const draw = () => {
        setTurn(over ? 0 : turn);
        $("stage").innerHTML = `<div id="nimw" style="max-width:420px;margin:16px auto;text-align:center">
          <div style="margin-bottom:10px;font-weight:900;color:${COL[turn]}">${over ? "" : "輪到 " + pn(turn)}</div>
          ${heaps.map((n, h) => `<div style="margin:10px 0;min-height:52px">${n === 0 ? `<span style="opacity:.3">(空)</span>` :
            Array.from({length:n}, (_, i) => `<button data-h="${h}" data-i="${i}" style="font-size:1.6rem;margin:3px;padding:6px 10px;background:var(--card)">💎</button>`).join("")}</div>`).join("")}</div>`;
        if (!over) $("nimw").onclick = e => {
          const b = e.target.closest("button[data-h]"); if (!b || over) return;
          const h = +b.dataset.h, i = +b.dataset.i;
          heaps[h] = i;
          if (heaps.every(x => x === 0)) { over = true; draw(); win(turn, " 拿走了最後一顆!"); return; }
          turn = 3 - turn; draw(); msg(`輪到 ${pn(turn)}`);
        };
      };
      msg(`輪到 ${pn(1)}`); draw();
    }
  };

  /* ---------- 點格棋 ---------- */
  const dots = {
    name:"點格棋", icon:"🔲", desc:"輪流連線,封住格子就佔領",
    rules:[
      "5×5 個點,形成 4×4 共 16 格。雙方輪流點一條線。",
      "如果你的這條線讓某一格四邊都封住,該格歸你,而且你可以再走一步。",
      "沒有封住任何格子,就換對手。",
      "線全部畫完後,佔最多格的人獲勝。"
    ],
    start(){
      const N = 4;
      const hE = Array.from({length:N + 1}, () => Array(N).fill(0));
      const vE = Array.from({length:N}, () => Array(N + 1).fill(0));
      const bo = Array.from({length:N}, () => Array(N).fill(0));
      const sc = { 1:0, 2:0 }; let turn = 1, over = false, left = N * N;
      const full = (r, c) => hE[r][c] && hE[r + 1][c] && vE[r][c] && vE[r][c + 1];
      const lines = Array(2 * N + 1).fill(0).map((_, i) => i % 2 ? "48px" : "12px").join(" ");
      const draw = () => {
        setTurn(over ? 0 : turn);
        let h = "";
        for (let gr = 0; gr <= 2 * N; gr++) for (let gc = 0; gc <= 2 * N; gc++) {
          if (gr % 2 === 0 && gc % 2 === 0) h += `<div style="background:#fff;border-radius:50%"></div>`;
          else if (gr % 2 === 0) {
            const r = gr / 2, c = (gc - 1) / 2, o = hE[r][c];
            h += `<div data-t="h" data-r="${r}" data-c="${c}" style="background:${o ? COL[o] : "#2a2f4d"};cursor:${o ? "default" : "pointer"};border-radius:4px"></div>`;
          } else if (gc % 2 === 0) {
            const r = (gr - 1) / 2, c = gc / 2, o = vE[r][c];
            h += `<div data-t="v" data-r="${r}" data-c="${c}" style="background:${o ? COL[o] : "#2a2f4d"};cursor:${o ? "default" : "pointer"};border-radius:4px"></div>`;
          } else {
            const o = bo[(gr - 1) / 2][(gc - 1) / 2];
            h += `<div style="background:${o ? COL[o] + "88" : "transparent"};display:flex;align-items:center;justify-content:center;font-weight:900">${o ? (o === 1 ? "1" : "2") : ""}</div>`;
          }
        }
        $("stage").innerHTML = `<div style="text-align:center;margin:10px 0;font-weight:900;color:${COL[turn]}">${over ? "" : "輪到 " + pn(turn)} ・ ${pn(1)} ${sc[1]} : ${sc[2]} ${pn(2)}</div>
          <div id="dtw" style="display:grid;grid-template-columns:${lines};grid-template-rows:${lines};width:max-content;margin:0 auto">${h}</div>`;
        $("dtw").onclick = e => {
          const d = e.target.closest("[data-t]"); if (!d || over) return;
          const t = d.dataset.t, r = +d.dataset.r, c = +d.dataset.c;
          const E = t === "h" ? hE : vE;
          if (E[r][c]) return;
          E[r][c] = turn;
          const cand = t === "h" ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]];
          let got = 0;
          for (const [br, bc] of cand) {
            if (br < 0 || bc < 0 || br >= N || bc >= N || bo[br][bc]) continue;
            if (full(br, bc)) { bo[br][bc] = turn; sc[turn]++; left--; got++; }
          }
          if (left === 0) { over = true; draw(); msg(`${pn(1)} ${sc[1]} : ${sc[2]} ${pn(2)}`); win(sc[1] === sc[2] ? 0 : sc[1] > sc[2] ? 1 : 2, ` (${sc[1]} : ${sc[2]})`); return; }
          if (!got) turn = 3 - turn;
          draw(); msg(`輪到 ${pn(turn)} ・ ${sc[1]} : ${sc[2]}`);
        };
      };
      msg(`輪到 ${pn(1)}`); draw();
    }
  };
  
  [ring, claw, nim, dots].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); setTurn(0); s.call(g); };
    games.push(g);
  });

  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
