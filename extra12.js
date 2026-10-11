/* ========== 新增小遊戲 11:下注轉盤 / 速算Pro / 飛鏢 / 射氣球 / 丟沙包 ========== */
(function () {
  const COL = { 1:"#ff5d73", 2:"#4da3ff" };
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

  /* ---------- 下注轉盤 ---------- */
  const bet = {
    name:"下注轉盤", icon:"🎰", desc:"祕密下注,轉盤倍率決定輸贏",
    rules:[
      "雙方各 100 點,共 8 回合。每回合先後祕密選擇下注點數。",
      "兩人各自轉一次轉盤,倍率可能是 ×0、×0.5、×1、×1.5、×2、×3。",
      "下注的點數乘上倍率就是拿回的點數,例如押 20 轉到 ×2,淨賺 20;轉到 ×0,損失 20。",
      "8 回合後點數多者獲勝。"
    ],
    start(){
      const M = [0, 0, .5, 1, 1.5, 2, 3], ROUNDS = 8;
      const pts = { 1:100, 2:100 };
      let round = 1, b1 = 0, log = "", over = false;
      const bar = p => `<div style="flex:1;max-width:300px;padding:10px;border:3px solid ${COL[p]};border-radius:14px;text-align:center">
        <div style="font-weight:900">${pn(p)}</div><div style="font-size:1.8rem;font-weight:900">${pts[p]} 點</div></div>`;
      const optsOf = who => {
        const opts = [10, 20, 50].filter(x => x <= pts[who]);
        if (pts[who] > 0 && !opts.includes(pts[who])) opts.push(pts[who]);
        return opts;
      };
      const show = who => {
        const opts = optsOf(who), cpuTurn = isCPU(who);
        $("stage").innerHTML = `<div style="display:flex;gap:14px;justify-content:center;margin:10px auto">${bar(1)}${bar(2)}</div>
          <div style="text-align:center;margin-top:10px"><div style="min-height:70px;margin-bottom:8px">${log}</div>
          ${over ? "" : cpuTurn ? `<b>第 ${round}/${ROUNDS} 回合 ・ ${pn(who)} 思考中…</b>` :
            `<b>第 ${round}/${ROUNDS} 回合 ・ 輪到 ${pn(who)} 下注</b> ${isCPU(2) ? "" : "<small>(對手請先別看)</small>"}<br>` +
            (opts.length ? opts.map(o => `<button data-b="${o}" style="margin:8px;padding:12px 18px;font-size:1.1rem">${o === pts[who] ? "全押 " : ""}${o}</button>`).join("")
              : `<button data-b="0" style="margin:8px;padding:12px 18px">沒有點數了,直接過</button>`)}</div>`;
        if (!over && !cpuTurn) $("stage").querySelectorAll("button[data-b]").forEach(b => b.onclick = () => choose(who, +b.dataset.b));
      };

      /* 電腦(玩家2):只看雙方目前點數,不知道玩家1 押多少 */
      const cpuBet = () => {
        const opts = optsOf(2);
        if (!opts.length) return 0;
        if (Math.random() > cpuSmart()) return pickOne(opts);
        const diff = pts[2] - pts[1];
        if (diff > 40) return opts[Math.floor((opts.length - 1) / 2)];
        return opts[opts.length - 1];
      };

      const spin = () => M[Math.floor(Math.random() * M.length)];
      const choose = (who, v) => {
        if (over) return;
        if (who === 1) {
          b1 = v;
          if (isCPU(2)) {
            log = `${pn(1)} 已下注`; show(2);
            later(() => choose(2, cpuBet()), cpuDelay());
          } else { log = `${pn(1)} 已下注,換 ${pn(2)}`; show(2); }
          return;
        }
        const b2 = v, m1 = spin(), m2 = spin();
        pts[1] += Math.round(b1 * m1 - b1); pts[2] += Math.round(b2 * m2 - b2);
        log = `${pn(1)} 押 ${b1} → <b>×${m1}</b> ・ ${pn(2)} 押 ${b2} → <b>×${m2}</b>`;
        msg(`${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`);
        if (round >= ROUNDS) {
          over = true; show(1);
          win(pts[1] === pts[2] ? 0 : pts[1] > pts[2] ? 1 : 2, ` (${pts[1]} : ${pts[2]} 點)`);
          return;
        }
        round++; show(1);
      };
      msg("祕密下注,轉盤決定輸贏!");
      show(1);
    }
  };

  /* ---------- 速算 Pro ---------- */
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const genQ = lv => {
    let a, b, c, d, x;
    if (lv < 3) {
      if (Math.random() < .5) { a = R(2,12); b = R(2,12); c = R(2,9); return [`(${a} + ${b}) × ${c}`, (a + b) * c]; }
      a = R(3,12); b = R(3,12); c = R(3,12); d = R(3,12); return [`${a} × ${b} + ${c} × ${d}`, a * b + c * d];
    }
    if (lv < 6) {
      const t = R(0, 2);
      if (t === 0) { a = R(20,90); b = R(3,12); c = R(3,12); d = R(5,40); return [`${a} + ${b} × ${c} − ${d}`, a + b * c - d]; }
      if (t === 1) { a = R(11,25); b = R(5,60); return [`${a}² + ${b}`, a * a + b]; }
      x = R(3,15); a = R(3,9); b = R(5,40); return [`? × ${a} + ${b} = ${x * a + b}`, x];
    }
    const t = R(0, 3);
    if (t === 0) { a = R(5,15); b = R(2,9); c = R(8,20); d = R(2,9); return [`(${a} + ${b}) × (${c} − ${d})`, (a + b) * (c - d)]; }
    if (t === 1) { a = R(12,30); b = R(3,12); return [`${a}² − ${b}²`, a * a - b * b]; }
    if (t === 2) { d = R(3,9); const q = R(5,25); a = R(2,9); c = R(5,40); return [`(${q * d} ÷ ${d} + ${c}) × ${a}`, (q + c) * a]; }
    x = R(6,25); a = R(5,60); return [`?² + ${a} = ${x * x + a}`, x];
  };
  const calc = {
    name:"速算 Pro", icon:"🧮", desc:"括號、平方、找缺少的數字,難度逐題提高",
    rules:[
      "左右是同一題,題型包含括號、混合運算、平方、找缺少的數字(?)。",
      "在自己的欄位輸入答案後按 Enter 或「送出」。",
      "先答對者得 1 分,答錯鎖定 1 秒。難度會逐題提高。",
      "共 10 題,分數高者獲勝。"
    ],
    start(){
      const ROUNDS = 10, sc = { 1:0, 2:0 }, lock = { 1:false, 2:false };
      let round = 0, q, over = false;
      $("stage").innerHTML = `<div id="cqq" style="text-align:center;margin:10px 0"></div>
        <div style="display:flex;gap:14px;justify-content:center">${panel(1,"cq")}${panel(2,"cq")}</div>`;

      const attempt = (p, v) => {
        if (over || lock[p]) return;
        if (Number(v) === q[1]) {
          sc[p]++;
          if (round >= ROUNDS) { over = true; draw(1); draw(2); win(sc[1] === sc[2] ? 0 : sc[1] > sc[2] ? 1 : 2, ` (${sc[1]} : ${sc[2]})`); }
          else next();
        } else {
          lock[p] = true;
          if ($("cqm" + p)) $("cqm" + p).textContent = "答錯!鎖定 1 秒";
          const r = round;
          setTimeout(() => {
            if (r === round && !over && $("cqm" + p)) {
              lock[p] = false; $("cqm" + p).textContent = "";
              if ($("cqn" + p)) $("cqn" + p).value = "";
            }
          }, 1000);
        }
      };

      const draw = p => {
        const human = !isCPU(p);
        $("cqi" + p).innerHTML = `${pn(p)} ・ ${sc[p]} 分`;
        $("cqb" + p).innerHTML = (human
          ? `<div style="display:flex;gap:6px"><input id="cqn${p}" inputmode="numeric" autocomplete="off" style="flex:1;min-width:0;padding:10px;font-size:1.2rem">
            <button id="cqg${p}" style="padding:8px 14px">送出</button></div>`
          : `<div style="padding:10px;font-size:1.1rem">計算中…</div>`)
          + `<div id="cqm${p}" style="min-height:1.4em;margin-top:4px;color:#ff8a8a"></div>`;
        if (human) {
          const go = () => {
            const v = $("cqn" + p).value.trim(); if (v === "") return;
            attempt(p, v);
          };
          $("cqg" + p).onclick = go;
          $("cqn" + p).onkeydown = e => { if (e.key === "Enter") go(); };
        }
      };

      /* 電腦(玩家2):每題等一段時間(越後面越久)才作答 */
      const cpuTry = (r, delay) => {
        later(() => {
          if (over || r !== round) return;
          if (lock[2]) { cpuTry(r, 300); return; }
          if (Math.random() < [.3, .15, .05][cpuLevel-1]) {
            attempt(2, q[1] + R(1, 6) * (Math.random() < .5 ? -1 : 1));
            cpuTry(r, 1500);
          } else attempt(2, q[1]);
        }, delay);
      };

      const next = () => {
        round++; lock[1] = lock[2] = false; q = genQ(round - 1);
        $("cqq").innerHTML = `<div style="font-weight:900">第 ${round}/${ROUNDS} 題</div><div style="font-size:2rem;font-weight:900;margin-top:6px">${q[0]}</div>`;
        draw(1); draw(2); msg(`${pn(1)} ${sc[1]} : ${sc[2]} ${pn(2)}`);
        if (isCPU(2)) cpuTry(round, [9000, 6000, 3500][cpuLevel-1] * (1 + (round - 1) * .1) * rnd(.8, 1.2));
      };
      next();
    }
  };

  /* ---------- 飛鏢 ---------- */
  const dart = {
    name:"飛鏢", icon:"🎯", desc:"準星飄移,按鍵射出,比總分",
    rules:[
      "左右各一個靶,準星會在靶上飄移。",
      "玩家1 按 S,玩家2 按 ↓(手機按「射」),飛鏢會射向準星當下的位置。",
      "越靠近紅心分數越高,正中紅心 50 分,射出靶外 0 分。",
      "每人 6 支飛鏢,總分高者獲勝。"
    ],
    start(){
      const H = 400, T = 6, CX = PW / 2, CY = 200, RR = 120;
      const c = canvas(W, H, ctl(pad(1,[["射","s"]]) + pad(2,[["射","arrowdown"]])));
      const rng = mk(Date.now() & 0xffffff);
      const prm = Array.from({length:T}, () => ({ f1:.9 + rng() * .8, f2:1.1 + rng() * .9, ph:rng() * 6 }));
      const S = { 1:{ n:0, sc:0, d:[], t:0, wait:0, pause:1 }, 2:{ n:0, sc:0, d:[], t:0, wait:0, pause:1 } };
      const cThr = [40, 24, 12][cpuLevel-1], cErr = [16, 8, 3][cpuLevel-1];
      let over = false;
      const pos = s => { const q = prm[Math.min(s.n, T - 1)]; return [CX + Math.sin(s.t * q.f1 + q.ph) * 135, CY + Math.sin(s.t * q.f2) * 135]; };
      const score = (x, y) => { const d = Math.hypot(x - CX, y - CY); if (d < 8) return 50; if (d > RR) return 0; return Math.max(1, Math.ceil(10 - d / (RR / 10))); };

      const shoot = (p, e) => {
        const s = S[p]; if (s.n >= T) return;
        let [x, y] = pos(s);
        if (e) { x += rnd(-e, e); y += rnd(-e, e); }
        const v = score(x, y);
        s.d.push({ x, y, v }); s.sc += v; s.n++;
      };
      const KM = { s:1, arrowdown:2 };
      keyHandler = e => {
        const p = KM[e.key.toLowerCase()]; if (!p || e.repeat || over) return;
        if (e.key.startsWith("Arrow")) e.preventDefault();
        if (isCPU(p)) return;
        shoot(p, 0);
      };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          for (let i = 10; i >= 1; i--) { c.fillStyle = i % 2 ? "#2a2f4d" : "#e8e0c8"; c.beginPath(); c.arc(CX, CY, RR * i / 10, 0, 7); c.fill(); }
          c.fillStyle = "#e33"; c.beginPath(); c.arc(CX, CY, 8, 0, 7); c.fill();
          for (const d of s.d) { c.fillStyle = COL[p]; c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.arc(d.x, d.y, 5, 0, 7); c.fill(); c.stroke(); }
          if (s.n < T) {
            const [x, y] = pos(s); c.strokeStyle = "#ffd34d"; c.lineWidth = 2;
            c.beginPath(); c.arc(x, y, 12, 0, 7); c.moveTo(x - 18, y); c.lineTo(x + 18, y); c.moveTo(x, y - 18); c.lineTo(x, y + 18); c.stroke();
          }
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left"; c.fillText(names[p], 8, 22);
          c.textAlign = "right"; c.fillText(`${s.sc} 分`, PW - 8, 22);
          c.textAlign = "center"; c.fillText(`剩 ${T - s.n} 支`, PW / 2, H - 10);
          c.strokeStyle = COL[p]; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      msg("準星對準紅心時按射!");
      loop(dt => {
        if (over) return;
        for (const p of [1,2]) S[p].t += dt;
        /* 電腦:只看自己的準星,等它夠靠近紅心才射;等越久門檻越寬 */
        if (isCPU(2)) {
          const s = S[2];
          s.pause -= dt;
          if (s.n < T && s.pause <= 0) {
            s.wait += dt;
            const [x, y] = pos(s);
            if (Math.hypot(x - CX, y - CY) < cThr + s.wait * 8) {
              shoot(2, cErr);
              s.wait = 0; s.pause = .8 + rnd(0, .8);
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

  /* ---------- 射氣球 ---------- */
  const balloon = {
    name:"射氣球", icon:"🔫", desc:"夜市射氣球,小氣球分數高",
    rules:[
      "左右兩邊的氣球完全一樣,從下往上飄。",
      "玩家1:A/D 移動、W 射擊。玩家2:←/→ 移動、↑ 射擊。",
      "大氣球 1 分、中氣球 2 分、小氣球 3 分。子彈有冷卻時間,不要亂射。",
      "30 秒後分高者獲勝。"
    ],
    start(){
      const H = 400, LIM = 30;
      const c = canvas(W, H, ctl(pad(1,[["◀","a"],["▶","d"],["射","w"]]) + pad(2,[["◀","arrowleft"],["▶","arrowright"],["射","arrowup"]])));
      const rng = mk(Date.now() & 0xffffff);
      const S = { 1:{ x:PW/2, sc:0, cd:0, b:[], bl:[], fx:[] }, 2:{ x:PW/2, sc:0, cd:0, b:[], bl:[], fx:[], cw:0 } };
      const keys = { 1:["a","d"], 2:["arrowleft","arrowright"] };
      const CS = ["#ff5d73","#ffd34d","#3ddc84","#4da3ff","#c77dff"];
      const cSpd = [170, 240, 300][cpuLevel-1], cErr = [14, 7, 2][cpuLevel-1];
      const cSkip = [.35, .15, .04][cpuLevel-1], cWait = [.5, .2, 0][cpuLevel-1];
      let el = 0, spT = .3, over = false;
      const fire = p => { const s = S[p]; if (over || s.cd > 0) return; s.cd = .35; s.b.push({ x:s.x, y:H - 50 }); };
      const KM = { w:1, arrowup:2 };
      keyHandler = e => {
        const p = KM[e.key.toLowerCase()]; if (!p || e.repeat) return;
        if (e.key.startsWith("Arrow")) e.preventDefault();
        if (isCPU(p)) return;
        fire(p);
      };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          for (const b of s.bl) {
            c.fillStyle = b.col; c.beginPath(); c.ellipse(b.x, b.y, b.r, b.r * 1.2, 0, 0, 7); c.fill();
            c.strokeStyle = "#ffffff55"; c.beginPath(); c.moveTo(b.x, b.y + b.r * 1.2); c.lineTo(b.x, b.y + b.r * 1.2 + 14); c.stroke();
          }
          for (const f of s.fx) { c.globalAlpha = Math.max(0, f.t * 2); c.font = "bold 20px sans-serif"; c.textAlign = "center"; c.fillStyle = "#fff"; c.fillText("+" + f.v, f.x, f.y); }
          c.globalAlpha = 1;
          c.fillStyle = "#ffd34d"; for (const b of s.b) c.fillRect(b.x - 2, b.y - 8, 4, 12);
          c.fillStyle = COL[p]; c.fillRect(s.x - 18, H - 40, 36, 16); c.fillRect(s.x - 4, H - 54, 8, 16);
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left"; c.fillText(names[p], 8, 22);
          c.textAlign = "right"; c.fillText(`${s.sc} 分`, PW - 8, 22);
          c.strokeStyle = "#3a4070"; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      draw();
      loop(dt => {
        if (over) return;
        el += dt; spT -= dt;
        if (spT <= 0) {
          spT = .45 + rng() * .35;
          const k = rng(), r = k < .4 ? 28 : k < .75 ? 20 : 13, v = r === 28 ? 1 : r === 20 ? 2 : 3;
          const x = 30 + rng() * (PW - 60), sp = 50 + rng() * 40 + (3 - v) * 15, col = CS[Math.floor(rng() * 5)];
          for (const p of [1,2]) {
            const b = { x, y:H + 30, r, v, sp, col, sw:rng() * 6 };
            if (p === 2) { b.skip = Math.random() < cSkip; b.err = rnd(-cErr, cErr); }
            S[p].bl.push(b);
          }
        }
        for (const p of [1,2]) {
          const s = S[p], k = keys[p];
          if (p === 2 && isCPU(2)) {
            /* 電腦:只看自己這邊的氣球,挑「分數高又不太遠」的追 */
            let tgt = null, bs = -1;
            for (const b of s.bl) {
              if (b.skip || b.y > H - 70 || b.y < 20) continue;
              const sco = b.v * (cpuLevel === 1 ? 1 : 2) / (1 + Math.abs(b.x - s.x) / 80);
              if (sco > bs) { bs = sco; tgt = b; }
            }
            s.cw -= dt;
            if (tgt) {
              const goal = tgt.x + tgt.err, step = cSpd * dt, dx = goal - s.x;
              s.x = clamp(s.x + clamp(dx, -step, step), 20, PW - 20);
              if (Math.abs(s.x - goal) < Math.max(4, tgt.r * .45) && s.cd <= 0 && s.cw <= 0) {
                fire(2); s.cw = cWait * rnd(.5, 1.5);
              }
            }
          } else {
            s.x = clamp(s.x + ((K[k[1]] ? 1 : 0) - (K[k[0]] ? 1 : 0)) * 300 * dt, 20, PW - 20);
          }
          s.cd -= dt; s.fx = s.fx.filter(f => { f.t -= dt; f.y -= 30 * dt; return f.t > 0; });
          s.bl.forEach(b => { b.y -= b.sp * dt; });
          s.bl = s.bl.filter(b => b.y > -40);
          s.b = s.b.filter(bu => {
            bu.y -= 520 * dt;
            for (let i = 0; i < s.bl.length; i++) {
              const b = s.bl[i];
              if (Math.abs(bu.x - b.x) < b.r && Math.abs(bu.y - b.y) < b.r * 1.2) { s.sc += b.v; s.fx.push({ x:b.x, y:b.y, v:b.v, t:.5 }); s.bl.splice(i, 1); return false; }
            }
            return bu.y > -10;
          });
        }
        draw();
        msg(`${pn(1)} ${S[1].sc} : ${S[2].sc} ${pn(2)} ・ 剩 ${Math.max(0, Math.ceil(LIM - el))} 秒`);
        if (el >= LIM) { over = true; win(S[1].sc === S[2].sc ? 0 : S[1].sc > S[2].sc ? 1 : 2, ` (${S[1].sc} : ${S[2].sc})`); }
      });
    }
  };

  /* ---------- 丟沙包 ---------- */
  const bag = {
    name:"丟沙包", icon:"🎒", desc:"鎖定左右、再鎖定遠近,把沙包丟進洞",
    rules:[
      "左右各一塊板子,板上有 4 個洞:兩個大洞 1 分、中洞 2 分、最遠的小洞 5 分。",
      "玩家1 按 S,玩家2 按 ↓(手機按「丟」)。第一次按鎖定左右位置,第二次按鎖定遠近。",
      "沙包落點要在洞的範圍內才算分,每人 8 顆。",
      "總分高者獲勝。"
    ],
    start(){
      const H = 420, T = 8, Y0 = 50, Y1 = 330;
      const HOLES = [[60,230,28,1],[240,230,28,1],[150,200,22,2],[150,95,16,5]];
      const c = canvas(W, H, ctl(pad(1,[["丟","s"]]) + pad(2,[["丟","arrowdown"]])));
      const rng = mk(Date.now() & 0xffffff);
      const spd = Array.from({length:T}, (_, i) => ({ x:.7 + rng() * .6 + i * .05, y:.8 + rng() * .6 + i * .05 }));
      const S = { 1:{ n:0, sc:0, ph:0, t:0, x:0, y:0, land:[], w:0, tg:null }, 2:{ n:0, sc:0, ph:0, t:0, x:0, y:0, land:[], w:0, tg:null } };
      const cTol = [16, 9, 5][cpuLevel-1];
      let over = false;
      const cur = s => { const q = spd[Math.min(s.n, T - 1)]; return [20 + (PW - 40) * tri(s.t * q.x), Y0 + (Y1 - Y0) * tri(s.t * q.y)]; };

      const lockStep = p => {
        const s = S[p]; if (s.n >= T) return;
        if (s.ph === 0) { s.x = cur(s)[0]; s.ph = 1; s.t = 0; }
        else if (s.ph === 1) {
          s.y = cur(s)[1]; let v = 0;
          for (const h of HOLES) if (Math.hypot(s.x - h[0], s.y - h[1]) < h[2]) { v = h[3]; break; }
          s.land.push({ x:s.x, y:s.y, v }); s.sc += v; s.n++; s.ph = 2; s.w = .7; s.tg = null;
        }
      };
      const KM = { s:1, arrowdown:2 };
      keyHandler = e => {
        const p = KM[e.key.toLowerCase()]; if (!p || e.repeat || over) return;
        if (e.key.startsWith("Arrow")) e.preventDefault();
        if (isCPU(p)) return;
        lockStep(p);
      };

      /* 電腦:每顆先決定要瞄準哪個洞;簡單常亂選,困難瞄 5 分洞 */
      const pickHole = () => {
        if (Math.random() > cpuSmart()) return pickOne([0, 1, 2]);
        if (cpuLevel === 3) return Math.random() < .75 ? 3 : 2;
        if (cpuLevel === 2) return pickOne([2, 2, 3, 0, 1]);
        return pickOne([0, 1, 2]);
      };

      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.fillStyle = "#8a5a2b"; c.fillRect(10, 40, PW - 20, 310);
          for (const h of HOLES) {
            c.fillStyle = "#111"; c.beginPath(); c.arc(h[0], h[1], h[2], 0, 7); c.fill();
            c.fillStyle = "#fff"; c.font = "bold 14px sans-serif"; c.textAlign = "center"; c.fillText(h[3], h[0], h[1] + 5);
          }
          for (const l of s.land) { c.fillStyle = l.v ? COL[p] : "#555"; c.beginPath(); c.arc(l.x, l.y, 8, 0, 7); c.fill(); }
          if (s.n < T && s.ph < 2) {
            const [x, y] = cur(s); const px = s.ph === 0 ? x : s.x, py = s.ph === 0 ? 385 : y;
            c.fillStyle = "#ffd34d"; c.beginPath(); c.arc(px, py, 9, 0, 7); c.fill();
            c.strokeStyle = "#ffd34d55"; c.beginPath(); c.moveTo(px, 40); c.lineTo(px, 400); c.stroke();
          }
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left"; c.fillText(names[p], 8, 22);
          c.textAlign = "right"; c.fillText(`${s.sc} 分`, PW - 8, 22);
          c.textAlign = "center"; c.fillText(`剩 ${T - s.n} 顆`, PW / 2, H - 6);
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
        /* 電腦:只看自己移動中的標記,等它剛好對到目標洞的位置再鎖定 */
        if (isCPU(2)) {
          const s = S[2];
          if (s.n < T && s.ph < 2) {
            if (s.tg === null) s.tg = pickHole();
            const h = HOLES[s.tg];
            if (s.ph === 0 && s.t > .3 && Math.abs(cur(s)[0] - h[0]) < cTol) lockStep(2);
            else if (s.ph === 1 && s.t > .3 && Math.abs(cur(s)[1] - h[1]) < cTol) lockStep(2);
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

  [bet, calc, dart, balloon, bag].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();