/* ================= 線上連線 (PeerJS / WebRTC) =================
   房主 = 玩家1:執行遊戲並廣播畫面
   朋友 = 玩家2:只顯示畫面並回傳操作
   依賴 script.js 內的 $, current, keyHandler, K, turnNow, score, showScore
================================================================ */
const PREFIX = "tpa-arcade-";
const RTC = { config: { iceServers: [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" }
]}};
const P2KEYS = new Set(["arrowup","arrowdown","arrowleft","arrowright","enter","l"]);
// 朋友用 WASD / F 也能操作玩家2的按鍵
const G2P2 = { w:"arrowup", a:"arrowleft", s:"arrowdown", d:"arrowright", f:"enter" };

const net = { role:"local", peer:null, conn:null, code:"", sig:"", lastH:null, lastImg:null };
const gheld = {};

const isOnline = () => net.role === "host"  && net.conn && net.conn.open;
const isGuest  = () => net.role === "guest" && net.conn && net.conn.open;
const sendNet  = d => { try { if (net.conn && net.conn.open) net.conn.send(d); } catch(e){} };
const genCode  = () => {
  const s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length:5}, () => s[Math.floor(Math.random()*s.length)]).join("");
};

/* ---------- 面板 UI ---------- */
function netIdleUI(){ $("netIdle").style.display = ""; $("netInfo").style.display = "none"; }
function netUI(html){
  $("netIdle").style.display = "none";
  $("netInfo").style.display = "block";
  $("netInfo").innerHTML = html;
  const l = $("btnLeave"); if (l) l.onclick = () => leaveNet();
  const c = $("btnCopy");
  if (c) c.onclick = () => {
    const link = location.origin + location.pathname + "?room=" + net.code;
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject())
      .then(() => c.textContent = "✅ 已複製")
      .catch(() => prompt("請手動複製連結:", link));
  };
}
function showHostInfo(){
  if (isOnline())
    netUI(`✅ 朋友已連線(你是玩家1,朋友是玩家2)<small>房間 ${net.code}</small><button id="btnLeave">關閉房間</button>`);
  else
    netUI(`房間代碼<div class="code">${net.code}</div>
      <button id="btnCopy">📋 複製邀請連結</button><button id="btnLeave">關閉房間</button>
      <small>把代碼或連結傳給朋友,等待加入…</small>`);
}

/* ---------- 離線 / 清理 ---------- */
function leaveNet(silent){
  const wasGuest = net.role === "guest";
  try { net.conn && net.conn.close(); } catch(e){}
  try { net.peer && net.peer.destroy(); } catch(e){}
  net.peer = net.conn = null; net.role = "local"; net.sig = ""; net.lastH = null; net.lastImg = null;
  document.body.classList.remove("guest");
  for (const k of P2KEYS) K[k] = false;
  if (wasGuest) {
    $("game").style.display = "none"; $("stage").innerHTML = ""; $("msg").innerHTML = "";
    showScore();
  }
  if (!silent) netIdleUI();
}
function netFail(text){
  leaveNet(true);
  netUI(`⚠️ ${text}<br><button id="btnLeave">確定</button>`);
}

/* ================= 房主 ================= */
function hostRoom(){
  leaveNet(true);
  net.role = "host"; net.code = genCode();
  netUI("建立房間中…");
  const p = new Peer(PREFIX + net.code, RTC);
  net.peer = p;
  p.on("open", showHostInfo);
  p.on("connection", c => {
    if (net.conn && net.conn.open) {            // 已有朋友,拒絕第三人
      c.on("open", () => { c.send({t:"full"}); setTimeout(() => c.close(), 300); });
      return;
    }
    net.conn = c;
    const opened = () => { net.sig = ""; showHostInfo(); pushSnap(true); };
    c.on("open", opened);
    if (c.open) opened();
    c.on("data", onHostData);
    c.on("close", () => {
      if (net.conn !== c) return;
      net.conn = null;
      for (const k of P2KEYS) K[k] = false;
      showHostInfo();
      if (typeof peerGone === "function") peerGone("朋友已離開房間");
    });

    c.on("error", () => {});
  });
  p.on("error", err => {
    if (err.type === "unavailable-id") hostRoom();     // 代碼重複,換一個
    else netFail("連線錯誤:" + err.type);
  });
  p.on("disconnected", () => { try { p.reconnect(); } catch(e){} });
}

/* 房主 → 朋友:狀態快照(文字/HTML,只在有變化時送出) */
function pushSnap(force){
  if (!isOnline()) return;
  const s = {
    t:"s",
    g: current ? $("gtitle").textContent : "",
    m: $("msg").innerHTML, mc: $("msg").className,
    h: current ? $("stage").innerHTML : "",
    a: score[1], b: score[2]
  };
  const sig = JSON.stringify(s);
  if (!force && sig === net.sig) return;
  net.sig = sig; sendNet(s);
}
setInterval(pushSnap, 100);

/* 房主 → 朋友:Canvas 畫面 (JPEG) */
setInterval(() => {
  if (!isOnline() || !current) return;
  const c = $("cv"); if (!c) return;
  const dc = net.conn.dataChannel;
  if (dc && dc.bufferedAmount > 500000) return;      // 網路塞住就先跳過
  sendNet({ t:"cv", d: c.toDataURL("image/jpeg", .6) });
}, 80);

/* 朋友 → 房主:操作 */
function onHostData(d){
  net.seen = Date.now();
  if (d.t === "ping") return;
  if (!current) return;
  if (d.t === "k") {
    const k = d.k; if (!P2KEYS.has(k)) return;
    if (d.d) {
      K[k] = true;
      if (keyHandler) keyHandler({ key:k, repeat:!!d.r, preventDefault(){} });
    } else K[k] = false;
  } else if (d.t === "c") {
    let el = $("stage");
    for (const i of d.p) el = el && el.children[i];
    if (!el || el === $("stage")) return;
    if (turnNow === 1) return;                        // 還沒輪到玩家2
    if (el.closest('[data-p="1"]')) return;           // 不能按玩家1的按鈕
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles:true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles:true }));
  }
}

/* 房主自己的限制:線上時,不能操作玩家2的按鍵 / 按鈕 / 對方的回合 */
window.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  const k = e.key.toLowerCase();
  if (isGuest()) {
    e.stopImmediatePropagation();
    if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
    const m = G2P2[k] || k;
    if (P2KEYS.has(m)) { e.preventDefault(); sendNet({ t:"k", k:m, d:1, r:e.repeat?1:0 }); }
    return;
  }
  if (isOnline() && current && e.isTrusted && P2KEYS.has(k)) e.stopImmediatePropagation();
}, true);

window.addEventListener("keyup", e => {
  if (e.target.tagName === "INPUT") return;
  const k = e.key.toLowerCase();
  if (isGuest()) {
    e.stopImmediatePropagation();
    const m = G2P2[k] || k;
    if (P2KEYS.has(m)) sendNet({ t:"k", k:m, d:0 });
    return;
  }
  if (isOnline() && current && e.isTrusted && P2KEYS.has(k)) e.stopImmediatePropagation();
}, true);

document.addEventListener("pointerdown", e => {
  const t = e.target; if (!t.closest) return;
  if (isOnline() && current && e.isTrusted) {
    const b = t.closest("[data-key]");
    if (t.closest('.pad[data-p="2"]') || (b && P2KEYS.has(b.dataset.key))) {
      e.stopPropagation(); e.preventDefault(); return;
    }
  }
  if (isGuest()) {
    const b = t.closest("[data-key]");
    if (b) {
      e.stopPropagation(); e.preventDefault();
      const k = b.dataset.key;
      if (P2KEYS.has(k)) { gheld[e.pointerId] = k; sendNet({ t:"k", k, d:1, r:0 }); }
    }
  }
}, true);

const guestRelease = e => {
  const k = gheld[e.pointerId];
  if (k) { delete gheld[e.pointerId]; sendNet({ t:"k", k, d:0 }); }
};
document.addEventListener("pointerup", guestRelease, true);
document.addEventListener("pointercancel", guestRelease, true);

function pathOf(el){
  const root = $("stage"), p = [];
  while (el && el !== root) {
    const par = el.parentElement; if (!par) return null;
    p.unshift([...par.children].indexOf(el)); el = par;
  }
  return el === root ? p : null;
}
document.addEventListener("click", e => {
  const t = e.target; if (!t.closest) return;
  if (isOnline() && current && e.isTrusted && turnNow === 2 && $("stage").contains(t)) {
    e.stopPropagation(); return;                      // 現在是朋友的回合
  }
  if (isGuest()) {
    if (t.closest("[data-key]")) { e.stopPropagation(); return; }
    if ($("stage").contains(t)) {
      e.stopPropagation();
      const p = pathOf(t); if (p) sendNet({ t:"c", p });
    }
  }
}, true);

/* ================= 朋友 ================= */
function joinRoom(code){
  code = (code || "").trim().toUpperCase();
  if (code.length < 5) { alert("請輸入 5 碼房間代碼"); return; }
  leaveNet(true);
  net.role = "guest"; net.code = code;
  netUI("連線中…");
  const p = new Peer(RTC);
  net.peer = p;
  p.on("open", () => {
    const c = p.connect(PREFIX + code, { reliable:true });
    net.conn = c;
    const to = setTimeout(() => { if (!c.open) netFail("連線逾時,請確認代碼,或換個網路再試"); }, 12000);
    c.on("open", () => {
      clearTimeout(to);
      document.body.classList.add("guest");
      $("game").style.display = "block";
      $("msg").textContent = "⏳ 等待房主選擇遊戲…";
      netUI(`✅ 已加入房間 ${code}(你是玩家2)<small>方向鍵 / WASD 移動、Enter 或 F 為動作鍵、L 為玩家2按鍵</small><button id="btnLeave">離開房間</button>`);
    });
    c.on("data", onGuestData);
    c.on("close", () => {
      if (net.role === "guest") {
        netFail("房主已離線");
        if (typeof peerGone === "function") peerGone("房主已離開房間");
      }
    });
    c.on("error", () => {});
  });
  p.on("error", err => netFail(err.type === "peer-unavailable" ? "找不到這個房間,請確認代碼" : "連線錯誤:" + err.type));
}

function onGuestData(d){
  net.seen = Date.now();
  if (d.t === "ping") return;
  if (d.t === "full") { netFail("房間已滿(已經有兩位玩家)"); return; }

  if (d.t === "s") {
    $("sc1").textContent = d.a; $("sc2").textContent = d.b;   // 同步房主的比分
    $("game").style.display = "block";
    if (!d.g) {                                               // 房主還在大廳
      $("gtitle").textContent = "";
      $("msg").className = ""; $("msg").textContent = "⏳ 等待房主選擇遊戲…";
      if (net.lastH !== "") { $("stage").innerHTML = ""; net.lastH = ""; }
      return;
    }
    $("gtitle").textContent = d.g;
    $("msg").innerHTML = d.m; $("msg").className = d.mc;
    if (d.h !== net.lastH) {                                  // 只在 HTML 有變時重繪
      $("stage").innerHTML = d.h; net.lastH = d.h;
      drawGuestImg();                                         // 重繪後補回最後一張 Canvas 畫面
    }
    return;
  }

  if (d.t === "cv") {
    const img = new Image();
    img.onload = () => { net.lastImg = img; drawGuestImg(); };
    img.src = d.d;
  }
}

function drawGuestImg(){
  const c = $("cv");
  if (!c || !net.lastImg) return;
  c.getContext("2d").drawImage(net.lastImg, 0, 0, c.width, c.height);
}

/* ================= 綁定按鈕 / 網址參數 ================= */
$("btnHost").onclick = () => hostRoom();
$("btnJoin").onclick = () => joinRoom($("joinCode").value);
$("joinCode").addEventListener("keydown", e => {
  if (e.key === "Enter") joinRoom($("joinCode").value);
});
window.addEventListener("beforeunload", () => leaveNet(true));

// 朋友點邀請連結 (?room=ABCDE) 時自動加入
const roomParam = new URLSearchParams(location.search).get("room");
if (roomParam) {
  $("joinCode").value = roomParam.toUpperCase();
  joinRoom(roomParam);
}
