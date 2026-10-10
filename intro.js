/* ========== 選擇遊戲提示 + 遊戲說明 + ❓規則按鈕 ========== */
(function () {
  const st = document.createElement("style");
  st.textContent = `
  #ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;align-items:center;justify-content:center;padding:16px}
  #ov .box{background:var(--card);border:2px solid #8a93ff;border-radius:18px;padding:24px;max-width:420px;width:100%;text-align:center;max-height:90vh;overflow-y:auto}
  #ov .ic{font-size:3.4rem}
  #ov h2{margin:6px 0}
  #ov .sub{opacity:.75;margin-bottom:10px}
  #ov ol{text-align:left;margin:12px 0 4px 22px;line-height:1.8}
  #ov .btns{display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap}
  #ov .wait{opacity:.7;margin-top:12px;font-size:.9rem}
  #helpBtn{display:none;position:fixed;right:18px;bottom:18px;z-index:9000;background:#8a93ff;color:#12141f;font-weight:900;font-size:1.3rem;border-radius:50%;width:48px;height:48px;padding:0;box-shadow:0 4px 14px rgba(0,0,0,.5)}`;
  document.head.appendChild(st);


  /* ---------- 各遊戲說明 ---------- */
  const R = {
    "井字遊戲": ["玩家1 是 X,玩家2 是 O,輪流點空格下棋。","先把 3 個自己的符號連成一直線(橫、直、斜)者獲勝。","9 格都下滿仍沒人連線就是平手。"],
    "四子棋": ["玩家1 紅色、玩家2 黃色,輪流點選一欄,棋子會掉到最底下。","先把 4 顆自己的棋子連成一直線(橫、直、斜)者獲勝。","棋盤滿了仍沒人連線就是平手。"],
    "反應對決": ["按「開始回合」後,燈號會先亮黃燈等待。","變成綠燈的瞬間,最快按下自己按鍵的人得分。","綠燈前亂按就是搶跑,對手得分。先得 3 分者獲勝。","玩家1 按 A,玩家2 按 L(也可以點畫面上的大按鈕)。"],
    "狂點大賽": ["按下開始後倒數 3 秒,接著進行 10 秒。","10 秒內用力連按,次數比較多的人獲勝。","玩家1 按 A,玩家2 按 L(也可以狂點大按鈕)。"],
    "猜拳對決": ["玩家1 先出拳,玩家2 再出拳,出拳內容在揭曉前不會顯示。","剪刀勝布、布勝石頭、石頭勝剪刀,平手重來。","先贏 3 回合者獲勝。"],
    "記憶翻牌": ["輪流翻開兩張牌,翻到相同圖案就配對成功,可以再翻一次。","沒配對成功,牌會蓋回去,換對方。","全部配完後,配對數較多的人獲勝。"],
    "貪食蛇對戰": ["兩條蛇在同一個場地,吃到 🍎 就會變長。","玩家1 用 W A S D 控制方向,玩家2 用 ↑ ← ↓ →(手機點方向按鈕)。","撞牆、撞到自己或撞到對方的蛇就輸。同時撞上則為平手。"],
    "乒乓球": ["玩家1 用 W / S 移動球拍,玩家2 用 ↑ / ↓。","把球打回去,讓對方漏接就得 1 分。","球會越打越快,先得 5 分者獲勝。"],
    "釣魚": ["45 秒內比誰釣到的分數高。","按「拋竿」後等待,浮標下沉時立刻收竿才釣得到。","太早收竿會被罰暫停 1 秒,太慢魚會跑掉。小心釣到破靴子會扣分。","玩家1 按 F,玩家2 按 Enter(也可以點按鈕)。"],
    "釣蝦": ["規則和釣魚相同,但蝦咬餌的時間更短,更考驗手速。","浮標下沉時立刻收竿,太早收竿會被罰暫停。","玩家1 按 F,玩家2 按 Enter(也可以點按鈕)。"],
    "撈金魚": ["30 秒內移動漁網,對準金魚後按撈取鍵。","🐟 1 分、🐠 2 分(跑得快),撈到 🐡 會扣 1 分。","玩家1:W A S D 移動、F 撈。玩家2:方向鍵移動、Enter 撈。撈完有短暫冷卻。"],
    "五子棋": ["玩家1 紅色、玩家2 藍色,輪流點空格落子。","先把 5 顆自己的棋子連成一直線(橫、直、斜)者獲勝。","棋盤下滿仍沒人連線就是平手。"],
    "終極密碼": ["系統會藏一個 1 到 99 的密碼。","雙方輪流從範圍內選一個數字,範圍會跟著縮小。","誰選到密碼,誰就輸。"],
    "雙人對射": ["雙方各有 5 滴血,用子彈射中對方就扣 1 滴。","中間有會上下移動的牆,會擋住子彈。","玩家1:W / S 移動、F 發射。玩家2:↑ / ↓ 移動、Enter 發射。","發射有短暫冷卻,血量先歸零的人輸。"],
    "快算對決": ["畫面出現數學題,兩邊各有 4 個答案。","點自己那一側的正確答案得 1 分。","答錯會鎖定 1.5 秒。先得 5 分者獲勝。"],
    "拔河": ["按下開始後倒數 3 秒。","玩家1 狂按 A,玩家2 狂按 L(也可以狂點大按鈕)。","把繩子拉到自己那一側的盡頭就獲勝。"]
  };

  /* ---------- 彈窗 ---------- */
  const ov = document.createElement("div");
  ov.id = "ov";
  document.body.appendChild(ov);
  const close = () => { ov.style.display = "none"; ov.innerHTML = ""; };
  ov.addEventListener("click", e => { if (e.target === ov && ov.dataset.lock !== "1") close(); });
  
  let lockAlways = false;
  const show = (icon, title, sub, lines, btns, note) => {
    ov.innerHTML = `<div class="box"><div class="ic">${icon}</div><h2>${esc(title)}</h2>
      ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
      ${lines ? `<ol>${lines.map(l => `<li>${esc(l)}</li>`).join("")}</ol>` : ""}
      ${note ? `<div class="wait">${esc(note)}</div>` : ""}
      <div class="btns"></div></div>`;
    const bx = ov.querySelector(".btns");
    btns.forEach(b => {
      const el = document.createElement("button");
      el.textContent = b.t; el.onclick = b.f; bx.appendChild(el);
    });
    ov.dataset.lock = btns.length > 1 || btns[0]?.t === "開始遊戲" || lockAlways ? "1" : "0";
    ov.style.display = "flex";
  };

const rulesOf = g => g.rules || R[g.name] || ["依照畫面提示遊玩即可。"];

  const showPick = (i, host) => {
    const g = games[i];
    if (host) show(g.icon, `選擇了「${g.name}」`, g.desc, null, [
      { t:"確認", f:() => { sendNet({ t:"rules", i }); showRules(i, true); } },
      { t:"取消", f:() => { sendNet({ t:"close" }); close(); } }
    ]);
    else show(g.icon, `房主選擇了「${g.name}」`, g.desc, null, [{ t:"關閉", f:close }], "⏳ 等待房主確認…");
  };

  const showRules = (i, host, readOnly) => {
    const g = games[i];
    if (readOnly) {
      lockAlways = true;
      show(g.icon, `${g.name} 遊戲說明`, "", rulesOf(g), [{ t:"關閉", f:() => { lockAlways = false; close(); } }]);
      lockAlways = false;
      return;
    }
    if (host) show(g.icon, `${g.name} 遊戲說明`, "", rulesOf(g), [
      { t:"開始遊戲", f:() => { close(); sendNet({ t:"go" }); origPlay(i); } }
    ]);
    else show(g.icon, `${g.name} 遊戲說明`, "", rulesOf(g), [{ t:"關閉", f:close }], "⏳ 等待房主開始遊戲…");
  };

  /* ---------- 攔截「選擇遊戲」 ---------- */
  const origPlay = window.play;
  window.play = function (i) {
    if (isGuest()) return;          // 朋友不能選遊戲
    if (isOnline()) sendNet({ t:"pick", i });
    showPick(i, true);
  };

  /* ---------- 接收房主訊息(朋友端) ---------- */
  const g1 = onGuestData;
  onGuestData = d => {
    if (d.t === "pick")  { showPick(+d.i, false); return; }
    if (d.t === "rules") { showRules(+d.i, false); return; }
    if (d.t === "go" || d.t === "close") { close(); return; }
    g1(d);
  };

  /* ---------- ❓ 規則按鈕 ---------- */
  const help = document.createElement("button");
  help.id = "helpBtn"; help.textContent = "?"; help.title = "查看遊戲規則";
  help.onclick = () => {
    const t = $("gtitle").textContent;
    const i = games.findIndex(g => t.includes(g.name));
    if (i < 0) return alert("目前還沒有進入遊戲");
    showRules(i, false, true);
  };
  document.body.appendChild(help);
  // 進入遊戲畫面時才顯示(房主、朋友都適用)
  setInterval(() => {
    const inGame = $("game").style.display !== "none" && $("gtitle").textContent.trim() !== "";
    help.style.display = inGame ? "block" : "none";
  }, 300);


  // 連線中斷時,把殘留的彈窗關掉
  setInterval(() => { if (net.role === "local" && ov.dataset.lock === "0") close(); }, 1000);
})();
