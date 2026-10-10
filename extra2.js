/* ========== 新增小遊戲 2：下樓梯 / 隕石閃避 / 打地鼠 / 數字閃電 / 骰子對決 ========== */
(function () {
  const PW = 300, H = 400, GAP = 20, W = PW * 2 + GAP;
  const ox = p => p === 1 ? 0 : PW + GAP;
  const COL = { 1:"#ff5d73", 2:"#4da3ff" };
  // 固定種子的亂數:兩個視窗拿到一模一樣的關卡,才公平
  const mk = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const padLR = () => ctl(pad(1,[["◀","a"],["▶","d"]]) + pad(2,[["◀","arrowleft"],["▶","arrowright"]]));
  const axis = p => p === 1 ? (K["d"]?1:0) - (K["a"]?1:0) : (K["arrowright"]?1:0) - (K["arrowleft"]?1:0);

  /* 每個玩家一個獨立小視窗 */
  const panel = (c, p, fn) => {
    c.save(); c.beginPath(); c.rect(ox(p), 0, PW, H); c.clip(); c.translate(ox(p), 0);
    fn(); c.restore();
  };
  const hud = (c, left, right) => {
    c.font = "bold 16px sans-serif"; c.fillStyle = "#fff";
    c.textAlign = "left";  c.fillText(left, 8, 34);
    c.textAlign = "right"; c.fillText(right, PW - 8, 34);
    c.textAlign = "center";
  };

  /* ---------- 小朋友下樓梯 ---------- */
  const stairs = {
    name:"小朋友下樓梯", icon:"👦", desc:"左右兩個小視窗,各自往下踩樓梯",
    rules:[
      "畫面分成左右兩個小視窗,左邊是玩家1,右邊是玩家2,兩邊的樓梯一模一樣。",
      "樓梯會一直往上捲動,你要左右移動,落到下面的樓梯上。玩家1 用 A / D,玩家2 用 ← / →(手機點 ◀ ▶)。",
      "紫色是普通樓梯(踩上新樓梯回 1 滴血)。紅色有尖刺(扣 4 滴血)。綠色是彈簧會把你彈高。褐色是易碎樓梯,站太久會碎掉。",
      "碰到天花板的尖刺會扣 4 滴血,掉出畫面下方直接出局。",
      "血量歸零或掉出畫面就出局,但另一邊可以繼續玩,直到兩邊都出局為止。",
      "兩邊都出局後,下得比較深(層數較多)的人獲勝,層數相同則平手。"
    ],
    start(){
      const c = canvas(W, H, padLR());
      const PL = 70, pw = 18, ph = 22, seed = Date.now() & 0xffffff;
      const S = {};
      const newPlat = (rng, y) => {
        const x = rng() * (PW - PL), q = rng();
        return { x, y, t: q < .55 ? "n" : q < .70 ? "s" : q < .82 ? "b" : "f", used:false, timer:-1 };
      };
      for (const p of [1,2]) {
        const rng = mk(seed), pl = [];
        let y = 200;
        const first = newPlat(rng, y); first.x = PW/2 - PL/2; first.t = "n"; first.used = true; pl.push(first);
        while (y < H + 10) { y += 75; pl.push(newPlat(rng, y)); }
        S[p] = { rng, pl, x:PW/2 - pw/2, y:200 - ph, vy:0, hp:10, fl:0, alive:true, stand:first, inv:0 };
      }
      let el = 0, over = false;
      msg("玩家1:A / D 移動 ・ 玩家2:← / → 移動。往下踩樓梯,別碰天花板!");

      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) panel(c, p, () => {
          const s = S[p];
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          for (const q of s.pl) {
            c.globalAlpha = q.t === "f" && q.timer >= 0 ? .5 : 1;
            c.fillStyle = q.t==="n" ? "#8a93ff" : q.t==="s" ? "#c0392b" : q.t==="b" ? "#2ecc71" : "#b08968";
            c.fillRect(q.x, q.y, PL, 10);
            if (q.t === "s") {
              c.fillStyle = "#ffdddd";
              for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(q.x+i*12+1, q.y); c.lineTo(q.x+i*12+6, q.y-7); c.lineTo(q.x+i*12+11, q.y); c.fill(); }
            }
            c.globalAlpha = 1;
          }
          c.fillStyle = "#e74c3c";
          for (let i = 0; i < PW; i += 20) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i+10, 12); c.lineTo(i+20, 0); c.fill(); }
          if (s.alive && !(s.inv > 0 && Math.floor(s.inv * 10) % 2)) {
            c.fillStyle = COL[p]; c.fillRect(s.x, s.y, pw, ph);
            c.fillStyle = "#fff"; c.fillRect(s.x+4, s.y+5, 4, 4); c.fillRect(s.x+pw-8, s.y+5, 4, 4);
          }
          hud(c, `${names[p]} ❤️${Math.max(0, s.hp)}`, `地下 ${s.fl} 層`);
          if (!s.alive) {
            c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(0, 0, PW, H);
            c.fillStyle = "#fff"; c.font = "bold 32px sans-serif"; c.fillText("出局", PW/2, H/2 - 14);
            c.font = "bold 18px sans-serif"; c.fillText(`最終 ${s.fl} 層`, PW/2, H/2 + 20);
          }
        });
        c.strokeStyle = "#3a4070"; c.lineWidth = 2;
        c.strokeRect(1, 1, PW-2, H-2); c.strokeRect(PW+GAP+1, 1, PW-2, H-2);
      };
      draw();

      loop(dt => {
        if (over) return;
        el += dt;
        const sp = 45 + Math.min(70, el * 1.3);
        for (const p of [1,2]) {
          const s = S[p]; if (!s.alive) continue;
          s.inv = Math.max(0, s.inv - dt);
          s.x = clamp(s.x + axis(p) * 170 * dt, 0, PW - pw);
          for (const q of s.pl) q.y -= sp * dt;
          while (s.pl.length && s.pl[0].y < -20) s.pl.shift();
          let last = s.pl[s.pl.length - 1];
          while (last.y < H + 10) { last = newPlat(s.rng, last.y + 75); s.pl.push(last); }

          if (s.stand) {
            const q = s.stand;
            if (s.x + pw < q.x || s.x > q.x + PL || q.gone) s.stand = null;
            else {
              s.y = q.y - ph; s.vy = 0;
              if (q.t === "f") {
                q.timer -= dt;
                if (q.timer <= 0) { q.gone = true; s.pl.splice(s.pl.indexOf(q), 1); s.stand = null; }
              }
            }
          }
          if (!s.stand) {
            s.vy = Math.min(520, s.vy + 900 * dt);
            const prevB = s.y + ph; s.y += s.vy * dt;
            const b = s.y + ph;
            if (s.vy >= 0) for (const q of s.pl) {
              if (q.skip || s.x + pw <= q.x || s.x >= q.x + PL) continue;
              if (b >= q.y && prevB <= q.y + sp * dt + 3) {
                s.y = q.y - ph; s.vy = 0;
                if (!q.used) {
                  q.used = true; s.fl++;
                  if (q.t === "s") { s.hp -= 4; s.inv = .8; }
                  else if (s.hp < 10) s.hp++;
                }
                if (q.t === "b") { s.vy = -520; }
                else { s.stand = q; if (q.t === "f" && q.timer < 0) q.timer = .5; }
                break;
              }
            }
          }
          if (s.y < 12) {
            if (s.inv <= 0) { s.hp -= 4; s.inv = 1; }
            s.y = 12; s.vy = Math.max(s.vy, 60);
            if (s.stand) { s.stand.skip = true; s.stand = null; }
          }
          if (s.y > H) s.hp = 0;
          if (s.hp <= 0) s.alive = false;
        }
        if (!S[1].alive && !S[2].alive) {
          over = true;
          const w = S[1].fl === S[2].fl ? 0 : S[1].fl > S[2].fl ? 1 : 2;
          win(w, ` (${S[1].fl} : ${S[2].fl} 層)`);
        } else if (!S[1].alive || !S[2].alive) {
          const d = S[1].alive ? 2 : 1;
          msg(`${pn(d)} 出局(${S[d].fl} 層),${pn(3 - d)} 繼續挑戰!`);
        }
        draw();
      });
    }
  };

  /* ---------- 隕石閃避 ---------- */
  const dodge = {
    name:"隕石閃避", icon:"☄️", desc:"左右兩個小視窗,躲同一場隕石雨",
    rules:[
      "畫面分成左右兩個小視窗,兩邊掉下來的隕石完全一樣。",
      "玩家1 用 A / D 左右移動,玩家2 用 ← / →(手機點 ◀ ▶)。",
      "每人有 3 條命,被隕石砸到扣 1 條,之後有短暫無敵時間。",
      "隕石會越來越多、越來越快。先被砸光 3 條命的人輸,同時出局則平手。"
    ],
    start(){
      const c = canvas(W, H, padLR());
      const rng = mk(Date.now() & 0xffffff);
      const S = {
        1:{ x:PW/2, hp:3, inv:0, rocks:[] },
        2:{ x:PW/2, hp:3, inv:0, rocks:[] }
      };
      let el = 0, sp = 0, over = false;
      msg("玩家1:A / D ・ 玩家2:← / →。躲開隕石!");
      const draw = () => {
        c.fillStyle = "#12141f"; c.fillRect(0, 0, W, H);
        for (const p of [1,2]) panel(c, p, () => {
          const s = S[p];
          c.fillStyle = "#0d1020"; c.fillRect(0, 0, PW, H);
          c.font = "28px sans-serif";
          for (const r of s.rocks) c.fillText("☄️", r.x, r.y);
          if (s.hp > 0 && !(s.inv > 0 && Math.floor(s.inv * 10) % 2)) {
            c.fillStyle = COL[p]; c.fillRect(s.x - 12, H - 40, 24, 28);
            c.fillStyle = "#fff"; c.fillRect(s.x - 7, H - 33, 4, 4); c.fillRect(s.x + 3, H - 33, 4, 4);
          }
          hud(c, `${names[p]} ❤️${Math.max(0, s.hp)}`, `${Math.floor(el)} 秒`);
          if (s.hp <= 0) {
            c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(0, 0, PW, H);
            c.fillStyle = "#fff"; c.font = "bold 32px sans-serif"; c.fillText("出局", PW/2, H/2);
          }
        });
        c.strokeStyle = "#3a4070"; c.lineWidth = 2;
        c.strokeRect(1, 1, PW-2, H-2); c.strokeRect(PW+GAP+1, 1, PW-2, H-2);
      };
      draw();
      let spawnT = 0;
      loop(dt => {
        if (over) return;
        el += dt; spawnT -= dt;
        sp = 150 + Math.min(250, el * 6);
        if (spawnT <= 0) {
          spawnT = Math.max(.22, .7 - el * .01);
          const r = { x: rnd(20, PW - 20) * 0 + 20 + rng() * (PW - 40), v: sp * (.8 + rng() * .5) };
          for (const p of [1,2]) S[p].rocks.push({ x:r.x, y:-20, v:r.v });
        }
        for (const p of [1,2]) {
          const s = S[p]; if (s.hp <= 0) continue;
          s.inv = Math.max(0, s.inv - dt);
          s.x = clamp(s.x + axis(p) * 230 * dt, 14, PW - 14);
          s.rocks = s.rocks.filter(r => {
            r.y += r.v * dt;
            if (r.y > H + 20) return false;
            if (s.inv <= 0 && Math.abs(r.x - s.x) < 22 && r.y > H - 56 && r.y < H - 8) {
              s.hp--; s.inv = 1.2; return false;
            }
            return true;
          });
        }
        if (S[1].hp <= 0 || S[2].hp <= 0) {
          over = true;
          win(S[1].hp <= 0 && S[2].hp <= 0 ? 0 : S[1].hp <= 0 ? 2 : 1, ` (撐了 ${Math.floor(el)} 秒)`);
        }
        draw();
      });
    }
  };

  /* ---------- 打地鼠 ---------- */
  const whack = {
    name:"打地鼠", icon:"🐹", desc:"各自一個地洞區,點地鼠別點炸彈",
    rules:[
      "左邊是玩家1 的 3×3 地洞,右邊是玩家2 的,兩邊出現的位置一模一樣。",
      "點到 🐹 得 1 分,點到 💣 扣 2 分。",
      "30 秒後分數高的人獲勝。",
      "用滑鼠或手指直接點自己那一邊的地洞。"
    ],
    start(){
      const rng = mk(Date.now() & 0xffffff);
      const pts = {1:0,2:0};
      const cells = {1:Array(9).fill(null), 2:Array(9).fill(null)};
      let t = 30, spawnT = 0, over = false;
      const grid = p => `<div data-p="${p}" style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px;border-radius:16px;border:3px solid ${COL[p]};background:${p===1?"rgba(255,93,115,.12)":"rgba(77,163,255,.12)"}">` +
        Array.from({length:9}, (_, i) =>
          `<button class="pad ${p===1?"a":"b"}" data-p="${p}" data-i="${i}" style="height:76px;font-size:2rem;background:${p===1?"#5a2a33":"#223a5c"};padding:0"></button>`).join("") + `</div>`;
      $("stage").innerHTML = `<div class="big" id="timer">30</div><div id="pts" style="margin:6px"></div>
        <div class="arena" id="wk" style="gap:32px;align-items:flex-start">${grid(1)}${grid(2)}</div>`;
      const upd = () => $("pts").innerHTML = `${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`;
      const paint = () => {
        for (const p of [1,2]) {
          const bs = document.querySelectorAll(`#wk button[data-p="${p}"]`);
          cells[p].forEach((v, i) => bs[i].textContent = v ? (v.t === "m" ? "🐹" : "💣") : "");
        }
      };

      upd(); paint(); msg("點 🐹 得分,別點 💣!");
      $("wk").onpointerdown = e => {
        const b = e.target.closest("button[data-i]"); if (!b || over) return;
        const p = +b.dataset.p, i = +b.dataset.i, v = cells[p][i];
        if (!v) return;
        pts[p] += v.t === "m" ? 1 : -2; cells[p][i] = null; upd(); paint();
      };
      loop(dt => {
        if (over) return;
        t -= dt; $("timer").textContent = Math.max(0, Math.ceil(t));
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(.35, .8 - (30 - t) * .012);
          const i = Math.floor(rng() * 9), bomb = rng() < .25;
          for (const p of [1,2]) cells[p][i] = { t: bomb ? "b" : "m", ttl: 1.1 };
        }
        for (const p of [1,2]) cells[p].forEach((v, i) => { if (v && (v.ttl -= dt) <= 0) cells[p][i] = null; });
        paint();
        if (t <= 0) {
          over = true; $("timer").textContent = 0;
          win(pts[1] === pts[2] ? 0 : pts[1] > pts[2] ? 1 : 2, ` (${pts[1]} : ${pts[2]})`);
        }
      });
    }
  };

  /* ---------- 數字閃電 ---------- */
  const rush = {
    name:"數字閃電", icon:"🔟", desc:"各自一個 4×4 棋盤,依序點 1 到 16",
    rules:[
      "左邊是玩家1 的棋盤,右邊是玩家2 的,各有 1 到 16 的數字,排列位置不同。",
      "從 1 開始,依序點到 16。點錯的數字沒有反應。",
      "先完成 16 的人獲勝。",
      "用滑鼠或手指直接點自己那一邊的數字。"
    ],
    start(){
      const next = {1:1, 2:1}; let over = false;
      const shuf = () => Array.from({length:16}, (_, i) => i + 1).sort(() => Math.random() - .5);
      const grid = p => `<div data-p="${p}" style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px">` +
        shuf().map(n => `<button class="pad ${p===1?"a":"b"}" data-p="${p}" data-n="${n}" style="height:56px;font-size:1.2rem;padding:0">${n}</button>`).join("") + `</div>`;
      $("stage").innerHTML = `<div id="pts" style="margin:8px"></div>
        <div class="arena" id="rs"><div>${grid(1)}</div><div>${grid(2)}</div></div>`;
      const upd = () => $("pts").innerHTML = `${pn(1)} 找 ${Math.min(16, next[1])} ・ ${pn(2)} 找 ${Math.min(16, next[2])}`;
      upd(); msg("依序點 1 到 16,最快完成者獲勝!");
      $("rs").onpointerdown = e => {
        const b = e.target.closest("button[data-n]"); if (!b || over) return;
        const p = +b.dataset.p;
        if (+b.dataset.n !== next[p]) return;
        b.style.opacity = .25; b.disabled = true; next[p]++; upd();
        if (next[p] > 16) { over = true; win(p); }
      };
    }
  };

  /* ---------- 骰子對決 ---------- */
  const dice = {
    name:"骰子對決", icon:"🎲", desc:"輪流擲兩顆骰子,點數大贏回合",
    rules:[
      "玩家1 先擲兩顆骰子,再換玩家2 擲。",
      "兩顆點數相加比較大的人贏得該回合,點數一樣則重擲。",
      "先贏 3 回合者獲勝。",
      "輪到你時點「擲骰子」按鈕。"
    ],
    start(){
      const F = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
      const pts = {1:0,2:0}, res = {}; let who = 1, lock = false;
      turnNow = 1;
      $("stage").innerHTML = `<style>
          @keyframes dshake{0%{transform:rotate(-16deg) translateY(0)}50%{transform:rotate(16deg) translateY(-14px)}100%{transform:rotate(-16deg) translateY(0)}}
          .dd{display:inline-block;animation:dshake .18s infinite}
        </style>
        <div id="pts" style="margin:8px"></div>
        <div id="dr" style="font-size:3.4rem;min-height:5rem;line-height:1.3"></div>
        <button id="roll" style="font-size:1.3rem;padding:14px 30px">🎲 擲骰子</button>`;
      const upd = () => $("pts").innerHTML = `${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`;
      const r6 = () => 1 + Math.floor(Math.random() * 6);
      upd(); msg(`輪到 ${pn(1)} 擲骰子`);

      $("roll").onclick = () => {
        if (lock) return;
        lock = true;
        const me = who;
        let n = 0;
        const iv = setInterval(() => {
          if (!$("dr")) { clearInterval(iv); return; }   // 已離開遊戲
          n++;
          $("dr").innerHTML = `${pn(me)}:<span class="dd">${F[r6()]}</span> <span class="dd">${F[r6()]}</span>`;
          if (n < 10) return;
          clearInterval(iv);

          const a = r6(), b = r6();
          res[me] = a + b;
          $("dr").innerHTML = `${pn(me)}:${F[a]} ${F[b]} = ${a + b}`;
          if (me === 1) { who = 2; turnNow = 2; lock = false; msg(`輪到 ${pn(2)} 擲骰子`); return; }

          turnNow = 1;
          later(() => {
            $("dr").innerHTML = `${pn(1)} ${res[1]} vs ${res[2]} ${pn(2)}`;
            if (res[1] === res[2]) msg("點數相同,重擲!");
            else {
              const w = res[1] > res[2] ? 1 : 2; pts[w]++; upd();
              if (pts[w] >= 3) { turnNow = 0; msg(`🏆 ${pn(w)} 贏得比賽!`); addScore(w); return; }
              msg(`${pn(w)} 贏下此回合`);
            }
            later(() => { lock = false; who = 1; turnNow = 1; $("dr").textContent = ""; msg(`輪到 ${pn(1)} 擲骰子`); }, 1500);
          }, 900);
        }, 90);
      };
    }
  };


  /* ---------- 註冊到大廳 ---------- */
  [stairs, dodge, whack, rush, dice].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
