/* ========== 斷線處理:心跳偵測 + 對方已離開彈窗 ========== */
(function () {
  let shown = false;
  const TIMEOUT = 7000;   // 超過 7 秒沒收到對方訊息就判定斷線

  const stopGame = () => {
    try { cleanups.forEach(f => f()); } catch (e) {}
    cleanups = [];
    try { clearTimers(); } catch (e) {}
    keyHandler = null;
  };

  /* 供 net.js 呼叫 */
  window.peerGone = function (text) {
    if (shown) return;
    shown = true;
    stopGame();
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px";
    d.innerHTML = `<div style="background:var(--card);border:2px solid #ff5d73;border-radius:18px;padding:24px;max-width:360px;width:100%;text-align:center">
      <div style="font-size:3rem">📡</div>
      <h2 style="margin:6px 0">對方已離開</h2>
      <p style="opacity:.75;margin-bottom:16px">${text || "連線已中斷"},遊戲結束。</p>
      <button id="dcBack">回大廳</button></div>`;
    document.body.appendChild(d);
    d.querySelector("#dcBack").onclick = () => { location.href = location.pathname; };
  };

  /* 心跳:每 2 秒送 ping,並檢查對方最後一次出現的時間 */
  setInterval(() => {
    const live = (net.role === "host" || net.role === "guest") && net.conn && net.conn.open;
    if (!live) { net.seen = 0; return; }
    sendNet({ t: "ping" });
    if (!net.seen) { net.seen = Date.now(); return; }
    if (Date.now() - net.seen > TIMEOUT) {
      net.seen = 0;
      const who = net.role === "host" ? "朋友已離線" : "房主已離線";
      try { leaveNet(true); } catch (e) {}
      peerGone(who);
    }
  }, 2000);
})();

/* ========== 再玩一次按鈕 ========== */
(function () {
  const btn = document.createElement("button");
  btn.id = "btnAgain";
  btn.textContent = "🔄 再玩一次";
  btn.style.cssText = "display:none;margin:12px auto 0;font-size:1.1rem;padding:12px 26px";
  $("msg").insertAdjacentElement("afterend", btn);

  const isEnd = t => /獲勝|贏得比賽|平手!/.test(t) && !/再來一次/.test(t);

  const refresh = () => {
    const show = current && net.role !== "guest" && isEnd($("msg").textContent);
    btn.style.display = show ? "block" : "none";
  };

  new MutationObserver(refresh).observe($("msg"), { childList: true, characterData: true, subtree: true });
  setInterval(refresh, 500);   // 保險:離開遊戲、連線狀態改變時也會更新

  btn.onclick = () => {
    if (!current || net.role === "guest") return;
    const g = current;
    btn.style.display = "none";
    reset();
    msg("");
    g.start();
  };
})();

/* ========== 音效 + 音效開關 ========== */
(function () {
  let on = localStorage.getItem("arcadeSound") !== "0";
  let ac = null;

  const ctx = () => {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ac && ac.state === "suspended") ac.resume();
    return ac;
  };

  /* 播放一串音:[頻率, 秒數] */
  const beep = (notes, type = "square", vol = 0.06) => {
    if (!on) return;
    const a = ctx(); if (!a) return;
    let t = a.currentTime;
    for (const [f, d] of notes) {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + d);
      t += d * 0.9;
    }
  };

  const SND = {
    click: () => beep([[660, .05]], "square", .03),
    turn:  () => beep([[520, .06]], "sine", .05),
    win:   () => beep([[523, .12], [659, .12], [784, .25]], "triangle", .09),
    draw:  () => beep([[330, .15], [262, .25]], "sawtooth", .05),
    score: () => beep([[880, .08]], "triangle", .07)
  };
  window.SND = SND;   // 之後新遊戲也能直接呼叫 SND.score() 等

  /* 得分／獲勝 */
  const origAdd = addScore;
  addScore = function (p) { SND.win(); return origAdd.call(this, p); };

  /* 按鈕點擊 */
  document.addEventListener("pointerdown", e => {
    if (e.target.closest && e.target.closest("button, .card, [data-key]")) SND.click();
  }, true);

  /* 依訊息內容播放 */
  let lastMsg = "";
  const onMsg = () => {
    const t = $("msg").textContent;
    if (t === lastMsg) return;
    lastMsg = t;
    if (/平手!/.test(t) && !/再來一次/.test(t)) SND.draw();
    else if (/搶跑|太早|扣分|出局/.test(t)) SND.draw();
    else if (/^輪到/.test(t)) SND.turn();
    else if (/配對成功|得分|贏下此回合/.test(t)) SND.score();
  };
  new MutationObserver(onMsg).observe($("msg"), { childList: true, characterData: true, subtree: true });

  /* 右下角 🔊/🔇 按鈕,放在 ❓ 的上方 */
  const b = document.createElement("button");
  b.id = "soundBtn";
  b.style.cssText = "position:fixed;right:18px;bottom:76px;z-index:9000;width:48px;height:48px;padding:0;border-radius:50%;font-size:1.3rem;background:#8a93ff;color:#12141f;box-shadow:0 4px 14px rgba(0,0,0,.5)";
  const paint = () => { b.textContent = on ? "🔊" : "🔇"; };
  b.onclick = () => {
    on = !on;
    localStorage.setItem("arcadeSound", on ? "1" : "0");
    paint();
    if (on) SND.click();
  };
  paint();
  document.body.appendChild(b);
})();

/* ========== 大廳:分類 + 搜尋 ========== */
(function () {
  const CATS = ["全部", "反應", "益智", "動作", "運氣", "策略", "夜市"];
  /* 遊戲名稱 → 所屬分類(可多個) */
  const MAP = {
    /* 反應 */
    "反應對決": "反應", "狂點大賽": "反應", "拔河": "反應",
    "打地鼠": "反應", "數字閃電": "反應", "快算對決": "反應",
    "顏色搶答": "反應","射擊靶": "反應","賽車閃避": "反應",
    "接水果": "反應","找不同": "反應","節奏對決": "反應",
    "接手搖飲": "反應","顏色搶答 Pro": "反應",
    /* 益智 */
    "井字遊戲": "益智", "四子棋": "益智", "五子棋": "益智", "記憶翻牌": "益智",
    "記憶數列": "益智","踩地雷對戰": "益智","海戰棋": "益智","黑白棋": "益智",
    "數字接龍": "益智","拼圖競速": "益智","猜單字對戰": "益智",
    "你畫我猜(文字版)": "益智","速算 Pro": "益智",
    /* 動作 */
    "貪食蛇對戰": "動作", "乒乓球": "動作", "撈金魚": "動作",
    "雙人對射": "動作", "小朋友下樓梯": "動作", "隕石閃避": "動作",
    "打磚塊": "動作","跳跳鳥": "動作","俄羅斯方塊對戰": "動作",
    "吃豆人對戰": "動作",
    /* 運氣 */
    "猜拳對決": "運氣", "骰子對決": "運氣", "終極密碼": "運氣",
    "釣魚": "運氣", "釣蝦": "運氣","比大小": "運氣",
    "轉盤對決": "運氣","21 點": "運氣","下注轉盤": "運氣",
    /* 策略 */
    "回合制小對戰": "策略","取石子": "策略", "點格棋": "策略",
    "猜數字密碼": "策略", "海盜寶藏": "策略",
    /* 夜市 */
    "飛鏢": "夜市","射氣球": "夜市","丟沙包": "夜市",
    "套圈圈": "夜市", "夾娃娃機": "夜市","賓果": "夜市",
    "撈乒乓球": "夜市", "打彈珠": "夜市", 
  };


  const menu = $("menu");
  let cat = "全部", kw = "";

  /* 工具列 */
  const bar = document.createElement("div");
  bar.style.cssText = "max-width:900px;margin:0 auto 14px;text-align:center";
  bar.innerHTML = `
    <input id="gSearch" type="search" placeholder="🔍 搜尋遊戲…"
      style="width:100%;max-width:360px;padding:10px 14px;border-radius:12px;border:2px solid #3a4070;background:var(--card);color:inherit;font-size:1rem;margin-bottom:10px">
    <div id="gCats" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"></div>
    <div id="gEmpty" style="display:none;opacity:.7;margin-top:14px">找不到符合的遊戲 😅</div>`;
  menu.parentNode.insertBefore(bar, menu);

  const catBox = bar.querySelector("#gCats");
  const paintCats = () => {
    catBox.innerHTML = CATS.map(c =>
      `<button data-c="${c}" style="padding:8px 16px;border-radius:20px;font-size:.95rem;${c === cat ? "" : "background:var(--card);color:inherit;opacity:.8"}">${c}</button>`
    ).join("");
  };
  catBox.onclick = e => {
    const b = e.target.closest("button[data-c]"); if (!b) return;
    cat = b.dataset.c; paintCats(); apply();
  };
  bar.querySelector("#gSearch").oninput = e => { kw = e.target.value.trim().toLowerCase(); apply(); };

  /* 套用篩選 */
  const apply = () => {
    let n = 0;
    menu.querySelectorAll(".card").forEach(card => {
      const name = (card.querySelector("h3") || {}).textContent || "";
      const desc = (card.querySelector("p") || {}).textContent || "";
      const tags = MAP[name] || "";
      const okCat = cat === "全部" || tags.includes(cat);
      const okKw = !kw || (name + desc + tags).toLowerCase().includes(kw);
      const show = okCat && okKw;
      card.style.display = show ? "" : "none";
      if (show) n++;
    });
    bar.querySelector("#gEmpty").style.display = n ? "none" : "block";
  };

  /* 其他檔案重建大廳時,重新套用 */
  new MutationObserver(apply).observe(menu, { childList: true });

  /* 進入遊戲時隱藏工具列,回大廳時顯示 */
  setInterval(() => {
    bar.style.display = getComputedStyle(menu).display === "none" ? "none" : "";
  }, 300);

  paintCats(); apply();
})();
