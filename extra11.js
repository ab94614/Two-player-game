/* ========== 新增小遊戲 10:你畫我猜文字版 / 節奏對決 / 接手搖飲 ========== */
(function () {
  const COL = { 1:"#ff5d73", 2:"#4da3ff" };
  const mk = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const PW = 300, GAP = 20, W = PW * 2 + GAP;

  /* ---------- 你畫我猜(文字版) ---------- */
  const WORDS = [
    ["珍珠奶茶","飲料"],["腳踏車","交通工具"],["雨傘","生活用品"],["火鍋","食物"],["電風扇","家電"],
    ["夜市","地點"],["太陽","自然"],["冰淇淋","食物"],["長頸鹿","動物"],["手機","生活用品"],
    ["飛機","交通工具"],["蛋糕","食物"],["西瓜","水果"],["鋼琴","樂器"],["牙刷","生活用品"],
    ["企鵝","動物"],["便利商店","地點"],["捷運","交通工具"],["籃球","運動"],["彩虹","自然"]
  ];
  const guess = {
    name:"你畫我猜(文字版)", icon:"🕵️", desc:"用文字描述,不能說出答案,讓對手猜",
    rules:[
      "同一台裝置輪流:出題者會看到題目,用一句文字描述它。",
      "描述中不能出現答案的字(連續兩個字相同就不行)。",
      "對手有 3 次機會猜。第 1 次猜中得 3 分,第 2 次 2 分,第 3 次 1 分。",
      "雙方各出一次題,共 2 輪,總分高者獲勝。"
    ],
    start(){
      const sc = { 1:0, 2:0 }, ROUNDS = 2;
      const ws = WORDS.slice().sort(() => Math.random() - .5).slice(0, ROUNDS);
      let round = 0, d, g, w, tries;
      const box = h => { $("stage").innerHTML = `<div style="max-width:460px;margin:14px auto;text-align:center;line-height:1.8">${h}</div>`; };
      const info = () => msg(`${pn(1)} ${sc[1]} : ${sc[2]} ${pn(2)}`);
      const norm = s => s.replace(/\s/g, "");
      const leaks = (hint, word) => {
        const h = norm(hint), n = Math.min(2, word.length);
        for (let i = 0; i + n <= word.length; i++) if (h.includes(word.substr(i, n))) return true;
        return false;
      };
      const p0 = () => {
        d = round % 2 === 0 ? 1 : 2; g = 3 - d; w = ws[round]; tries = 0; info();
        box(`<h3>第 ${round + 1}/${ROUNDS} 輪</h3><p>${pn(d)} 出題,${pn(g)} 請先別看螢幕</p>
          <button id="gA" style="padding:12px 22px;font-size:1.1rem">我是 ${pn(d)},顯示題目</button>`);
        $("gA").onclick = p1;
      };
      const p1 = () => {
        box(`<p>題目分類:<b>${w[1]}</b></p>
          <p style="font-size:2rem;font-weight:900;margin:6px">${w[0]}</p>
          <textarea id="gH" maxlength="40" rows="2" placeholder="用一句話描述(不能含答案的字)" style="width:100%;padding:8px;font-size:1rem"></textarea>
          <p id="gE" style="color:#ff8a8a;min-height:1.4em"></p>
          <button id="gB" style="padding:10px 20px">送出,交給 ${pn(g)}</button>`);
        $("gB").onclick = () => {
          const v = $("gH").value.trim();
          if (v.length < 2) { $("gE").textContent = "請寫至少 2 個字"; return; }
          if (leaks(v, w[0])) { $("gE").textContent = "描述不能包含答案的字!"; return; }
          p2(v);
        };
      };
      const p2 = hint => {
        box(`<p>${pn(g)} 來猜!分類:<b>${w[1]}</b></p>
          <div style="padding:12px;border-radius:12px;background:var(--card);margin:8px 0">「${hint.replace(/</g, "&lt;")}」</div>
          <p>第 ${tries + 1}/3 次</p>
          <input id="gI" autocomplete="off" style="padding:8px;font-size:1.1rem;width:60%">
          <button id="gG" style="padding:8px 16px">猜</button>
          <p id="gF" style="min-height:1.4em;color:#ff8a8a"></p>`);
        const submit = () => {
          const v = norm($("gI").value);
          if (!v) return;
          tries++;
          if (v === w[0]) { sc[g] += 4 - tries; return res(true); }
          if (tries >= 3) return res(false);
          p2b(hint, `不對!還有 ${3 - tries} 次機會`);
        };
        $("gG").onclick = submit;
        $("gI").onkeydown = e => { if (e.key === "Enter") submit(); };
      };
      const p2b = (hint, tip) => { p2(hint); $("gF").textContent = tip; };
      const res = ok => {
        info(); round++;
        box(`<h3>${ok ? "🎉 猜中了!" : "😢 沒猜中"}</h3><p>答案:<b>${w[0]}</b></p>
          <p>${pn(1)} ${sc[1]} 分 ・ ${pn(2)} ${sc[2]} 分</p>
          <button id="gN" style="padding:12px 22px;font-size:1.1rem">${round >= ROUNDS ? "看結果" : "下一輪"}</button>`);
        $("gN").onclick = () => {
          if (round >= ROUNDS) win(sc[1] === sc[2] ? 0 : sc[1] > sc[2] ? 1 : 2, ` (${sc[1]} : ${sc[2]})`);
          else p0();
        };
      };
      p0();
    }
  };

  /* ---------- 節奏對決 ---------- */
  const rhythm = {
    name:"節奏對決", icon:"🥁", desc:"音符落下,在判定線按鍵,比分數與連擊",
    rules:[
      "左右各 3 條軌道,音符完全一樣,從上往下掉。",
      "玩家1 按 A / S / D,玩家2 按 ← / ↓ / →(手機點按鈕),音符到判定線時按對應軌道。",
      "命中得分,連擊越高每次加分越多。漏掉或亂按會斷連擊。",
      "全部音符結束後,分數高者獲勝。"
    ],
    start(){
      const H = 420, HIT = H - 70, SPEED = 260, WIN = .16, LW = 90, NOTES_N = 60;
      const c = canvas(W, H, ctl(
        pad(1,[["A","a"],["S","s"],["D","d"]]) +
        pad(2,[["◀","arrowleft"],["▼","arrowdown"],["▶","arrowright"]])));
      const rng = mk(Date.now() & 0xffffff);
      const base = [];
      let t = 2;
      for (let i = 0; i < NOTES_N; i++) {
        base.push({ t, lane: Math.floor(rng() * 3) });
        t += rng() < .3 ? .28 : .5;
      }
      const END = t + 1.5;
      const S = {};
      for (const p of [1,2]) S[p] = { sc:0, combo:0, best:0, fx:"", fxT:0, notes: base.map(n => ({ ...n, done:false })) };
      const KEYS = { a:[1,0], s:[1,1], d:[1,2], arrowleft:[2,0], arrowdown:[2,1], arrowright:[2,2] };
      let el = 0, over = false;
      const press = (p, lane) => {
        const s = S[p]; let best = null;
        for (const n of s.notes) {
          if (n.done || n.lane !== lane) continue;
          const dt = Math.abs(n.t - el);
          if (dt < WIN && (!best || dt < Math.abs(best.t - el))) best = n;
        }
        if (best) {
          best.done = true; s.combo++; s.best = Math.max(s.best, s.combo);
          const perfect = Math.abs(best.t - el) < .06;
          s.sc += (perfect ? 15 : 10) + Math.min(s.combo, 20);
          s.fx = perfect ? "完美!" : "命中"; s.fxT = .4;
        } else { s.combo = 0; s.fx = "漏拍"; s.fxT = .3; }
      };
      keyHandler = e => {
        const m = KEYS[e.key.toLowerCase()]; if (!m) return;
        if (e.key.startsWith("Arrow")) e.preventDefault();
        if (e.repeat || over || el < 0) return;
        press(m[0], m[1]);
      };
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP, lx = (PW - LW * 3) / 2;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          for (let i = 0; i < 3; i++) {
            c.fillStyle = i % 2 ? "#181c30" : "#1c2036"; c.fillRect(lx + i * LW, 0, LW, H);
          }
          c.fillStyle = COL[p]; c.fillRect(lx, HIT - 2, LW * 3, 4);
          for (const n of s.notes) {
            if (n.done) continue;
            const y = HIT - (n.t - el) * SPEED;
            if (y < -20 || y > H + 20) continue;
            c.fillStyle = COL[p]; c.fillRect(lx + n.lane * LW + 8, y - 10, LW - 16, 20);
          }
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left";
          c.fillText(names[p], 8, 22); c.textAlign = "right"; c.fillText(`${s.sc} 分`, PW - 8, 22);
          c.textAlign = "center";
          if (s.combo > 1) { c.font = "bold 22px sans-serif"; c.fillText(`${s.combo} 連擊`, PW / 2, 60); }
          if (s.fxT > 0) { c.font = "bold 20px sans-serif"; c.fillStyle = "#ffd34d"; c.fillText(s.fx, PW / 2, HIT + 40); }
          c.strokeStyle = "#3a4070"; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      el = -1; msg("準備!音符到線時按鍵");
      draw();
      loop(dt => {
        if (over) return;
        el += dt;
        for (const p of [1,2]) {
          const s = S[p]; s.fxT -= dt;
          for (const n of s.notes) {
            if (!n.done && el - n.t > WIN) { n.done = true; s.combo = 0; s.fx = "漏掉"; s.fxT = .3; }
          }
        }
        draw();
        msg(`${pn(1)} ${S[1].sc} : ${S[2].sc} ${pn(2)}`);
        if (el > END) {
          over = true;
          const a = S[1], b = S[2];
          win(a.sc === b.sc ? 0 : a.sc > b.sc ? 1 : 2, ` (${a.sc} : ${b.sc},最高連擊 ${a.best} : ${b.best})`);
        }
      });
    }
  };

  /* ---------- 接手搖飲 ---------- */
  const drink = {
    name:"接手搖飲", icon:"🥤", desc:"手搖飲掉下來要接住,不然就破掉",
    rules:[
      "左右兩個視窗,掉下來的手搖飲完全一樣。",
      "玩家1 用 A / D 移動托盤,玩家2 用 ← / →(手機點 ◀ ▶)。",
      "接住 +1 分。沒接到掉到地上就會摔破,損失 1 顆愛心(每人 3 顆)。",
      "愛心先用完的人輸。飲料會越掉越快,60 秒時間到則比愛心,再比分數。"
    ],
    start(){
      const H = 400, LIM = 60;
      const c = canvas(W, H, ctl(pad(1,[["◀","a"],["▶","d"]]) + pad(2,[["◀","arrowleft"],["▶","arrowright"]])));
      const rng = mk(Date.now() & 0xffffff);
      const S = { 1:{ x:PW/2, sc:0, hp:3, items:[], fx:[] }, 2:{ x:PW/2, sc:0, hp:3, items:[], fx:[] } };
      const keys = { 1:["a","d"], 2:["arrowleft","arrowright"] };
      let el = 0, spT = .6, over = false;
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) {
          const s = S[p], ox = p === 1 ? 0 : PW + GAP;
          c.save(); c.beginPath(); c.rect(ox, 0, PW, H); c.clip(); c.translate(ox, 0);
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.fillStyle = "#2a2f4d"; c.fillRect(0, H - 10, PW, 10);
          c.textAlign = "center"; c.font = "28px sans-serif";
          for (const it of s.items) c.fillText(it.e, it.x, it.y);
          for (const f of s.fx) { c.globalAlpha = Math.max(0, f.t * 2); c.fillText("💥", f.x, H - 16); }
          c.globalAlpha = 1;
          c.fillStyle = COL[p]; c.fillRect(s.x - 36, H - 40, 72, 8);
          c.font = "22px sans-serif"; c.fillText("🙌", s.x, H - 42);
          c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "left";
          c.fillText(names[p], 8, 22);
          c.textAlign = "right"; c.fillText(`${s.sc} 分`, PW - 8, 22);
          c.textAlign = "left"; c.font = "16px sans-serif";
          c.fillText("❤️".repeat(s.hp) + "🖤".repeat(3 - s.hp), 8, 44);
          c.strokeStyle = "#3a4070"; c.lineWidth = 2; c.strokeRect(1, 1, PW - 2, H - 2);
          c.restore();
        }
      };
      draw();
      loop(dt => {
        if (over) return;
        el += dt; spT -= dt;
        if (spT <= 0) {
          spT = Math.max(.35, .9 - el * .01);
          const x = 24 + rng() * (PW - 48), e = ["🥤","🍹","🍵","🥛"][Math.floor(rng() * 4)];
          const sp = 1 + rng() * .3;
          for (const p of [1,2]) S[p].items.push({ x, y:-10, e, sp });
        }
        for (const p of [1,2]) {
          const s = S[p], k = keys[p];
          s.x = clamp(s.x + ((K[k[1]] ? 1 : 0) - (K[k[0]] ? 1 : 0)) * 320 * dt, 36, PW - 36);
          s.fx = s.fx.filter(f => (f.t -= dt) > 0);
          if (s.hp <= 0) { s.items = []; continue; }
          s.items = s.items.filter(it => {
            it.y += (130 + el * 3.5) * it.sp * dt;
            if (it.y > H - 62 && it.y < H - 34 && Math.abs(it.x - s.x) < 42) { s.sc++; return false; }
            if (it.y >= H - 14) { s.hp--; s.fx.push({ x:it.x, t:.5 }); return false; }
            return true;
          });
        }
        draw();
        msg(`${pn(1)} ${S[1].sc}分 ❤️${S[1].hp} : ❤️${S[2].hp} ${S[2].sc}分 ${pn(2)} ・ 剩 ${Math.max(0, Math.ceil(LIM - el))} 秒`);
        const a = S[1], b = S[2];
        if (a.hp <= 0 || b.hp <= 0 || el >= LIM) {
          over = true;
          let r;
          if (a.hp !== b.hp) r = a.hp > b.hp ? 1 : 2;
          else r = a.sc === b.sc ? 0 : a.sc > b.sc ? 1 : 2;
          win(r, ` (${a.sc} 分 : ${b.sc} 分)`);
        }
      });
    }
  };

  [guess, rhythm, drink].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
