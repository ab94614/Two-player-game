/* ========== 新增小遊戲 13:猜數字密碼 / 海盜寶藏 / 撈乒乓球 / 打彈珠 / 賓果 ========== */
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
  const panel = (p, pre) => `<div style="flex:1;max-width:320px;padding:8px;border:3px solid ${COL[p]};border-radius:14px">
    <div id="${pre}i${p}" style="font-weight:900;margin-bottom:6px"></div>
    <div id="${pre}b${p}"></div></div>`;
  const result = (a, b) => a === b ? 0 : a > b ? 1 : 2;

    /* ---------- 猜數字密碼 ---------- */
  const bulls = {
    name:"猜數字密碼", icon:"🔢", desc:"猜 4 位不重複密碼,看 A、B 提示推理",
    rules:[
      "左右是同一組 4 位數密碼,每個數字 0~9 都不重複。各有 8 次機會。",
      "用自己那一側的數字鍵盤輸入 4 個數字,按「送出」。",
      "A:數字和位置都對。B:數字有,但位置不對。例如 1A2B。",
      "先猜出密碼者獲勝,雙方都沒猜中則平手。"
    ],
    start(){
      const ans = "0123456789".split("").sort(() => Math.random() - .5).slice(0, 4).join("");
      const G = { 1:[], 2:[] }, cur = { 1:"", 2:"" }, done = { 1:false, 2:false };
      let over = false;
      const grade = g => {
        let a = 0, b = 0;
        for (let i = 0; i < 4; i++) { if (g[i] === ans[i]) a++; else if (ans.includes(g[i])) b++; }
        return [a, b];
      };
      const KEYS = ["1","2","3","4","5","6","7","8","9","刪","0","送"];
      const panelHTML = p => {
        let rows = "";
        for (let r = 0; r < 8; r++) {
          const g = G[p][r];
          rows += `<div style="display:flex;gap:6px;margin-bottom:3px;align-items:center">
            <div style="flex:1;height:30px;line-height:30px;text-align:center;font-weight:900;letter-spacing:6px;border-radius:6px;background:var(--card)">${g || ""}</div>
            <div style="width:64px;font-weight:900;color:#ffd34d">${g ? grade(g).join("A") + "B" : ""}</div></div>`;
        }
        const inp = done[p] || over ? "" : `
          <div style="text-align:center;font-size:1.4rem;font-weight:900;letter-spacing:8px;height:36px;line-height:36px;margin-top:6px;border:2px dashed ${COL[p]};border-radius:8px">${cur[p] || "&nbsp;"}</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:6px">${KEYS.map(k =>
            `<button data-k="${k}" style="padding:10px 0;font-weight:900">${k === "送" ? "送出" : k}</button>`).join("")}</div>`;
        return `<div data-p="${p}" style="flex:1;max-width:320px;padding:8px;border:3px solid ${COL[p]};border-radius:14px">
          <div style="font-weight:900;margin-bottom:6px">${pn(p)} ・ ${G[p].length}/8</div>${rows}${inp}</div>`;
      };
      const draw = () => { $("bcw").innerHTML = panelHTML(1) + panelHTML(2); };
      $("stage").innerHTML = `<div id="bcw" style="display:flex;gap:14px;justify-content:center;margin:10px auto"></div>`;
      $("bcw").onclick = e => {
        const b = e.target.closest("button[data-k]"); if (!b || over) return;
        const p = +b.closest("[data-p]").dataset.p;
        if (done[p]) return;
        // 連線時,房主本人不能操作玩家2的鍵盤(朋友的點擊是程式送出的,isTrusted 為 false)
        if (p === 2 && e.isTrusted && typeof isOnline === "function" && isOnline()) return;
        const k = b.dataset.k;
        if (k === "刪") cur[p] = cur[p].slice(0, -1);
        else if (k === "送") {
          if (cur[p].length < 4) { msg("請先輸入 4 個數字"); return; }
          const v = cur[p]; G[p].push(v); cur[p] = "";
          if (v === ans) { over = true; draw(); win(p, ` (密碼 ${ans})`); return; }
          if (G[p].length >= 8) done[p] = true;
          if (done[1] && done[2]) { over = true; draw(); win(0, ` (密碼 ${ans})`); return; }
        }
        else if (cur[p].length < 4 && !cur[p].includes(k)) cur[p] += k;
        draw();
      };
      draw(); msg("先猜出密碼的人獲勝!");
    }
  };


  /* ---------- 海盜寶藏 ---------- */
  const pirate = {
    name:"海盜寶藏", icon:"🏴‍☠️", desc:"輪流挖寶,看提示數字推理位置",
    rules:[
      "6×6 的島上藏著 8 個寶藏(1、1、1、1、2、2、3、5 分)和 4 顆炸彈。",
      "輪流點一格挖掘。空地會顯示「周圍 8 格有幾個寶藏」,0 代表附近沒寶藏。",
      "挖到寶藏得分,並且可以再挖一次。挖到空地則換人。",
      "挖到炸彈扣 2 分,並換人。寶藏全部被挖出後,分高者獲勝。"
    ],
    start(){
      const N = 6, cells = Array(N * N).fill(null), opened = Array(N * N).fill(false);
      const idx = [...Array(N * N).keys()].sort(() => Math.random() - .5);
      [1,1,1,1,2,2,3,5].forEach((v, i) => { cells[idx[i]] = { t:"T", v }; });
      for (let i = 8; i < 12; i++) cells[idx[i]] = { t:"B" };
      const hint = i => {
        let n = 0; const r = Math.floor(i / N), c = i % N;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if ((dr || dc) && rr >= 0 && cc >= 0 && rr < N && cc < N && cells[rr * N + cc] && cells[rr * N + cc].t === "T") n++;
        }
        return n;
      };
      const EM = { 1:"💰", 2:"🎁", 3:"🏆", 5:"💎" };
      const sc = { 1:0, 2:0 }; let turn = 1, left = 8, over = false, log = "";
      const draw = () => {
        setTurn(over ? 0 : turn);
        let h = "";
        for (let i = 0; i < N * N; i++) {
          const c = cells[i];
          let txt = "", bg = "var(--card)";
          if (opened[i]) {
            bg = "#1a1d30";
            txt = c ? (c.t === "T" ? EM[c.v] : "💣") : `<b style="color:${["#888","#4da3ff","#3ddc84","#ffd34d","#ff8a3d","#ff5d73","#c77dff","#fff","#fff"][hint(i)]}">${hint(i)}</b>`;
          }
          h += `<button data-i="${i}" style="width:100%;aspect-ratio:1;font-size:1.4rem;padding:0;background:${bg}">${txt}</button>`;
        }
        $("stage").innerHTML = `<div style="text-align:center;margin:10px 0;font-weight:900;color:${COL[turn]}">${over ? "" : "輪到 " + pn(turn)} ・ ${pn(1)} ${sc[1]} : ${sc[2]} ${pn(2)} ・ 剩 ${left} 個寶藏</div>
          <div style="text-align:center;min-height:1.6em;margin-bottom:6px">${log}</div>
          <div id="pig" style="display:grid;grid-template-columns:repeat(${N},1fr);gap:4px;max-width:340px;margin:0 auto">${h}</div>`;
        $("pig").onclick = e => {
          const b = e.target.closest("button[data-i]"); if (!b || over) return;
          const i = +b.dataset.i; if (opened[i]) return;
          opened[i] = true; const c = cells[i];
          if (c && c.t === "T") { sc[turn] += c.v; left--; log = `${pn(turn)} 挖到 ${EM[c.v]} +${c.v},再挖一次!`; }
          else if (c) { sc[turn] -= 2; log = `${pn(turn)} 踩到炸彈 -2,換人`; turn = 3 - turn; }
          else { log = `${pn(turn)} 挖到空地,換人`; turn = 3 - turn; }
          if (left === 0) {
            over = true; draw(); msg(`${sc[1]} : ${sc[2]}`);
            win(result(sc[1], sc[2]), ` (${sc[1]} : ${sc[2]})`); return;
          }
          draw(); msg(`輪到 ${pn(turn)} ・ ${sc[1]} : ${sc[2]}`);
        };
      };
      msg(`輪到 ${pn(1)}`); draw();
    }
  };

  /* ---------- 撈乒乓球 ---------- */
  const pong = {
    name:"撈乒乓球", icon:"🏓", desc:"球在池裡漂,預判位置放網撈起來",
    rules:[
      "左右兩個池子,球的位置完全相同。白球 1 分、橘球 2 分、金球 5 分(越小越快)。",
      "玩家1:A/D 移動、W 撈。玩家2:←/→ 移動、↑ 撈。",
      "按撈之後網子會花 0.25 秒下水,下水瞬間網內的球才算撈到,所以要預判。撈完有冷卻。",
      "被撈走的球 3 秒後會重新出現。30 秒後分高者獲勝。"
    ],
    start(){
      const H = 400, LIM = 30;
      const c = canvas(W, H, ctl(pad(1,[["◀","a"],["▶","d"],["撈","w"]]) + pad(2,[["◀","arrowleft"],["▶","arrowright"],["撈","arrowup"]])));
      const rng = mk(Date.now() & 0xffffff);
      const balls = Array.from({length:9}, (_, i) => {
        const k = i < 4 ? 0 : i < 7 ? 1 : 2;
        return { v:[1,2,5][k], r:[16,13,10][k], sp:[45,80,120][k] + rng() * 20, dir:rng() < .5 ? -1 : 1, x0:rng() * PW, y:170 + (i % 3) * 50, ph:rng() * 6 };
      });
      const bx = b => (((b.x0 + b.dir * b.sp * gt) % PW) + PW) % PW;
      const BC = { 1:"#f4f4f4", 2:"#ff9a3d", 5:"#ffd34d" };
      const mkS = () => ({ x:PW / 2, sc:0, dip:-1, cd:0, back:balls.map(() => 0), fx:[] });
      const S = { 1:mkS(), 2:mkS() };
      const keys = { 1:["a","d"], 2:["arrowleft","arrowright"] };
      let gt = 0, over = false;
      const KM = { w:1, arrowup:2 };
      keyHandler = e => {
        const p = KM[e.key.toLowerCase()]; if (!p || e.repeat || over) return;
        if (e.key.startsWith("Arrow")) e.preventDefault();
        const s = S[p]; if (s.cd > 0) return; s.dip = .25; s.cd = .9;
      };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.fillStyle = "#1c5a8a"; c.fillRect(8, 140, PW - 16, 170);
          c.textAlign = "center";
          balls.forEach((b, i) => {
            if (gt < s.back[i]) return;
            const x = bx(b), y = b.y + Math.sin(gt * 2 + b.ph) * 5;
            c.fillStyle = BC[b.v]; c.beginPath(); c.arc(x, y, b.r, 0, 7); c.fill();
            c.fillStyle = "#222"; c.font = "bold 12px sans-serif"; c.fillText(b.v, x, y + 4);
          });
          for (const f of s.fx) { c.globalAlpha = Math.max(0, f.t * 2); c.fillStyle = "#fff"; c.font = "bold 20px sans-serif"; c.fillText(f.txt, f.x, f.y); }
          c.globalAlpha = 1;
          const ny = s.dip > 0 ? 80 + (1 - s.dip / .25) * 120 : 80;
          c.strokeStyle = "#aaa"; c.lineWidth = 3; c.beginPath(); c.moveTo(s.x, 60); c.lineTo(s.x, ny); c.stroke();
          c.fillStyle = COL[p] + "aa"; c.strokeStyle = COL[p]; c.beginPath(); c.arc(s.x, ny + 6, 28, 0, Math.PI); c.fill(); c.stroke();
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left"; c.fillText(names[p], 8, 22);
          c.textAlign = "right"; c.fillText(`${s.sc} 分`, PW - 8, 22);
          c.strokeStyle = "#3a4070"; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      draw();
      loop(dt => {
        if (over) return;
        gt += dt;
        for (const p of [1,2]) {
          const s = S[p], k = keys[p];
          s.x = clamp(s.x + ((K[k[1]] ? 1 : 0) - (K[k[0]] ? 1 : 0)) * 280 * dt, 30, PW - 30);
          s.cd -= dt; s.fx = s.fx.filter(f => { f.t -= dt; f.y -= 30 * dt; return f.t > 0; });
          if (s.dip > 0) {
            s.dip -= dt;
            if (s.dip <= 0) {
              let got = 0;
              balls.forEach((b, i) => {
                if (gt >= s.back[i] && Math.abs(bx(b) - s.x) < 28 + b.r * .3) { got += b.v; s.back[i] = gt + 3; }
              });
              s.sc += got; s.fx.push({ x:s.x, y:130, t:.6, txt:got ? "+" + got : "空網" });
            }
          }
        }
        draw();
        msg(`${pn(1)} ${S[1].sc} : ${S[2].sc} ${pn(2)} ・ 剩 ${Math.max(0, Math.ceil(LIM - gt))} 秒`);
        if (gt >= LIM) { over = true; win(result(S[1].sc, S[2].sc), ` (${S[1].sc} : ${S[2].sc})`); }
      });
    }
  };

  /* ---------- 打彈珠 ---------- */
  const marble = {
    name:"打彈珠", icon:"🔵", desc:"鎖角度、鎖力道,彈珠滑到靶心附近",
    rules:[
      "左右各一個靶區,中心 5 分,往外依序是 3、2、1 分。",
      "玩家1 按 S,玩家2 按 ↓(手機按「彈」)。第一次按鎖定角度,第二次按鎖定力道。",
      "彈珠會一邊滑行一邊減速,碰到牆會反彈,停下的位置決定得分。",
      "每人 6 顆,總分高者獲勝。"
    ],
    start(){
      const H = 420, T = 6, CX = 150, CY = 120, SX = 150, SY = 380;
      const c = canvas(W, H, ctl(pad(1,[["彈","s"]]) + pad(2,[["彈","arrowdown"]])));
      const rng = mk(Date.now() & 0xffffff);
      const sa = Array.from({length:T}, (_, i) => .8 + rng() * .6 + i * .05);
      const sp = Array.from({length:T}, (_, i) => .9 + rng() * .7 + i * .05);
      const mkS = () => ({ n:0, sc:0, ph:0, t:0, ang:0, pw:0, land:[], m:null, w:0 });
      const S = { 1:mkS(), 2:mkS() };
      let over = false;
      const ang = s => (tri(s.t * sa[Math.min(s.n, T - 1)]) * 2 - 1) * 35 * Math.PI / 180;
      const pw = s => tri(s.t * sp[Math.min(s.n, T - 1)]);
      const KM = { s:1, arrowdown:2 };
      keyHandler = e => {
        const p = KM[e.key.toLowerCase()]; if (!p || e.repeat || over) return;
        if (e.key.startsWith("Arrow")) e.preventDefault();
        const s = S[p]; if (s.n >= T) return;
        if (s.ph === 0) { s.ang = ang(s); s.ph = 1; s.t = 0; }
        else if (s.ph === 1) {
          s.pw = pw(s); const v = 220 + s.pw * 230;
          s.m = { x:SX, y:SY, vx:v * Math.sin(s.ang), vy:-v * Math.cos(s.ang) }; s.ph = 2;
        }
      };
      const zone = (x, y) => { const d = Math.hypot(x - CX, y - CY); return d < 15 ? 5 : d < 40 ? 3 : d < 70 ? 2 : d < 100 ? 1 : 0; };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.fillStyle = "#1a3a2a"; c.fillRect(10, 30, PW - 20, 370);
          [[100,"#2e6b4a"],[70,"#3a8a5e"],[40,"#4fae78"],[15,"#ffd34d"]].forEach(([r, col]) => { c.fillStyle = col; c.beginPath(); c.arc(CX, CY, r, 0, 7); c.fill(); });
          c.fillStyle = "#123"; c.font = "bold 12px sans-serif"; c.textAlign = "center";
          c.fillText("1", CX, CY - 85); c.fillText("2", CX, CY - 55); c.fillText("3", CX, CY - 25); c.fillText("5", CX, CY + 4);
          for (const l of s.land) { c.fillStyle = l.v ? COL[p] : "#777"; c.beginPath(); c.arc(l.x, l.y, 7, 0, 7); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 1; c.stroke(); }
          if (s.n < T) {
            if (s.ph < 2) {
              const a = s.ph === 0 ? ang(s) : s.ang;
              c.strokeStyle = "#ffd34d"; c.lineWidth = 2; c.setLineDash([6, 6]);
              c.beginPath(); c.moveTo(SX, SY); c.lineTo(SX + Math.sin(a) * 260, SY - Math.cos(a) * 260); c.stroke(); c.setLineDash([]);
              c.fillStyle = COL[p]; c.beginPath(); c.arc(SX, SY, 7, 0, 7); c.fill();
              if (s.ph === 1) {
                c.fillStyle = "#222"; c.fillRect(20, 395, PW - 40, 8);
                c.fillStyle = "#ffd34d"; c.fillRect(20, 395, (PW - 40) * pw(s), 8);
              }
            } else if (s.m) { c.fillStyle = COL[p]; c.beginPath(); c.arc(s.m.x, s.m.y, 7, 0, 7); c.fill(); }
          }
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left"; c.fillText(names[p], 8, 22);
          c.textAlign = "right"; c.fillText(`${s.sc} 分`, PW - 8, 22);
          c.textAlign = "center"; c.font = "bold 13px sans-serif"; c.fillText(`剩 ${T - s.n} 顆`, PW / 2, 388);
          c.strokeStyle = COL[p]; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      msg("先鎖角度,再鎖力道!");
      loop(dt => {
        if (over) return;
        for (const p of [1,2]) {
          const s = S[p]; s.t += dt;
          if (s.ph === 2 && s.m) {
            const m = s.m, sp0 = Math.hypot(m.vx, m.vy), ns = sp0 - 250 * dt;
            if (ns <= 8) {
              const v = zone(m.x, m.y); s.land.push({ x:m.x, y:m.y, v }); s.sc += v; s.n++; s.m = null; s.ph = 3; s.w = .7;
            } else {
              m.vx *= ns / sp0; m.vy *= ns / sp0; m.x += m.vx * dt; m.y += m.vy * dt;
              if (m.x < 17) { m.x = 17; m.vx = -m.vx; } if (m.x > PW - 17) { m.x = PW - 17; m.vx = -m.vx; }
              if (m.y < 37) { m.y = 37; m.vy = -m.vy; } if (m.y > 393) { m.y = 393; m.vy = -m.vy; }
            }
          } else if (s.ph === 3) { s.w -= dt; if (s.w <= 0) { s.ph = 0; s.t = 0; } }
        }
        draw();
        msg(`${pn(1)} ${S[1].sc} : ${S[2].sc} ${pn(2)}`);
        if (S[1].n >= T && S[2].n >= T) { over = true; win(result(S[1].sc, S[2].sc), ` (${S[1].sc} : ${S[2].sc})`); }
      });
    }
  };

  /* ---------- 賓果 ---------- */
  const bingo = {
    name:"賓果", icon:"🎱", desc:"輪流叫號,兩張卡同時劃掉,先連 5 線者勝",
    rules:[
      "雙方各有一張 5×5 賓果卡,數字 1~25 排列都不同。",
      "輪流點自己卡上一個還沒劃掉的數字,這個數字會同時在兩張卡上劃掉。",
      "橫、直、斜連成一條線算 1 線,先連成 5 線者獲勝。",
      "如果一次叫號讓雙方同時達到 5 線,線數多者勝,一樣多則平手。"
    ],
    start(){
      const mkC = () => Array.from({length:25}, (_, i) => i + 1).sort(() => Math.random() - .5);
      const card = { 1:mkC(), 2:mkC() }, called = new Set();
      let turn = 1, over = false, log = "";
      const lines = p => {
        const m = i => called.has(card[p][i]); let n = 0;
        for (let r = 0; r < 5; r++) { if ([0,1,2,3,4].every(c => m(r * 5 + c))) n++; if ([0,1,2,3,4].every(c => m(c * 5 + r))) n++; }
        if ([0,1,2,3,4].every(k => m(k * 6))) n++;
        if ([0,1,2,3,4].every(k => m(k * 4 + 4))) n++;
        return n;
      };
      const draw = () => {
        setTurn(over ? 0 : turn);
        const bd = p => `<div style="flex:1;max-width:320px;padding:8px;border:3px solid ${COL[p]};border-radius:14px;${turn === p && !over ? "box-shadow:0 0 14px " + COL[p] : ""}">
          <div style="font-weight:900;margin-bottom:6px">${pn(p)} ・ ${lines(p)} 線</div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px">${card[p].map(n =>
            `<button data-p="${p}" data-n="${n}" style="aspect-ratio:1;padding:0;font-weight:900;font-size:1rem;background:${called.has(n) ? COL[p] : "var(--card)"};${called.has(n) ? "color:#fff" : ""}">${n}</button>`).join("")}</div></div>`;
        $("stage").innerHTML = `<div style="text-align:center;margin:10px 0;font-weight:900;color:${COL[turn]}">${over ? "" : "輪到 " + pn(turn) + " 叫號"}</div>
          <div style="text-align:center;min-height:1.6em;margin-bottom:6px">${log}</div>
          <div id="bgw" style="display:flex;gap:14px;justify-content:center">${bd(1)}${bd(2)}</div>`;
        $("bgw").onclick = e => {
          const b = e.target.closest("button[data-n]"); if (!b || over) return;
          const p = +b.dataset.p, n = +b.dataset.n;
          if (p !== turn || called.has(n)) return;
          called.add(n); log = `${pn(turn)} 叫了 <b>${n}</b>`;
          const a = lines(1), z = lines(2);
          if (a >= 5 || z >= 5) { over = true; draw(); win(result(a, z), ` (${a} : ${z} 線)`); return; }
          turn = 3 - turn; draw(); msg(`輪到 ${pn(turn)} ・ ${a} : ${z} 線`);
        };
      };
      msg(`輪到 ${pn(1)} 叫號`); draw();
    }
  };

  [bulls, pirate, pong, marble, bingo].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); setTurn(0); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
