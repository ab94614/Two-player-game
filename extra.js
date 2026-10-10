/* ========== 新增小遊戲：五子棋 / 終極密碼 / 雙人對射 / 快算對決 / 拔河 ========== */
(function () {
  const st = document.createElement("style");
  st.textContent = `
  .gm{display:grid;grid-template-columns:repeat(13,1fr);gap:1px;background:#8a5a2b;padding:6px;border-radius:10px;max-width:460px;margin:auto}
  .gm i{aspect-ratio:1;background:#e0b878;display:flex;align-items:center;justify-content:center;cursor:pointer}
  .gm i b{width:78%;height:78%;border-radius:50%;display:block}
  .gm i b.a{background:#ff5d73}.gm i b.b{background:#4da3ff}
  .gm i.last{outline:2px solid #fff;outline-offset:-2px}
  .nums{display:grid;grid-template-columns:repeat(auto-fill,minmax(48px,1fr));gap:6px;max-width:500px;margin:auto}
  .nums button{padding:8px 0;background:var(--card)}`;
  document.head.appendChild(st);

  /* ---------- 五子棋 ---------- */
  const gomoku = {
    name:"五子棋", icon:"⚫", desc:"輪流落子,先連成五子者勝",
    start(){
      const N = 13; let b = Array(N*N).fill(0), turn = 1, over = false, last = -1;
      turnNow = 1;
      $("stage").innerHTML = '<div class="gm" id="gm"></div>';
      const g = $("gm");
      const draw = () => g.innerHTML = b.map((v,i) =>
        `<i data-i="${i}" class="${i===last?"last":""}">${v ? `<b class="${v===1?"a":"b"}"></b>` : ""}</i>`).join("");
      const five = i => {
        const x = i % N, y = (i / N) | 0, p = b[i];
        for (const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]) {
          let n = 1;
          for (const s of [1,-1]) {
            let cx = x+dx*s, cy = y+dy*s;
            while (cx>=0 && cy>=0 && cx<N && cy<N && b[cy*N+cx]===p) { n++; cx += dx*s; cy += dy*s; }
          }
          if (n >= 5) return true;
        }
        return false;
      };
      const label = () => msg(`輪到 ${pn(turn)} (${turn===1?"紅":"藍"})`);
      label(); draw();
      g.onclick = e => {
        const c = e.target.closest("i"); if (over || !c) return;
        const i = +c.dataset.i; if (b[i]) return;
        b[i] = turn; last = i; draw();
        if (five(i)) { over = true; turnNow = 0; win(turn); return; }
        if (b.every(x => x)) { over = true; turnNow = 0; msg("平手!"); return; }
        turn = 3 - turn; turnNow = turn; label();
      };
    }
  };

  /* ---------- 終極密碼 ---------- */
  const ultimate = {
    name:"終極密碼", icon:"🔢", desc:"輪流猜數字,猜中密碼的人輸",
    start(){
      let lo = 1, hi = 99, secret = Math.floor(rnd(1,100)), turn = 1, over = false;
      turnNow = 1;
      $("stage").innerHTML = '<div id="rg" style="font-size:2rem;font-weight:900;margin:8px"></div><div class="nums" id="nums"></div>';
      const label = () => msg(`輪到 ${pn(turn)} 選一個數字(猜中密碼就輸)`);
      const draw = () => {
        $("rg").textContent = `${lo} ~ ${hi}`;
        let h = ""; for (let n = lo; n <= hi; n++) h += `<button data-n="${n}">${n}</button>`;
        $("nums").innerHTML = h;
      };
      label(); draw();
      $("nums").onclick = e => {
        const b = e.target.closest("button"); if (over || !b) return;
        const n = +b.dataset.n;
        if (n === secret) {
          over = true; turnNow = 0; $("rg").textContent = `💥 密碼是 ${secret}`;
          win(3 - turn, ` (${esc(names[turn])} 猜中密碼)`); return;
        }
        if (n < secret) lo = n + 1; else hi = n - 1;
        turn = 3 - turn; turnNow = turn; label(); draw();
      };
    }
  };

  /* ---------- 雙人對射 ---------- */
  const duel = {
    name:"雙人對射", icon:"🔫", desc:"上下移動閃躲並射擊,中間有移動的牆",
    start(){
      const W = 600, H = 360, SH = 56, WH = 100;
      const c = canvas(W, H,
        ctl(pad(1,[["▲","w"],["▼","s"],["發射 F","f"]]) + pad(2,[["▲","arrowup"],["▼","arrowdown"],["發射 ⏎","enter"]])));
      const pl = {
        1:{x:30,   y:H/2, hp:5, cd:0, dir:1,  col:"#ff5d73"},
        2:{x:W-30, y:H/2, hp:5, cd:0, dir:-1, col:"#4da3ff"}
      };
      let bl = [], over = false, wy = H/2, wv = 70;
      const info = () => msg(`${pn(1)} ❤️${pl[1].hp} ・ ${pn(2)} ❤️${pl[2].hp}`);
      info();
      const fire = p => {
        const s = pl[p]; if (over || s.cd > 0) return;
        s.cd = .4; bl.push({x:s.x + s.dir*20, y:s.y, vx:s.dir*420, o:p});
      };
      keyHandler = e => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();
        if (k === "f") fire(1);
        if (k === "enter") fire(2);
      };
      loop(dt => {
        if (over) return;
        const sp = 240 * dt;
        if (K["w"]) pl[1].y -= sp;
        if (K["s"]) pl[1].y += sp;
        if (K["arrowup"]) pl[2].y -= sp;
        if (K["arrowdown"]) pl[2].y += sp;
        for (const p of [1,2]) { pl[p].y = clamp(pl[p].y, SH/2, H-SH/2); pl[p].cd = Math.max(0, pl[p].cd - dt); }
        wy += wv * dt;
        if (wy < WH/2 || wy > H-WH/2) { wv *= -1; wy = clamp(wy, WH/2, H-WH/2); }

        bl = bl.filter(b => {
          b.x += b.vx * dt;
          if (b.x < 0 || b.x > W) return false;
          if (Math.abs(b.x - W/2) < 8 && Math.abs(b.y - wy) < WH/2) return false;   // 撞牆
          const t = pl[3 - b.o];
          if (Math.abs(b.x - t.x) < 14 && Math.abs(b.y - t.y) < SH/2) {
            t.hp--; info();
            if (t.hp <= 0 && !over) { over = true; win(b.o); }
            return false;
          }
          return true;
        });

        c.fillStyle = "#0d1020"; c.fillRect(0,0,W,H);
        c.fillStyle = "#8a93ff"; c.fillRect(W/2-8, wy-WH/2, 16, WH);
        for (const p of [1,2]) {
          c.fillStyle = pl[p].col; c.fillRect(pl[p].x-10, pl[p].y-SH/2, 20, SH);
        }
        c.fillStyle = "#ffd34d";
        bl.forEach(b => c.fillRect(b.x-6, b.y-2, 12, 4));
      });
    }
  };

  /* ---------- 快算對決 ---------- */
  const quiz = {
    name:"快算對決", icon:"🧮", desc:"搶答數學題,先得 5 分(答錯鎖定 1.5 秒)",
    start(){
      const pts = {1:0,2:0}, lock = {1:false,2:false};
      let ans = 0, busy = false, over = false;
      $("stage").innerHTML = `<div id="qz">
        <div id="pts" style="margin:8px"></div>
        <div class="big" id="qq" style="margin:10px"></div>
        <div class="arena"><div id="qa1"></div><div id="qa2"></div></div></div>`;
      const upd = () => $("pts").innerHTML = `${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`;
      const newQ = () => {
        const t = Math.floor(rnd(0,3));
        let a = Math.floor(rnd(2,13)), b = Math.floor(rnd(2,13)), q, r;
        if (t === 0) { q = `${a} + ${b}`; r = a + b; }
        else if (t === 1) { const x = Math.max(a,b), y = Math.min(a,b); q = `${x} − ${y}`; r = x - y; }
        else { a = Math.floor(rnd(2,10)); b = Math.floor(rnd(2,10)); q = `${a} × ${b}`; r = a * b; }
        ans = r;
        const s = new Set([r]);
        while (s.size < 4) {
          const d = Math.floor(rnd(1,10)) * (Math.random() < .5 ? -1 : 1);
          if (r + d >= 0) s.add(r + d);
        }
        const opts = [...s].sort(() => Math.random() - .5);
        $("qq").textContent = q + " = ?";
        for (const p of [1,2])
          $("qa"+p).innerHTML = opts.map(o =>
            `<button class="pad ${p===1?"a":"b"}" data-p="${p}" data-v="${o}" style="height:54px;width:100%;margin-bottom:8px">${o}</button>`).join("");
        busy = false;
      };
      upd(); msg("搶答!選出正確答案"); newQ();
      $("qz").onpointerdown = e => {
        const b = e.target.closest("button[data-p]");
        if (!b || busy || over) return;
        const p = +b.dataset.p; if (lock[p]) return;
        if (+b.dataset.v === ans) {
          busy = true; pts[p]++; upd();
          if (pts[p] >= 5) { over = true; win(p, ` (${pts[1]} : ${pts[2]})`); return; }
          msg(`${pn(p)} 答對了!`);
          later(() => { msg("搶答!選出正確答案"); newQ(); }, 900);
        } else {
          lock[p] = true; b.style.opacity = .3;
          msg(`${pn(p)} 答錯,鎖定 1.5 秒`);
          later(() => { lock[p] = false; }, 1500);
        }
      };
    }
  };

  /* ---------- 拔河 ---------- */
  const tug = {
    name:"拔河", icon:"💪", desc:"狂按自己的按鍵把繩子拉到你這邊",
    start(){
      let pos = 50, running = false, over = false;
      $("stage").innerHTML = `
        <div style="position:relative;height:40px;margin:22px 0;background:linear-gradient(90deg,#7a2b38 50%,#2b5586 50%);border-radius:20px">
        <div id="tm" style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);font-size:2.4rem">🚩</div>
        </div>
        <button id="go">開始!</button>
        <div class="arena">
          <button class="pad a" data-p="1">玩家1<br>(狂按 A)</button>
          <button class="pad b" data-p="2">玩家2<br>(狂按 L)</button>
        </div>`;
      msg("按下開始後倒數 3 秒,把繩子拉到你那一側盡頭");
      const move = () => { $("tm").style.left = pos + "%"; };
      const pull = p => {
        if (!running || over) return;
        pos = clamp(pos + (p === 1 ? -2.5 : 2.5), 0, 100); move();
        if (pos <= 0 || pos >= 100) {
          over = true; running = false; $("go").disabled = false; $("go").textContent = "再來一次";
          win(pos <= 0 ? 1 : 2);
        }
      };
      document.querySelectorAll(".pad").forEach(b => b.onpointerdown = () => pull(+b.dataset.p));
      keyHandler = e => { if (e.repeat) return; const k = e.key.toLowerCase(); if (k==="a") pull(1); if (k==="l") pull(2); };
      $("go").onclick = () => {
        if (running) return;
        pos = 50; over = false; move(); $("go").disabled = true;
        let n = 3;
        const cd = () => {
          if (n > 0) { msg(`準備… ${n}`); n--; later(cd, 1000); }
          else { running = true; msg("拉!!!"); }
        };
        cd();
      };
    }
  };

  /* ---------- 註冊到大廳 ---------- */
  [gomoku, ultimate, duel, quiz, tug].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
