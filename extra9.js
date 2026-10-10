/* ========== 新增小遊戲 8:找不同 / 拼圖競速 / 21 點 ========== */
(function () {
  const BC = { 1:"#ff5d73", 2:"#4da3ff" };
  const panel = (p, pre) => `<div style="flex:1;max-width:320px;padding:8px;border:3px solid ${BC[p]};border-radius:14px">
    <div id="${pre}i${p}" style="font-weight:900;margin-bottom:6px"></div>
    <div id="${pre}b${p}"></div></div>`;
  const wrap = (id, html) => { $("stage").innerHTML = `<div id="${id}" style="display:flex;gap:14px;justify-content:center;margin:10px auto">${html}</div>`; };

  /* ---------- 找不同 ---------- */
  const spot = {
    name:"找不同", icon:"🔦", desc:"左右同一題,先找到不同的 emoji 得分",
    rules:[
      "左右兩塊棋盤是同一題,一堆相似的 emoji 裡混著 1 個不一樣的。",
      "玩家1 點左邊,玩家2 點右邊,先點到不同的那個得 1 分,並進入下一題。",
      "點錯會鎖定 0.8 秒。",
      "共 10 題,得分高者獲勝。"
    ],
    start(){
      const PAIRS = [["🙂","🙃"],["😀","😃"],["🐶","🐕"],["🌕","🌝"],["🍎","🍏"],["🐱","🐈"],["⭐","🌟"],["🔴","🟠"],["😠","😡"],["🍊","🍑"],["🕐","🕜"],["❤️","🧡"]];
      const ROUNDS = 10, N = 36;
      const sc = { 1:0, 2:0 }, lock = { 1:false, 2:false };
      let round = 0, odd = 0, pair = PAIRS[0], over = false;
      wrap("fdw", panel(1, "fd") + panel(2, "fd"));
      const draw = p => {
        if (!$("fdb" + p)) return;
        $("fdi" + p).innerHTML = `${pn(p)} ・ ${sc[p]} 分 ・ 第 ${round}/${ROUNDS} 題`;
        let h = "";
        for (let i = 0; i < N; i++)
          h += `<button data-p="${p}" data-i="${i}" style="height:42px;padding:0;font-size:1.3rem;background:var(--card)">${i === odd ? pair[1] : pair[0]}</button>`;
        $("fdb" + p).innerHTML = `<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px">${h}</div>`;
      };
      const next = () => {
        round++; lock[1] = lock[2] = false;
        pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
        odd = Math.floor(Math.random() * N);
        draw(1); draw(2);
        msg(`${pn(1)} ${sc[1]} : ${sc[2]} ${pn(2)} ・ 找出不一樣的!`);
      };
      next();
      $("fdw").onpointerdown = e => {
        const b = e.target.closest("button[data-i]"); if (!b || over) return;
        const p = +b.dataset.p, i = +b.dataset.i;
        if (lock[p]) return;
        if (i === odd) {
          sc[p]++;
          if (round >= ROUNDS) {
            over = true; draw(1); draw(2);
            win(sc[1] === sc[2] ? 0 : sc[1] > sc[2] ? 1 : 2, ` (${sc[1]} : ${sc[2]})`);
          } else next();
        } else {
          lock[p] = true; b.style.background = "#7a2b38";
          const r = round;
          setTimeout(() => { if (r === round && !over) { lock[p] = false; draw(p); } }, 800);
        }
      };
    }
  };

  /* ---------- 拼圖競速 ---------- */
  const puz = {
    name:"拼圖競速", icon:"🧩", desc:"3×3 滑動拼圖,先拼完者勝",
    rules:[
      "左右兩塊是同一個 3×3 滑動拼圖,有一格是空的。",
      "點空格旁邊的方塊,就會滑進空格。",
      "把數字排成 1~8 依序、最後一格留空。",
      "玩家1 玩左邊,玩家2 玩右邊,先拼完者獲勝。"
    ],
    start(){
      let t = [1,2,3,4,5,6,7,8,0], blank = 8, prev = -1;
      do {
        for (let k = 0; k < 120; k++) {
          const r = Math.floor(blank / 3), c = blank % 3, nb = [];
          if (r > 0) nb.push(blank - 3); if (r < 2) nb.push(blank + 3);
          if (c > 0) nb.push(blank - 1); if (c < 2) nb.push(blank + 1);
          const opts = nb.filter(x => x !== prev), m = opts[Math.floor(Math.random() * opts.length)];
          t[blank] = t[m]; t[m] = 0; prev = blank; blank = m;
        }
      } while (t.every((v, i) => v === (i + 1) % 9));
      const B = { 1:t.slice(), 2:t.slice() }, mv = { 1:0, 2:0 };
      let over = false;
      wrap("pzw", panel(1, "pz") + panel(2, "pz"));
      const draw = p => {
        $("pzi" + p).innerHTML = `${pn(p)} ・ 步數 ${mv[p]}`;
        $("pzb" + p).innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">` +
          B[p].map((v, i) => v
            ? `<button data-p="${p}" data-i="${i}" style="height:80px;font-size:1.8rem;font-weight:900;background:var(--card)">${v}</button>`
            : `<div style="height:80px"></div>`).join("") + `</div>`;
      };
      draw(1); draw(2); msg("先拼完 1~8 的人獲勝!");
      $("pzw").onpointerdown = e => {
        const b = e.target.closest("button[data-i]"); if (!b || over) return;
        const p = +b.dataset.p, i = +b.dataset.i, z = B[p].indexOf(0);
        const dr = Math.abs(Math.floor(i / 3) - Math.floor(z / 3)), dc = Math.abs(i % 3 - z % 3);
        if (dr + dc !== 1) return;
        B[p][z] = B[p][i]; B[p][i] = 0; mv[p]++;
        draw(p);
        if (B[p].every((v, k) => v === (k + 1) % 9)) { over = true; win(p, ` (${mv[p]} 步)`); }
      };
    }
  };

  /* ---------- 21 點 ---------- */
  const bj = {
    name:"21 點", icon:"🃏", desc:"輪流抽牌或停牌,不爆牌且點數大者勝",
    rules:[
      "輪流選擇「抽牌」或「停牌」,點數為牌面數字,J / Q / K 算 10,A 算 1。",
      "點數超過 21 就爆牌,直接輸。",
      "一方停牌後,另一方可繼續抽牌,直到停牌或爆牌。",
      "雙方都停牌後,點數大者獲勝,一樣大則平手。"
    ],
    start(){
      const H = { 1:[], 2:[] }, stood = { 1:false, 2:false };
      let turn = 1, over = false;
      const val = r => Math.min(r, 10);
      const sum = p => H[p].reduce((a, b) => a + b, 0);
      const card = () => Math.floor(Math.random() * 13) + 1;
      const lab = r => ({1:"A",11:"J",12:"Q",13:"K"}[r] || r);
      const hand = p => H[p].map(r => `<span style="display:inline-block;min-width:34px;padding:6px 4px;margin:2px;border-radius:6px;background:#fff;color:#222;font-weight:900;text-align:center">${lab(r)}</span>`).join("");
      H[1].push(card(), card()); H[2].push(card(), card());
      const pts = p => H[p].reduce((a, r) => a + val(r), 0);
      const draw = () => {
        const row = p => `<div style="flex:1;max-width:320px;padding:10px;border:3px solid ${BC[p]};border-radius:14px;${turn === p && !over ? "box-shadow:0 0 14px " + BC[p] : ""}">
          <div style="font-weight:900">${pn(p)} ・ <b style="font-size:1.4rem">${pts(p)}</b> 點 ${stood[p] ? "(已停牌)" : ""}</div>
          <div style="margin-top:8px">${hand(p)}</div></div>`;
        $("stage").innerHTML = `<div style="display:flex;gap:14px;justify-content:center;margin:10px auto">${row(1)}${row(2)}</div>
          <div style="text-align:center;margin-top:12px">${over ? "" : `<b>輪到 ${pn(turn)}</b><br>
          <button id="bjHit" style="margin:8px;padding:12px 22px;font-size:1.1rem">抽牌</button>
          <button id="bjStand" style="margin:8px;padding:12px 22px;font-size:1.1rem">停牌</button>`}</div>`;
        if (!over) { $("bjHit").onclick = hit; $("bjStand").onclick = stand; }
      };
      const nextTurn = () => {
        const o = 3 - turn;
        if (!stood[o]) turn = o;
      };
      const finish = () => {
        over = true; draw();
        const a = pts(1), b = pts(2);
        win(a === b ? 0 : a > b ? 1 : 2, ` (${a} : ${b})`);
      };
      const hit = () => {
        if (over) return;
        H[turn].push(card());
        if (pts(turn) > 21) {
          over = true; draw();
          win(3 - turn, ` (${pn(turn)} 爆牌 ${pts(turn)} 點)`);
          return;
        }
        if (pts(turn) === 21) stood[turn] = true;
        if (stood[1] && stood[2]) return finish();
        nextTurn(); draw();
      };
      const stand = () => {
        if (over) return;
        stood[turn] = true;
        if (stood[1] && stood[2]) return finish();
        nextTurn(); draw();
      };
      msg("抽牌或停牌,別超過 21 點!");
      draw();
    }
  };

  [spot, puz, bj].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
