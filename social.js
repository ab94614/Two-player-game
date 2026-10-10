/* ========== 自訂名稱 + 房間聊天室 ========== */
(function () {
  const st = document.createElement("style");
  st.textContent = `
  #nm1,#nm2{cursor:pointer;border-bottom:1px dashed currentColor}
  #chat{display:none;width:100%;max-width:640px;background:var(--card);border-radius:14px;padding:12px;margin-top:16px}
  #chat .ch-t{font-weight:800;margin-bottom:8px}
  #chLog{height:160px;overflow-y:auto;background:#12141f;border-radius:10px;padding:8px;text-align:left;font-size:.95rem;line-height:1.6}
  #chLog .sys{opacity:.55;font-size:.85rem}
  #chLog b{margin-right:6px}
  #chat .ch-f{display:flex;gap:8px;margin-top:8px}
  #chIn{flex:1;font:inherit;color:var(--txt);background:#12141f;border:2px solid #3a4070;border-radius:10px;padding:9px 12px;min-width:0}`;
  document.head.appendChild(st);

  /* ---------- 名稱 ---------- */
  const KEY = "arcadeNames";
  const saved = Object.assign({1:"玩家1", 2:"玩家2"}, JSON.parse(localStorage.getItem(KEY) || "{}"));
  names[1] = saved[1]; names[2] = saved[2];
  const me = () => net.role === "guest" ? 2 : 1;
  const paint = () => { $("nm1").textContent = names[1]; $("nm2").textContent = names[2]; };
  paint();

  [1,2].forEach(p => {
    const el = $("nm"+p); el.title = "點擊修改名稱";
    el.onclick = () => {
      if (net.role !== "local" && p !== me()) return alert("線上模式只能修改自己的名稱");
      const n = (prompt("請輸入名稱(最多 8 字)", names[p]) || "").trim().slice(0, 8);
      if (!n) return;
      names[p] = saved[p] = n;
      localStorage.setItem(KEY, JSON.stringify(saved));
      paint();
      if (net.role !== "local") sendNet({ t:"name", n });
    };
  });

  /* ---------- 聊天室 UI ---------- */
  const box = document.createElement("div");
  box.id = "chat";
  box.innerHTML = `<div class="ch-t">💬 房間聊天室</div><div id="chLog"></div>
    <div class="ch-f"><input id="chIn" maxlength="200" placeholder="輸入訊息,按 Enter 送出" autocomplete="off"><button id="chBtn">送出</button></div>`;
  document.querySelector("footer").before(box);

  const log = $("chLog");
  const addLine = (name, text, mine, sys) => {
    const d = document.createElement("div");
    if (sys) { d.className = "sys"; d.textContent = "— " + text + " —"; }
    else {
      const b = document.createElement("b");
      b.textContent = name + ":"; b.style.color = mine ? "var(--p" + me() + ")" : "var(--p" + (3 - me()) + ")";
      d.appendChild(b); d.appendChild(document.createTextNode(text));
    }
    log.appendChild(d);
    while (log.children.length > 100) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  };

  const sendChat = () => {
    const t = $("chIn").value.trim(); if (!t) return;
    if (!(isOnline() || isGuest())) { addLine("", "對方還沒加入,訊息未送出", false, true); return; }
    $("chIn").value = "";
    sendNet({ t:"chat", n:names[me()], m:t.slice(0, 200) });
    addLine(names[me()], t.slice(0, 200), true);
  };
  $("chBtn").onclick = sendChat;
  $("chIn").addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });
  // 打字時不要觸發遊戲按鍵
  [$("chIn"), $("joinCode")].forEach(el => {
    el.addEventListener("keydown", e => e.stopPropagation());
    el.addEventListener("keyup", e => e.stopPropagation());
  });

  /* ---------- 接收資料(攔截 net.js 的處理函式) ---------- */
  const handle = d => {
    if (d.t === "name") {
      names[3 - me()] = String(d.n).slice(0, 8); paint(); return true;
    }
    if (d.t === "chat") {
      addLine(String(d.n).slice(0, 8), String(d.m).slice(0, 200), false); return true;
    }
    return false;
  };
  const h0 = onHostData, g0 = onGuestData;
  onHostData  = d => { if (!handle(d)) h0(d); };
  onGuestData = d => { if (!handle(d)) g0(d); };

  /* ---------- 監看連線狀態 ---------- */
  let lastConn = null, lastRole = "local";
  setInterval(() => {
    const c = (isOnline() || isGuest()) ? net.conn : null;
    if (net.role !== lastRole) {
      lastRole = net.role;
      box.style.display = net.role === "local" ? "none" : "block";
      if (net.role === "local") { log.innerHTML = ""; names[1] = saved[1]; names[2] = saved[2]; paint(); }
      else if (!log.children.length) addLine("", "聊天室已開啟", false, true);
    }
    if (c !== lastConn) {
      if (c) {
        sendNet({ t:"name", n:names[me()] });
        addLine("", "對方已連線", false, true);
      } else if (lastConn && net.role !== "local") {
        names[3 - me()] = saved[3 - me()]; paint();
        addLine("", "對方已離線", false, true);
      }
      lastConn = c;
    }
  }, 300);
})();
