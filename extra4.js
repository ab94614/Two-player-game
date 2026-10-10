/* ========== 新增小遊戲 3：顏色搶答 / 記憶數列 / 比大小 ========== */
(function () {
  /* ---------- 顏色搶答 ---------- */
  const COLS = [["紅","#ff5d73"],["藍","#4da3ff"],["綠","#2ecc71"],["黃","#ffd34d"]];
  const colorQ = {
    name:"顏色搶答", icon:"🎨", desc:"點出字的「顏色」不是字義,先得 5 分",
    rules:[
      "畫面中央會出現一個字,例如用藍色寫的「紅」。",
      "你要點的是字的『顏色』(藍),不是字的意思(紅)。",
      "玩家1 點左邊按鈕,玩家2 點右邊按鈕。",
      "答對得 1 分,答錯鎖定 1.5 秒。先得 5 分者獲勝。"
    ],
    start(){
      const pts = {1:0,2:0}, lock = {1:false,2:false};
      let ans = 0, busy = false, over = false;
      $("stage").innerHTML = `<div id="cqw">
        <div id="pts" style="margin:8px"></div>
        <div class="big" id="cq" style="margin:10px;font-size:4rem"></div>
        <div class="arena"><div id="cb1"></div><div id="cb2"></div></div></div>`;
      const upd = () => $("pts").innerHTML = `${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)}`;
      const newQ = () => {
        const w = Math.floor(rnd(0,4));
        let k = Math.floor(rnd(0,4)); if (k === w) k = (k + 1 + Math.floor(rnd(0,3))) % 4;
        if (k === w) k = (w + 1) % 4;
        ans = k;
        $("cq").innerHTML = `<span style="color:${COLS[k][1]}">${COLS[w][0]}</span>`;
        for (const p of [1,2])
          $("cb"+p).innerHTML = COLS.map((c,i) =>
            `<button class="pad ${p===1?"a":"b"}" data-p="${p}" data-v="${i}" style="height:54px;width:100%;margin-bottom:8px;background:${c[1]};color:#12141f;font-weight:900">${c[0]}</button>`).join("");
        lock[1] = lock[2] = false; busy = false;
      };
      upd(); msg("搶答!點出字的『顏色』"); newQ();
      $("cqw").onpointerdown = e => {
        const b = e.target.closest("button[data-p]");
        if (!b || busy || over) return;
        const p = +b.dataset.p; if (lock[p]) return;
        if (+b.dataset.v === ans) {
          busy = true; pts[p]++; upd();
          if (pts[p] >= 5) { over = true; win(p, ` (${pts[1]} : ${pts[2]})`); return; }
          msg(`${pn(p)} 答對了!`);
          later(() => { msg("搶答!點出字的『顏色』"); newQ(); }, 800);
        } else {
          lock[p] = true; b.style.opacity = .3;
          msg(`${pn(p)} 答錯,鎖定 1.5 秒`);
          later(() => { lock[p] = false; }, 1500);
        }
      };
    }
  };

  /* ---------- 記憶數列 ---------- */
  const simon = {
    name:"記憶數列", icon:"🧠", desc:"記住閃爍順序,輪流重複,失誤者輸",
    rules:[
      "畫面會讓四個色塊依序閃爍,請記住順序。",
      "閃完後,玩家1 先照順序點一遍,再換玩家2。",
      "兩人都答對,下一關順序會多一格。",
      "有人點錯而對手答對,對手獲勝。兩人都錯則平手。"
    ],
    start(){
      const CL = ["#ff5d73","#4da3ff","#2ecc71","#ffd34d"];
      let seq = [], who = 1, idx = 0, lock = true, over = false, res = {};
      $("stage").innerHTML = `<div id="sq" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:300px;margin:16px auto">` +
        CL.map((c,i) => `<button data-c="${i}" style="height:110px;background:${c};opacity:.4"></button>`).join("") + `</div>`;
      const flash = (i, ms) => {
        const b = $("sq").children[i]; if (!b) return;
        b.style.opacity = 1;
        later(() => { if (b) b.style.opacity = .4; }, ms);
      };
      const showSeq = () => {
        lock = true; turnNow = 0; res = {};
        msg(`第 ${seq.length} 關,記住順序…`);
        seq.forEach((c,k) => later(() => flash(c, 450), 800 + k * 700));
        later(() => {
          who = 1; idx = 0; lock = false; turnNow = 1;
          msg(`輪到 ${pn(1)} 重複順序`);
        }, 800 + seq.length * 700);
      };
      const next = () => {
        if (who === 1) {
          who = 2; idx = 0; turnNow = 2; msg(`輪到 ${pn(2)} 重複順序`); return;
        }
        lock = true; turnNow = 0;
        if (res[1] && res[2]) {
          seq.push(Math.floor(rnd(0,4)));
          msg("兩人都答對!下一關…");
          later(showSeq, 1000);
        } else {
          over = true;
          win(res[1] === res[2] ? 0 : res[1] ? 1 : 2, ` (撐到第 ${seq.length} 關)`);
        }
      };
      $("sq").onclick = e => {
        const b = e.target.closest("button[data-c]");
        if (!b || lock || over) return;
        const c = +b.dataset.c; flash(c, 200);
        if (c !== seq[idx]) { res[who] = false; next(); return; }
        idx++;
        if (idx >= seq.length) { res[who] = true; next(); }
      };
      seq = [Math.floor(rnd(0,4))];
      showSeq();
    }
  };

  /* ---------- 比大小 ---------- */
  const cards = {
    name:"比大小", icon:"🃏", desc:"各有 1~9 的牌,輪流秘密出牌,共 9 回合",
    rules:[
      "雙方各有 1 到 9 共 9 張牌,每張只能用一次。",
      "每回合玩家1 先秘密出一張,再換玩家2 出一張。",
      "兩張牌一翻開,數字大的贏得該回合,一樣大則無人得分。",
      "9 回合後,贏下較多回合者獲勝。對手請別偷看!"
    ],
    start(){
      const hand = {1:[1,2,3,4,5,6,7,8,9], 2:[1,2,3,4,5,6,7,8,9]};
      const pts = {1:0,2:0}, pick = {};
      let who = 1, round = 1, lock = false;
      turnNow = 1;
      $("stage").innerHTML = `<div id="pts" style="margin:8px"></div>
        <div id="rbox" style="font-size:2.5rem;min-height:3.5rem"></div>
        <div id="hand" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:420px;margin:12px auto"></div>`;
      const upd = () => $("pts").innerHTML = `${pn(1)} ${pts[1]} : ${pts[2]} ${pn(2)} ・ 第 ${Math.min(round,9)} / 9 回合`;
      const draw = () => {
        $("hand").innerHTML = hand[who].map(n =>
          `<button data-n="${n}" style="width:64px;height:84px;font-size:1.8rem;background:var(--card)">${n}</button>`).join("");
      };
      const ask = () => msg(`${pn(who)} 請出牌(對手請別偷看)`);
      upd(); ask(); draw();
      $("hand").onclick = e => {
        const b = e.target.closest("button[data-n]"); if (!b || lock) return;
        const n = +b.dataset.n;
        pick[who] = n; hand[who] = hand[who].filter(x => x !== n);
        if (who === 1) {
          who = 2; turnNow = 2; $("rbox").textContent = "🙈"; ask(); draw(); return;
        }
        lock = true; turnNow = 0;
        const a = pick[1], c = pick[2];
        $("rbox").innerHTML = `<span class="p1">${a}</span> vs <span class="p2">${c}</span>`;
        $("hand").innerHTML = "";
        if (a === c) msg("這回合點數一樣");
        else { const w = a > c ? 1 : 2; pts[w]++; msg(`${pn(w)} 贏下此回合`); }
        upd();
        if (round >= 9) {
          later(() => win(pts[1] === pts[2] ? 0 : pts[1] > pts[2] ? 1 : 2, ` (${pts[1]} : ${pts[2]})`), 1200);
          return;
        }
        later(() => {
          round++; who = 1; turnNow = 1; lock = false;
          $("rbox").textContent = ""; upd(); ask(); draw();
        }, 1600);
      };
    }
  };

  /* ---------- 註冊到大廳 ---------- */
  [colorQ, simon, cards].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
