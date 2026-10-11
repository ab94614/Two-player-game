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
  /* 電腦出題時用的描述(不含答案的連續兩個字) */
  const CPU_HINT = {
    "珍珠奶茶":"黑色圓球在杯子裡,用粗吸管喝的台灣飲料",
    "腳踏車":"兩個輪子,用雙腿踩著前進",
    "雨傘":"下雨天用來擋水的東西",
    "火鍋":"冬天圍著一起煮肉和菜的熱湯",
    "電風扇":"夏天吹出涼風的轉動家電",
    "夜市":"晚上有很多小吃和遊戲攤位的地方",
    "太陽":"白天掛在天空發光發熱的東西",
    "冰淇淋":"夏天吃的冷冷甜甜的圓球甜點",
    "長頸鹿":"脖子特別長、愛吃樹葉的動物",
    "手機":"隨身帶著可以打電話和上網的東西",
    "飛機":"在天空飛、載人出國的交通工具",
    "蛋糕":"生日時插蠟燭、許願後吃的甜點",
    "西瓜":"夏天的紅色果肉、有黑籽的大水果",
    "鋼琴":"有黑白按鍵的大型樂器",
    "牙刷":"每天早晚用來清潔牙齒的小工具",
    "企鵝":"住在南極、走路搖搖擺擺的黑白鳥類",
    "便利商店":"二十四小時營業、到處都有的小店",
    "捷運":"在城市地下穿梭的電聯車",
    "籃球":"投進籃框得分的橘色大球",
    "彩虹":"下雨後天空出現的七色弧形"
  };
  /* 電腦猜題時的「常識」關鍵字(只拿來比對對手的描述) */
  const KW = {
    "珍珠奶茶":["黑","圓","吸管","奶","茶","飲","喝","台灣"],
    "腳踏車":["輪","踩","騎","腿","兩個"],
    "雨傘":["雨","擋","水","撐","下雨"],
    "火鍋":["煮","湯","肉","菜","熱","冬","圍"],
    "電風扇":["風","涼","夏","吹","轉","扇"],
    "夜市":["晚","小吃","攤","逛","遊戲"],
    "太陽":["白天","天空","熱","光","亮","圓"],
    "冰淇淋":["冰","冷","甜","夏","圓","球"],
    "長頸鹿":["脖","長","高","樹葉","黃"],
    "手機":["打電話","上網","隨身","螢幕","通話","帶"],
    "飛機":["飛","天空","出國","機場","翅膀"],
    "蛋糕":["生日","蠟燭","甜","奶油","許願"],
    "西瓜":["夏","紅","籽","大","綠","切"],
    "鋼琴":["黑白","按鍵","彈","琴","音"],
    "牙刷":["牙","刷","早晚","清潔","嘴","毛"],
    "企鵝":["南極","搖","黑白","冰","鳥"],
    "便利商店":["二十四","營業","小店","買","超商","到處"],
    "捷運":["地下","電聯","城市","站","車廂","月台"],
    "籃球":["投","籃","橘","得分","球","拍"],
    "彩虹":["雨後","七色","彩","弧","天空"]
  };
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
      let round = 0, d, g, w, tries, wrongs = [];
      const box = h => { $("stage").innerHTML = `<div style="max-width:460px;margin:14px auto;text-align:center;line-height:1.8">${h}</div>`; };
      const info = () => msg(`${pn(1)} ${sc[1]} : ${sc[2]} ${pn(2)}`);
      const norm = s => s.replace(/\s/g, "");
      const leaks = (hint, word) => {
        const h = norm(hint), n = Math.min(2, word.length);
        for (let i = 0; i + n <= word.length; i++) if (h.includes(word.substr(i, n))) return true;
        return false;
      };

      /* ---- 電腦猜題:只看「分類」與「對手的描述」,不看答案 ---- */
      const cpuGuess = hint => {
        const h = norm(hint);
        let cands = WORDS.filter(x => x[1] === w[1] && !wrongs.includes(x[0]));
        if (!cands.length) cands = WORDS.filter(x => !wrongs.includes(x[0]));
        const score = x => {
          let s = 0;
          for (const k of (KW[x[0]] || [])) if (h.includes(k)) s += 2;
          for (const ch of new Set(x[0])) if (h.includes(ch)) s += 1;
          return s;
        };
        if (Math.random() > cpuSmart()) return pickOne(cands)[0];     // 失誤:亂猜
        let best = -1, pool = [];
        for (const x of cands) {
          const s = score(x);
          if (s > best) { best = s; pool = [x]; } else if (s === best) pool.push(x);
        }
        return pickOne(pool)[0];
      };

      const p0 = () => {
        d = round % 2 === 0 ? 1 : 2; g = 3 - d; w = ws[round]; tries = 0; wrongs = []; info();
        if (isCPU(2)) {
          if (d === 2) { p2(CPU_HINT[w[0]] || "一個很常見的東西"); return; }   // 電腦出題
          box(`<h3>第 ${round + 1}/${ROUNDS} 輪</h3><p>${pn(d)} 出題,${pn(g)} 來猜</p>
            <button id="gA" style="padding:12px 22px;font-size:1.1rem">顯示題目</button>`);
          $("gA").onclick = p1;
          return;
        }
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
      const p2 = (hint, tip) => {
        const cpuG = isCPU(g);
        box(`<p>${pn(g)} 來猜!分類:<b>${w[1]}</b></p>
          <div style="padding:12px;border-radius:12px;background:var(--card);margin:8px 0">「${hint.replace(/</g, "&lt;")}」</div>
          <p>第 ${tries + 1}/3 次</p>
          ${cpuG ? `<p>${pn(g)} 思考中…</p>` : `<input id="gI" autocomplete="off" style="padding:8px;font-size:1.1rem;width:60%">
          <button id="gG" style="padding:8px 16px">猜</button>`}
          <p id="gF" style="min-height:1.4em;color:#ff8a8a">${tip || ""}</p>`);
        const submit = v => {
          v = norm(v);
          if (!v) return;
          tries++;
          if (v === w[0]) { sc[g] += 4 - tries; return res(true); }
          if (tries >= 3) return res(false);
          wrongs.push(v);
          p2(hint, cpuG ? `${pn(g)} 猜「${v}」,不對!` : `不對!還有 ${3 - tries} 次機會`);
        };
        if (cpuG) {
          later(() => submit(cpuGuess(hint)), cpuDelay() + 800);
        } else {
          $("gG").onclick = () => submit($("gI").value);
          $("gI").onkeydown = e => { if (e.key === "Enter") submit($("gI").value); };
        }
      };
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

      /* 電腦(玩家2):每個音符事先決定「會不會按」與「按的時間誤差」 */
      const hitRate = [.7, .88, .97][cpuLevel-1], jit = [.1, .07, .035][cpuLevel-1];
      if (isCPU(2)) for (const n of S[2].notes) {
        n.cpuMiss = Math.random() > hitRate;
        n.cpuAt = n.t + rnd(-jit, jit);
        n.cpuTried = false;
      }

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
        if (isCPU(m[0])) return;                       // 電腦那邊真人按不了
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
        /* 電腦:時間到了就按該音符的軌道 */
        if (isCPU(2) && el > 0) {
          for (const n of S[2].notes) {
            if (n.done || n.cpuMiss || n.cpuTried || el < n.cpuAt) continue;
            n.cpuTried = true;
            press(2, n.lane);
          }
        }
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
      /* 電腦參數:移動速度、視野(掉到多低才開始反應)、瞄準誤差、漏接機率 */
      const cSpd = [190, 250, 320][cpuLevel-1], cSee = [.3, .15, 0][cpuLevel-1];
      const cErr = [30, 16, 6][cpuLevel-1], cSkip = [.3, .12, .03][cpuLevel-1];
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
          for (const p of [1,2]) {
            const it = { x, y:-10, e, sp };
            if (p === 2) { it.skip = Math.random() < cSkip; it.err = rnd(-cErr, cErr); }   // 電腦自己的失誤
            S[p].items.push(it);
          }
        }
        for (const p of [1,2]) {
          const s = S[p], k = keys[p];
          if (p === 2 && isCPU(2)) {
            /* 電腦:只看自己這邊的飲料,追最接近地面且沒放棄的那一顆 */
            let tgt = null;
            for (const it of s.items) {
              if (it.skip || it.y < H * cSee) continue;
              if (!tgt || it.y > tgt.y) tgt = it;
            }
            const goal = tgt ? tgt.x + tgt.err : PW / 2;
            const step = cSpd * dt, dx = goal - s.x;
            s.x = clamp(s.x + clamp(dx, -step, step), 36, PW - 36);
          } else {
            s.x = clamp(s.x + ((K[k[1]] ? 1 : 0) - (K[k[0]] ? 1 : 0)) * 320 * dt, 36, PW - 36);
          }
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