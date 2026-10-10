/* ========== 新增小遊戲 9:猜單字 / 回合制小對戰 / 顏色搶答進階版 ========== */
(function () {
  const BC = { 1:"#ff5d73", 2:"#4da3ff" };
  const panel = (p, pre) => `<div style="flex:1;max-width:320px;padding:8px;border:3px solid ${BC[p]};border-radius:14px">
    <div id="${pre}i${p}" style="font-weight:900;margin-bottom:6px"></div>
    <div id="${pre}b${p}"></div></div>`;

  /* ---------- 猜單字對戰 ---------- */
  const WORDS = ["APPLE","BREAD","CHAIR","DANCE","EARTH","FLAME","GRAPE","HOUSE","JUICE","LEMON","MOUSE","NIGHT","OCEAN","PIANO","QUEEN","RIVER","SMILE","TIGER","UNCLE","WATER","ZEBRA","CLOUD","BEACH","TRAIN","PLANT","LIGHT","STONE","MUSIC","SUGAR","PAPER","ROBOT","CANDY","DREAM","FROST","GHOST","HEART","MAGIC","PIZZA","SHEEP","WORLD"];
  const grade = (g, a) => {
    const res = Array(5).fill(0), left = {};
    for (let i = 0; i < 5; i++) { if (g[i] === a[i]) res[i] = 2; else left[a[i]] = (left[a[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) if (!res[i] && left[g[i]] > 0) { res[i] = 1; left[g[i]]--; }
    return res;
  };
  const wordle = {
    name:"猜單字對戰", icon:"🔤", desc:"同一個英文單字,先猜中者勝",
    rules:[
      "左右是同一個 5 字母英文單字,各有 6 次機會。",
      "輸入 5 個英文字母後按「送出」或 Enter。",
      "綠色:字母和位置都對。黃色:字母有但位置不對。灰色:沒有這個字母。",
      "先猜中者獲勝,雙方都沒猜中則平手。"
    ],
    start(){
      const ans = WORDS[Math.floor(Math.random() * WORDS.length)];
      const G = { 1:[], 2:[] }, done = { 1:false, 2:false };
      let over = false;
      $("stage").innerHTML = `<div style="display:flex;gap:14px;justify-content:center;margin:10px auto">${panel(1,"wd")}${panel(2,"wd")}</div>`;
      const COLORS = ["#3a3f5c", "#c9a227", "#2e9e5b"];
      const draw = p => {
        $("wdi" + p).innerHTML = `${pn(p)} ・ ${G[p].length}/6`;
        let h = "";
        for (let r = 0; r < 6; r++) {
          const g = G[p][r], res = g ? grade(g, ans) : null;
          h += `<div style="display:flex;gap:4px;margin-bottom:4px">`;
          for (let i = 0; i < 5; i++)
            h += `<div style="flex:1;height:40px;line-height:40px;text-align:center;font-weight:900;border-radius:6px;background:${res ? COLORS[res[i]] : "var(--card)"};color:#fff">${g ? g[i] : ""}</div>`;
          h += `</div>`;
        }
        h += done[p] || over ? "" : `<div style="display:flex;gap:6px;margin-top:6px">
          <input id="wdin${p}" maxlength="5" autocomplete="off" autocapitalize="characters" style="flex:1;min-width:0;padding:8px;font-size:1.1rem;text-transform:uppercase">
          <button id="wdgo${p}" style="padding:8px 12px">送出</button></div>`;
        $("wdb" + p).innerHTML = h;
        if (!done[p] && !over) {
          const submit = () => {
            const v = $("wdin" + p).value.toUpperCase().trim();
            if (!/^[A-Z]{5}$/.test(v)) { msg("請輸入 5 個英文字母"); return; }
            G[p].push(v);
            if (v === ans) { over = true; draw(1); draw(2); win(p, ` (答案 ${ans})`); return; }
            if (G[p].length >= 6) done[p] = true;
            draw(p);
            if (done[1] && done[2]) { over = true; draw(1); draw(2); win(0, ` (答案 ${ans})`); }
          };
          $("wdgo" + p).onclick = submit;
          $("wdin" + p).onkeydown = e => { if (e.key === "Enter") submit(); };
        }
      };
      draw(1); draw(2); msg("先猜出單字的人獲勝!");
    }
  };

  /* ---------- 回合制小對戰 ---------- */
  const duel = {
    name:"回合制小對戰", icon:"⚔️", desc:"攻擊、防禦、回血,雙方祕密選擇",
    rules:[
      "雙方各 20 血。每回合先後祕密選擇「攻擊 / 防禦 / 回血」,再同時揭曉。",
      "攻擊勝回血:回血失敗,還會被打 5 點。",
      "防禦勝攻擊:擋下攻擊,並反擊 3 點。",
      "回血勝防禦:回復 4 點血。雙方選一樣:都攻擊各損 5 點,都回血各 +4 點,都防禦無事。",
      "先把對手打到 0 血者勝,最多 15 回合,之後比剩餘血量。"
    ],
    start(){
      const HP = { 1:20, 2:20 }, MAX = 20, ROUNDS = 15;
      const NAME = { A:"⚔️ 攻擊", D:"🛡️ 防禦", H:"💚 回血" };
      let round = 1, pick = null, log = "", over = false;
      const bar = p => `<div style="flex:1;max-width:320px;padding:10px;border:3px solid ${BC[p]};border-radius:14px">
        <div style="font-weight:900">${pn(p)} ・ ${HP[p]} / ${MAX}</div>
        <div style="height:14px;background:#222;border-radius:7px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${HP[p] / MAX * 100}%;background:${BC[p]}"></div></div></div>`;
      const show = who => {
        $("stage").innerHTML = `<div style="display:flex;gap:14px;justify-content:center;margin:10px auto">${bar(1)}${bar(2)}</div>
          <div style="text-align:center;margin-top:10px">
            <div style="min-height:48px;margin-bottom:8px">${log}</div>
            ${over ? "" : `<b>第 ${round}/${ROUNDS} 回合 ・ 輪到 ${pn(who)} 選擇</b> <small>(對手請先別看)</small><br>
            ${["A","D","H"].map(k => `<button data-k="${k}" style="margin:8px;padding:12px 18px;font-size:1.1rem">${NAME[k]}</button>`).join("")}`}</div>`;
        if (!over) $("stage").querySelectorAll("button[data-k]").forEach(b => b.onclick = () => choose(who, b.dataset.k));
      };
      const resolve = (a, b) => {
        const d = { 1:0, 2:0 }; let t;
        if (a === b) {
          if (a === "A") { d[1] -= 5; d[2] -= 5; t = "雙方互砍,各損 5 點"; }
          else if (a === "H") { d[1] += 4; d[2] += 4; t = "雙方回血,各 +4"; }
          else t = "雙方防禦,沒事發生";
        } else {
          const w = (x, y) => (a === x && b === y) ? 1 : (b === x && a === y) ? 2 : 0;
          let p;
          if ((p = w("A","H"))) { d[3 - p] -= 5; t = `${pn(p)} 攻擊成功,${pn(3 - p)} 損 5 點`; }
          else if ((p = w("D","A"))) { d[3 - p] -= 3; t = `${pn(p)} 擋下攻擊並反擊,${pn(3 - p)} 損 3 點`; }
          else { p = w("H","D"); d[p] += 4; t = `${pn(p)} 成功回血 +4`; }
        }
        HP[1] = Math.min(MAX, Math.max(0, HP[1] + d[1]));
        HP[2] = Math.min(MAX, Math.max(0, HP[2] + d[2]));
        return t;
      };
      const choose = (who, k) => {
        if (over) return;
        if (who === 1) { pick = k; log = `${pn(1)} 已選擇,換 ${pn(2)}`; show(2); return; }
        const a = pick, b = k; pick = null;
        const t = resolve(a, b);
        log = `${pn(1)} ${NAME[a]} vs ${pn(2)} ${NAME[b]}<br><b>${t}</b>`;
        if (HP[1] <= 0 || HP[2] <= 0 || round >= ROUNDS) {
          over = true; show(1);
          const r = HP[1] === HP[2] ? 0 : HP[1] > HP[2] ? 1 : 2;
          win(r, ` (${HP[1]} : ${HP[2]} 血)`);
          return;
        }
        round++; show(1);
      };
      msg("祕密選擇,同時揭曉!");
      show(1);
    }
  };

  /* ---------- 顏色搶答進階版 ---------- */
  const CL = [["紅","#ff4d4d"],["藍","#4da3ff"],["綠","#3ddc84"],["黃","#ffd34d"]];
  const color2 = {
    name:"顏色搶答 Pro", icon:"🎨", desc:"連續出題,題型多變、按鈕洗牌",
    rules:[
      "連續 12 題。畫面中央會出現一個字,並標明這題要「按字義」或「按顏色」。",
      "字義:字寫什麼就選什麼。顏色:字用什麼顏色寫就選什麼。",
      "兩邊按鈕位置每題都會洗牌,按鈕上的字也會用錯誤的顏色來騙你。",
      "先答對得 1 分,答錯鎖定 1 秒。12 題後分高者勝。"
    ],
    start(){
      const ROUNDS = 12, sc = { 1:0, 2:0 }, lock = { 1:false, 2:false };
      let round = 0, ans = 0, over = false;
      const shuf = a => a.slice().sort(() => Math.random() - .5);
      $("stage").innerHTML = `<div id="c2q" style="text-align:center;margin:10px 0"></div>
        <div style="display:flex;gap:14px;justify-content:center">${panel(1,"c2")}${panel(2,"c2")}</div>`;
      const btns = p => {
        $("c2i" + p).innerHTML = `${pn(p)} ・ ${sc[p]} 分`;
        $("c2b" + p).innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">` +
          shuf([0,1,2,3]).map(i => {
            const ink = CL[Math.floor(Math.random() * 4)][1];
            return `<button data-p="${p}" data-c="${i}" style="height:64px;font-size:1.6rem;font-weight:900;color:${ink};background:var(--card)">${CL[i][0]}</button>`;
          }).join("") + `</div>`;
      };
      const next = () => {
        round++; lock[1] = lock[2] = false;
        const w = Math.floor(Math.random() * 4);
        let k = Math.floor(Math.random() * 4); if (k === w) k = (k + 1) % 4;
        const byWord = Math.random() < .5;
        ans = byWord ? w : k;
        $("c2q").innerHTML = `<div style="font-weight:900;margin-bottom:6px">第 ${round}/${ROUNDS} 題 ・ 請按「${byWord ? "字義" : "顏色"}」</div>
          <div style="font-size:4rem;font-weight:900;color:${CL[k][1]}">${CL[w][0]}</div>`;
        btns(1); btns(2);
        msg(`${pn(1)} ${sc[1]} : ${sc[2]} ${pn(2)}`);
      };
      next();
      $("stage").onpointerdown = e => {
        const b = e.target.closest("button[data-c]"); if (!b || over) return;
        const p = +b.dataset.p, c = +b.dataset.c;
        if (lock[p]) return;
        if (c === ans) {
          sc[p]++;
          if (round >= ROUNDS) {
            over = true; btns(1); btns(2);
            win(sc[1] === sc[2] ? 0 : sc[1] > sc[2] ? 1 : 2, ` (${sc[1]} : ${sc[2]})`);
          } else next();
        } else {
          lock[p] = true; b.style.background = "#7a2b38";
          const r = round;
          setTimeout(() => { if (r === round && !over) { lock[p] = false; b.style.background = ""; } }, 1000);
        }
      };
    }
  };

  [wordle, duel, color2].forEach(g => {
    const s = g.start;
    g.start = function () { reset(); s.call(g); };
    games.push(g);
  });
  $("menu").innerHTML = games.map((g,i) =>
    `<div class="card" onclick="play(${i})"><div class="ic">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`
  ).join("");
})();
