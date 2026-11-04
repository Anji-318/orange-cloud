const APP_CALLBACK = "orangecloud://oauth/callback";
const CALLBACK_PATH = "/oauth/callback";
const KV_PREFIX = "device:";
const CONFIG_KEY = "config:main";
const DEFAULT_LIMIT = 20;
const COOKIE_NAME = "oc_admin";

// 管理面板页面（与预览版同一文件，构建时内嵌）
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Orange Cloud · 设备管理控制台</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">
<style>
:root{
  --accent:#0d9488;
  --accent-soft:#e6f7f5;
  --ok:#10b981;
  --ok-soft:#e8faf3;
  --warn:#f59e0b;
  --bad:#ef4444;
  --bad-soft:#fdeeee;
  --bg:#f2f5f9;
  --panel:255,255,255;
  --fg-opacity:.96;
  --border:#e3e9f0;
  --text:#1c2534;
  --text-dim:#7c8aa0;
  --shadow:0 1px 3px rgba(28,37,52,.06),0 4px 16px rgba(28,37,52,.05);
  --mono:'JetBrains Mono','PingFang SC','Microsoft YaHei',monospace;
  --sans:'Inter','PingFang SC','Microsoft YaHei',sans-serif;
}
html[data-theme=dark]{
  --accent:#2dd4bf;
  --accent-soft:rgba(45,212,191,.12);
  --ok:#34d399;
  --ok-soft:rgba(52,211,153,.12);
  --bad:#f87171;
  --bad-soft:rgba(248,113,113,.12);
  --bg:#0b1220;
  --panel:19,28,46;
  --fg-opacity:.86;
  --border:#1f2c47;
  --text:#e5edf7;
  --text-dim:#7c8aa5;
  --shadow:0 1px 3px rgba(0,0,0,.3),0 4px 16px rgba(0,0,0,.25);
}
*{margin:0;padding:0;box-sizing:border-box}
html{height:100%;overflow:hidden}
::selection{background:var(--accent);color:#fff}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--accent)}
body{
  font-family:var(--sans);
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
  min-height:100dvh; /* 移动端动态视口，排除底部导航栏 */
  height:auto;
  overflow:hidden;
}
/* 自定义背景图层 */
#bgLayer{
  position:fixed;inset:0;z-index:-2;
  background-size:cover;background-position:center;
  transition:opacity .4s ease;
  background-color:var(--bg); /* ← 修复：加载失败时兜底，避免透明/闪白 */
}
/* 液态光斑背景（Senflare 风格） */
body::before{
  content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:
    radial-gradient(600px 400px at 85% -5%,rgba(13,148,136,.10),transparent 60%),
    radial-gradient(500px 380px at -10% 90%,rgba(13,148,136,.08),transparent 60%);
}
html[data-theme=dark] body::before{
  background:
    radial-gradient(600px 400px at 85% -5%,rgba(45,212,191,.08),transparent 60%),
    radial-gradient(500px 380px at -10% 90%,rgba(45,212,191,.06),transparent 60%);
}
.mono{font-family:var(--mono)}
.dim{color:var(--text-dim)}

/* ---------- 登录门 ---------- */
#gate{
  min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px;padding-top:max(20px, env(safe-area-inset-top));
}
#gate .card{
  width:360px;padding:38px 32px;text-align:center;
}
#gate h1{font-size:19px;letter-spacing:.14em;margin:16px 0 4px}
#gate .sub{font-size:12px;color:var(--text-dim);margin-bottom:24px}
#gateErr{min-height:18px;font-size:11px;color:var(--bad);margin-top:12px;font-family:var(--mono);letter-spacing:.04em}

/* ---------- 通用组件 ---------- */
.card{
  background:rgba(var(--panel),var(--fg-opacity));
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:var(--shadow);
}
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  background:var(--accent);color:#fff;border:1px solid var(--accent);
  border-radius:10px;padding:8px 18px;font-size:13px;font-weight:500;
  font-family:var(--sans);cursor:pointer;transition:all .15s ease;
  white-space:nowrap;        /* ← 修复：防止移动端文字被挤成竖排 */
}
.btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.btn:active{transform:translateY(0)}
.btn.ghost{
  background:transparent;color:var(--accent);border:1px solid var(--accent);
}
.btn.ghost:hover{background:var(--accent-soft);filter:none}
.btn.sm{padding:6px 14px;font-size:12px;border-radius:9px}
input[type=text],input[type=password],input[type=url],input[type=number]{
  width:100%;padding:10px 14px;font-size:13px;
  font-family:var(--sans);color:var(--text);
  background:rgba(var(--panel),var(--fg-opacity));
  border:1px solid var(--border);border-radius:10px;outline:none;
  transition:border-color .15s ease,box-shadow .15s ease;
}
input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
input::placeholder{color:var(--text-dim)}
.field{margin-bottom:20px;text-align:left}
.field label{
  display:block;font-size:11px;letter-spacing:.1em;color:var(--text-dim);
  font-family:var(--mono);margin-bottom:8px;
}
.hint{font-size:12px;color:var(--text-dim);margin-top:8px;line-height:1.6}
.row-flex{display:flex;gap:10px;align-items:center}
.seg{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden}
.seg button{
  padding:7px 18px;font-size:12px;border:0;background:transparent;
  color:var(--text-dim);cursor:pointer;font-family:var(--sans);transition:all .15s;
}
.seg button.on{background:var(--accent);color:#fff}

/* ---------- 主布局 ---------- */
#app{display:flex;min-height:100vh;min-height:100dvh;height:auto;overflow:hidden}
aside{
  width:228px;flex-shrink:0;
  background:rgba(var(--panel),var(--fg-opacity));
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border-right:1px solid var(--border);
  display:flex;flex-direction:column;
  position:sticky;top:0;
  min-height:100vh;min-height:100dvh;
  height:auto;
  padding-top:env(safe-area-inset-top);
  padding-bottom:env(safe-area-inset-bottom);
  transition:width .25s ease;
}
aside.collapsed{width:64px}
aside.collapsed .brand .name,
aside.collapsed .brand .ver,
aside.collapsed .nav-item span,
aside.collapsed .side-foot{display:none}
aside.expanded{width:228px !important;z-index:60}
aside.expanded .brand .name,
aside.expanded .brand .ver,
aside.expanded .nav-item span,
aside.expanded .side-foot{display:block}
aside.expanded .brand{justify-content:flex-start;padding:22px 20px;gap:12px}
aside.expanded .nav-item{justify-content:flex-start;padding:11px 14px}
#sidebarOverlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:50;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
aside.collapsed .brand{justify-content:center;padding:18px 0;gap:0}
aside.collapsed .nav-item{justify-content:center;padding:12px 0}
.brand{user-select:none}
.brand .logo{cursor:pointer}
.brand{display:flex;align-items:center;gap:12px;padding:22px 20px}
.brand .logo{
  width:34px;height:34px;border-radius:10px;flex-shrink:0;
  background:linear-gradient(135deg,#14b8a6,#0d9488);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 12px rgba(13,148,136,.35);
}
.brand .name{font-size:14px;font-weight:700;letter-spacing:.08em}
.brand .ver{font-size:10px;color:var(--text-dim);font-family:var(--mono);letter-spacing:.12em;margin-top:2px}
nav{padding:8px 14px;flex:1}
.nav-item{
  display:flex;align-items:center;gap:11px;
  padding:11px 14px;margin-bottom:4px;border-radius:11px;
  font-size:13.5px;color:var(--text-dim);cursor:pointer;
  transition:all .15s ease;user-select:none;
}
.nav-item svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.nav-item:hover{background:var(--accent-soft);color:var(--accent)}
.nav-item.active{background:var(--accent-soft);color:var(--accent);font-weight:600}
.side-foot{
  padding:18px 20px;font-size:10px;color:var(--text-dim);
  font-family:var(--mono);letter-spacing:.1em;line-height:1.8;
  border-top:1px solid var(--border);
}
/* 主区域：缩小顶部间距，整体上移；高度随窗口动态适配 */
main{flex:1;padding:14px 30px 16px;padding-top:max(14px, env(safe-area-inset-top));min-width:0;display:flex;flex-direction:column;overflow:hidden}
.topbar{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;flex-shrink:0}
.page-title{font-size:21px;font-weight:700}
.crumb{font-size:10.5px;color:var(--text-dim);font-family:var(--mono);letter-spacing:.16em;text-transform:uppercase}
.view{display:none}
.view.on{display:flex;flex-direction:column;flex:1;min-height:0;animation:fadeUp .3s ease;overflow:hidden}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

/* 统计卡片 */
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;flex-shrink:0}
.stat{
  background:rgba(var(--panel),var(--fg-opacity));
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid var(--border);border-radius:14px;
  box-shadow:var(--shadow);padding:14px 18px;
}
.stat .num{font-size:28px;font-weight:800;font-family:var(--mono);line-height:1.1}
.stat .lbl{font-size:12px;color:var(--text-dim);margin-top:4px}

/* 名单卡片：随窗口高度自适应，仅数据区滚动 */
#view-devices .card{
  overflow:hidden;
  display:flex;flex-direction:column;flex:1;min-height:0;
  padding:8px;          /* ← 新增：卡片四周边距 8px */
}
#view-settings .card{padding:26px 28px;flex:1;overflow:auto;min-height:0}
.card-head{
  display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:12px 16px;flex-wrap:wrap;flex-shrink:0;
}
.card-title{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600;letter-spacing:.06em}
.dot{width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 8px var(--ok);animation:pulse 2s infinite}
.dot.off{background:var(--text-dim);box-shadow:none;animation:none}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.card-head input{width:200px;padding:8px 12px;font-size:12.5px}

/* 表格：四周 8px 固定边距；表头在滚动区外；滚动条从表头下方开始 */
#tableWrap{
  flex:1;min-height:0;overflow:hidden;
  padding:8px;box-sizing:border-box; /* 数据表格四周边距 8px */
  display:flex;flex-direction:column;
  width:100%;
}
#tableWrap .table-head{
  flex-shrink:0;overflow:hidden;width:100%;
}
#tableWrap .table-scroll{
  flex:1;min-height:0;overflow:auto;width:100%;
}
#tableWrap table{
  width:100%;border-collapse:collapse;font-size:13px;
  table-layout:fixed;
}
#tableWrap .table-head table,
#tableWrap .table-scroll table{width:100%;margin:0}
#tableWrap th{
  text-align:left;padding:11px 12px;font-size:10.5px;font-weight:600;
  color:var(--text-dim);font-family:var(--mono);letter-spacing:.1em;
  text-transform:uppercase;border-bottom:1px solid var(--border);white-space:nowrap;
  background:rgb(var(--panel));
}
#tableWrap td{
  padding:13px 12px;border-bottom:1px solid var(--border);vertical-align:middle;
  overflow-wrap:break-word;
}
#tableWrap td.mono{word-break:break-all} /* 仅机器码列允许任意位置断开 */
#tableWrap tbody tr{transition:background .12s ease}
#tableWrap tbody tr:hover{background:var(--accent-soft)}
#tableWrap tbody tr:last-child td{border-bottom:0}
/* 列宽对齐（表头表 / 数据表共用） */
#tableWrap col.c-id{width:22%}
#tableWrap col.c-note{width:13%}
#tableWrap col.c-app{width:17%}
#tableWrap col.c-seen{width:12%}
#tableWrap col.c-status{width:14%}
#tableWrap col.c-act{width:22%}
#tableWrap td:last-child .row-flex{flex-wrap:nowrap;justify-content:flex-end;gap:6px}
#tableWrap td:last-child .btn{flex-shrink:0}
.empty{
  padding:56px 20px;text-align:center;color:var(--text-dim);
  font-size:13px;line-height:2;
}
/* 文本反色样式支持 */
.invert-text{color:var(--bg);background:var(--text)}
.invert-text .dim{color:rgba(var(--panel),.7)}
.badge{
  display:inline-flex;align-items:center;gap:6px;
  padding:4px 12px;border-radius:99px;font-size:12px;font-weight:500;white-space:nowrap;
}
.badge.ok{background:var(--ok-soft);color:var(--ok)}
.badge.ban{background:var(--bad-soft);color:var(--bad)}
.b-dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.note-cell{cursor:pointer;border-bottom:1px dashed var(--border)}
.note-cell:hover{color:var(--accent)}
.ver-pill{
  display:inline-block;padding:2px 8px;border-radius:6px;
  background:var(--accent-soft);color:var(--accent);
  font-family:var(--mono);font-size:11px;
  white-space:nowrap; /* 完整版本号不折行，也不会被列宽压断 */
}
.chan-pill{
  display:inline-block;padding:2px 7px;border-radius:6px;
  border:1px solid var(--border);color:var(--text-dim);
  font-family:var(--mono);font-size:10px;text-transform:uppercase;white-space:nowrap;
}
.client-cell{display:inline-flex;align-items:center;gap:6px;max-width:100%}
.data-notice{
  display:none;margin:0 16px 12px;padding:9px 12px;border-radius:8px;
  font-size:12px;line-height:1.6;font-family:var(--mono);letter-spacing:.01em;
}
.data-notice.err{background:var(--bad-soft);color:var(--bad);border:1px solid rgba(239,68,68,.28)}
.data-notice.warn{background:rgba(245,158,11,.12);color:var(--warn);border:1px solid rgba(245,158,11,.3)}

/* 移动端版本号（仅在窄屏显示在机器码下方） */
.mobile-ver{display:none;margin-top:4px} /* ← 修复：默认隐藏，桌面端不显示 */

/* toast */
#toast{
  position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(16px);
  background:var(--text);color:var(--bg);padding:10px 22px;border-radius:99px;
  font-size:13px;opacity:0;pointer-events:none;transition:all .25s ease;z-index:99;
  box-shadow:0 8px 24px rgba(0,0,0,.18);
}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* 响应式 */
@media (max-width:860px){
  aside{width:64px;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);transition:none;position:fixed;left:0;top:0;height:100vh;height:100dvh;z-index:60}
  .brand .name,.brand .ver,.nav-item span,.side-foot{display:none}
  .brand{justify-content:center;padding:18px 0;gap:0}
  .nav-item{justify-content:center;padding:12px 0}
  html,body{overflow:auto}
  #app{overflow:visible}
  main{padding:12px 14px 14px;padding-top:max(12px, env(safe-area-inset-top));margin-left:64px;overflow:visible;max-width:calc(100% - 64px);min-width:0}
  .view.on{overflow:visible}
  #view-devices .card,#view-settings .card{overflow:visible;min-width:0}
  .stats{grid-template-columns:repeat(3,1fr);gap:8px}
  .stat{padding:12px 12px}
  .stat .num{font-size:22px}
  .hide-m{display:none !important}
  /* 表格内隐藏列在移动端恢复显示（有横向滚动条，无需隐藏） */
  #tableWrap .hide-m{display:table-cell !important}
  .card-head{padding:10px 12px;gap:10px}
  .card-head input{flex:1;min-width:0;width:auto}
  .card-head .row-flex{flex-wrap:nowrap;gap:6px;width:100%}
  .mobile-ver{display:none} /* 有横向滚动时版本号放回客户端列，不再挤占机器码行高 */
  /* 移动端表格：单表+sticky表头，外层横向滚动，底部出现滚动条 */
  #tableWrap{
    display:block;
    overflow-x:auto;
    overflow-y:auto;
    padding:8px; /* ← 恢复卡片内部边距 */
    flex:1;
    min-height:0;
    min-width:0;
    max-width:100%;
  }
  #tableWrap table{
    min-width:780px; /* ← 6列全显需要更宽 */
    table-layout:fixed;
    width:100%;
  }
  #tableWrap thead{
    position:sticky;
    top:0;
    z-index:2;
  }
  #tableWrap th{
    background:rgb(var(--panel));
  }
  /* 6列全显时的列宽分配 */
  #tableWrap col.c-id{width:24%}
  #tableWrap col.c-note{width:14%}
  #tableWrap col.c-app{width:17%}
  #tableWrap col.c-seen{width:12%}
  #tableWrap col.c-status{width:15%}
  #tableWrap col.c-act{width:18%}
  #tableWrap th,#tableWrap td{padding:10px 6px;font-size:12px;vertical-align:middle}
  #tableWrap th{font-size:10px;letter-spacing:.04em;white-space:nowrap}
  #tableWrap td.mono{white-space:nowrap}
  #tableWrap td:last-child{white-space:nowrap;text-align:right}
  #tableWrap td:last-child .row-flex{flex-wrap:nowrap;gap:4px;justify-content:flex-end}
  #tableWrap td:last-child .btn.sm{padding:5px 8px;font-size:11px}
}
  #sidebarOverlay.show{display:block}
</style>
</head>
<body>
<div id="bgLayer"></div>

<!-- 登录门 -->
<div id="gate">
  <div class="card">
    <svg class="radar" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="19" stroke="#14b8a6" stroke-opacity=".3"/>
      <circle cx="22" cy="22" r="12" stroke="#14b8a6" stroke-opacity=".5"/>
      <circle cx="22" cy="22" r="5" fill="#14b8a6"/>
      <line x1="22" y1="22" x2="40" y2="10" stroke="#14b8a6" stroke-width="1.5">
        <animateTransform attributeName="transform" type="rotate" from="0 22 22" to="360 22 22" dur="4.2s" repeatCount="indefinite"/>
      </line>
    </svg>
    <h1>DEVICE CONSOLE</h1>
    <p class="sub">Orange Cloud 设备管理 · 仅限管理员</p>
    <div class="field">
      <label>管理密码</label>
      <div style="position:relative">
        <input type="password" id="pwd" placeholder="••••••••" autocomplete="current-password" style="padding-right:64px">
        <button type="button" id="pwdToggle" onclick="togglePwd()"
          style="position:absolute;right:6px;top:50%;transform:translateY(-50%);
          background:transparent;border:1px solid var(--border);border-radius:6px;
          color:var(--text-dim);font-family:var(--mono);font-size:10px;letter-spacing:.08em;
          padding:4px 9px;cursor:pointer">显示</button>
      </div>
    </div>
    <button class="btn" style="width:100%;padding:11px" onclick="login()">进入控制台</button>
    <div id="gateErr"></div>
  </div>
</div>

<!-- 主界面 -->
<div id="app">
  <aside>
    <div class="brand">
      <div class="logo" onclick="toggleSidebar()" title="点击展开/折叠侧边栏" style="cursor:pointer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="#fff"/></svg></div>
      <div>
        <div class="name">OC CONSOLE</div>
        <div class="ver">DEVICE OPS v1.0</div>
      </div>
    </div>
    <nav>
      <div class="nav-item active" data-view="devices" onclick="switchView('devices')">
        <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2.5"/><line x1="10" y1="18.5" x2="14" y2="18.5"/></svg>
        <span>设备管理</span>
      </div>
      <div class="nav-item" data-view="settings" onclick="switchView('settings')">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span>面板设置</span>
      </div>
    </nav>
    <div class="side-foot">OSS.OMAIL.US.KG<br>KV · EDGE</div>
  </aside>
  <div id="sidebarOverlay" onclick="toggleSidebar()"></div>

  <main>
    <!-- 设备管理视图 -->
    <section class="view on" id="view-devices">
      <header class="topbar">
        <h2 class="page-title">设备管理</h2>
        <span class="crumb">console / devices</span>
      </header>
      <div class="stats">
        <div class="stat"><div class="num" id="stTotal">0</div><div class="lbl">登记设备</div></div>
        <div class="stat"><div class="num" id="stActive" style="color:var(--ok)">0</div><div class="lbl">正常</div></div>
        <div class="stat warn"><div class="num" id="stBanned" style="color:var(--bad)">0</div><div class="lbl">已封禁</div></div>
      </div>
      <div class="card">
        <div class="card-head">
          <div class="card-title"><span class="dot" id="liveDot"></span>在线名单 · LIVE ROSTER</div>
          <div class="row-flex">
            <input type="text" id="search" placeholder="筛选机器码或备注…" style="width:200px;padding:8px 12px" oninput="renderTable()">
            <button class="btn ghost sm" id="autoBtn" onclick="toggleAuto()">自动刷新: 开</button>
            <button class="btn ghost sm" onclick="loadDevices()">刷新</button>
          </div>
        </div>
        <div id="dataNotice" class="data-notice"></div>
        <div id="tableWrap"></div>
      </div>
    </section>

    <!-- 设置视图 -->
    <section class="view" id="view-settings">
      <header class="topbar">
        <h2 class="page-title">面板设置</h2>
        <span class="crumb">console / settings</span>
      </header>
      <div class="card">
        <div class="field">
          <label>主题 / THEME</label>
          <div class="seg">
            <button id="thDark" onclick="setTheme('dark')">深色</button>
            <button id="thLight" onclick="setTheme('light')">浅色</button>
          </div>
        </div>
        <div class="field">
          <label>背景图片 URL / BACKGROUND</label>
          <input type="url" id="bgUrl" placeholder="https://…（留空使用纯色）" onchange="setBg(this.value)">
          <p class="hint">支持任意可访问的图片地址；设置后自动覆盖面板底层。</p>
        </div>
        <div class="field">
          <label>设备数量上限 / DEVICE LIMIT</label>
          <div class="row-flex">
            <input type="number" id="limitInput" min="1" max="100000" step="1" style="width:120px;padding:8px 12px">
            <button class="btn sm" onclick="saveLimit()">保存</button>
          </div>
          <p class="hint" id="limitHint">超过上限后，新设备将无法登记与登录（已有设备不受影响）。存于 KV，全端同步。</p>
        </div>
        <div class="field">
          <label>前景不透明度 / PANEL OPACITY · <span id="opVal" class="mono"></span></label>
          <input type="range" id="opRange" min="20" max="100" oninput="setOpacity(this.value)">
          <p class="hint">控制磨砂玻璃卡片的不透明度，数值越低背景越通透。</p>
        </div>
        <div class="field">
          <button class="btn ghost" onclick="resetPrefs()">恢复默认外观</button>
        </div>
      </div>
    </section>
  </main>
</div>

<div id="toast"></div>

<script>
/* ================================================================
 * Orange Cloud 设备管理控制台
 * 优先对接 Worker 管理 API（/admin/api/*）；接口不可用时（预览模式）
 * 自动降级为内置模拟数据，便于直接预览界面。
 * ================================================================ */
let ocPreview = false;
/* 只有本地/显式预览上下文才允许用模拟数据。
 * 线上域名一律走真实 API：以前只要 /admin/api/devices 非 200 就静默降级，
 * 管理员会把内置的 5 台假设备（版本号硬编码 "2.1.0"）当成真实客户端。 */
function isPreviewContext(){
  try{
    if(new URLSearchParams(location.search).get('preview') === '1') return true;
    if(location.protocol === 'file:' || location.protocol === 'blob:') return true;
    const h = location.hostname;
    return !h || h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  }catch(e){ return false; }
}
const API = {
  async login(pwd){
    try{
      const r = await fetch('/admin/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:pwd})});
      if(r.ok) return 'ok';
      if(r.status === 401) return 'denied';
      if(r.status === 503) return 'not_configured';
      return 'denied';
    }catch(e){ return previewLogin(pwd) ? 'ok' : 'denied'; }
  },
  async session(){
    try{
      const r = await fetch('/admin/api/devices',{cache:'no-store'});
      return r.ok;
    }catch(e){ return false; }
  },
  async list(){
    let r;
    try{
      r = await fetch('/admin/api/devices',{cache:'no-store'});
    }catch(e){
      if(isPreviewContext()){ ocPreview = true; return mockDevices(); }
      return { devices: [], __error: '无法连接管理接口，请检查网络' };
    }
    if(r.status === 401) return { devices: [], __authExpired: true };
    if(!r.ok) return { devices: [], __error: 'HTTP '+r.status+(r.status === 503 ? '（KV / ADMIN_PASSWORD 未就绪）' : '') };
    try{
      const data = await r.json();
      if(!data || !Array.isArray(data.devices)) return { devices: [], __error: '响应格式异常' };
      return data;
    }catch(e){ return { devices: [], __error: '响应不是 JSON（可能被 CDN 缓存或代理改写）' }; }
  },
  async act(action,id,extra){
    try{
      const r = await fetch('/admin/api/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({id},extra||{}))});
      return r.ok;
    }catch(e){
      if(isPreviewContext()){ ocPreview = true; return mockAct(action,id,extra); }
      return false;
    }
  },
  async config(){
    try{
      const r = await fetch('/admin/api/config');
      if(!r.ok) throw 0;
      return await r.json();
    }catch(e){ return { limit: _mockLimit, count: (_mock?_mock.devices.length:5) }; }
  },
  async saveConfig(limit){
    try{
      const r = await fetch('/admin/api/config',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({limit:limit})});
      if(!r.ok) throw 0;
      return true;
    }catch(e){ _mockLimit = limit; return true; }
  }
};
let _mockLimit = 20;

/* ---------- 预览模式模拟数据 ---------- */
let _mock = null;
function previewLogin(pwd){ localStorage.setItem('oc_preview_gate','1'); return pwd.length >= 1; }
function mockDevices(){
  if(_mock) return _mock;
  const ids = ['a3f8c2e19b04d7a6','7e1b4d92c8f3a015','c9d6e2f8471b03aa','f2a7b1c9e4d60853','91d3e6c2a7f40b18'];
  const now = Date.now();
  _mock = { devices: ids.map((id,i)=>({
    id,
    firstSeen: now - (i+3)*86400000*4,
    lastSeen: now - i*3600000*7,
    app: i%2 ? 'oss' : 'play',
    // 与 apps/android/app/build.gradle.kts 的 versionName 对齐（2.1.05 + flavor 后缀）。
    // 旧值硬编码 '2.1.0'，预览时会被误认为"客户端版本号被截断只显示 2.1.0"。
    version: i%2 ? '2.1.05-oss' : '2.1.05',
    banned: i===3
  }))};
  return _mock;
}
function mockAct(action,id,extra){
  if(action==='add'){
    _mock.devices.unshift({id:id,firstSeen:Date.now(),lastSeen:Date.now(),app:'manual',version:'',banned:true,note:(extra&&extra.note)||'',bannedAt:Date.now()});
    return true;
  }
  const d = _mock && _mock.devices.find(x=>x.id===id);
  if(!d) return true;
  if(action==='ban'){ d.banned = true; d.bannedAt = Date.now(); }
  if(action==='unban'){ d.banned = false; delete d.bannedAt; }
  if(action==='delete') _mock.devices = _mock.devices.filter(x=>x.id!==id);
  if(action==='note') d.note = (extra&&extra.note)||'';
  return true;
}

/* ---------- 登录 ---------- */
let authed = false;
function enterApp(){
  authed = true;
  document.getElementById('gate').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  loadDevices();
  loadConfig();
}
/* ---------- 设备数量上限（KV 同步） ---------- */
async function loadConfig(){
  const cfg = await API.config();
  currentLimit = cfg.limit;
  document.getElementById('limitInput').value = cfg.limit;
  updateLimitHint(cfg.limit, cfg.count);
}
function updateLimitHint(limit, count){
  document.getElementById('limitHint').textContent =
    '当前 ' + count + ' / ' + limit + ' 台。超过上限后新设备无法登记与登录（已有设备不受影响）。存于 KV，全端同步。';
}
async function saveLimit(){
  const v = parseInt(document.getElementById('limitInput').value, 10);
  if(!Number.isInteger(v) || v < 1){ toast('上限必须是正整数'); return; }
  await API.saveConfig(v);
  toast('上限已保存并同步');
  loadConfig();
}
async function login(){
  const pwd = document.getElementById('pwd').value;
  const err = document.getElementById('gateErr');
  if(!pwd){ err.textContent = 'PASSWORD REQUIRED'; return; }
  const result = await API.login(pwd);
  if(result === 'ok'){
    enterApp();
  }else if(result === 'not_configured'){
    err.textContent = 'ADMIN NOT CONFIGURED · 未设置 ADMIN_PASSWORD';
  }else{
    err.textContent = 'ACCESS DENIED · 密码错误（注意全角/半角与输入法）';
  }
}
/* 已登录（Cookie 未过期）则跳过密码门，刷新不掉线 */
(async function restoreSession(){
  if(await API.session()) enterApp();
})();
document.getElementById('pwd').addEventListener('keydown', e=>{ if(e.key==='Enter') login(); });
/* 密码可见性切换 */
function togglePwd(){
  const i = document.getElementById('pwd');
  const show = i.type === 'password';
  i.type = show ? 'text' : 'password';
  document.getElementById('pwdToggle').textContent = show ? '隐藏' : '显示';
}

/* ---------- 视图切换 ---------- */
function switchView(v){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===v));
  document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on', s.id==='view-'+v));
  // 移动端切换视图后自动折叠侧边栏
  if(window.innerWidth <= 860){
    const aside = document.querySelector('aside');
    const overlay = document.getElementById('sidebarOverlay');
    aside.classList.remove('expanded');
    if(overlay) overlay.classList.remove('show');
  }
}

/* ---------- 设备名单 ---------- */
let devices = [];
let currentLimit = 0;
async function loadDevices(){
  const data = await API.list();
  const notice = document.getElementById('dataNotice');
  function showNotice(kind, text){
    notice.className = 'data-notice ' + kind;
    notice.textContent = text;
    notice.style.display = 'block';
  }
  if(data.__authExpired){
    showNotice('err','登录已过期或权限失效，请重新输入管理密码（未展示模拟数据）。');
    return;
  }
  if(data.__error){
    showNotice('err','真实设备数据加载失败：'+data.__error+'。绝不用模拟数据冒充；'+
      (devices.length ? '下表保留上次成功加载的结果。' : '请检查 Worker 的 KV 绑定与 ADMIN_PASSWORD 后点「刷新」重试。'));
    renderTable();
    return;
  }
  if(ocPreview){
    showNotice('warn','预览模式 · 以下为内置模拟数据，仅供界面演示；版本号是示例值，不是真实客户端版本。');
  }else{
    notice.style.display = 'none';
  }
  devices = data.devices || [];
  renderTable();
  if(currentLimit > 0) updateLimitHint(currentLimit, devices.length);
}
function fmt(t){
  const d = new Date(t);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
    +' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function ago(t){
  const s = Math.max(1, Math.floor((Date.now()-t)/1000));
  if(s < 3600) return Math.floor(s/60)+' 分钟前';
  if(s < 86400) return Math.floor(s/3600)+' 小时前';
  return Math.floor(s/86400)+' 天前';
}
function fmtDeviceId(id){
  const raw = String(id || '').replace(/-/g,'').toLowerCase();
  if(/^[0-9a-f]{16}$/.test(raw)){
    return raw.slice(0,4)+'-'+raw.slice(4,8)+'-'+raw.slice(8,12)+'-'+raw.slice(12,16);
  }
  // 兼容历史非 16 位机器码：保持原样但截断显示
  return raw.length > 12 ? raw.slice(0,8)+'…'+raw.slice(-4) : raw;
}
function syncColWidths(){
  if(window.innerWidth <= 860) return; /* 移动端单表结构，无需同步 */
  const headCells = document.querySelectorAll('#tableWrap .table-head th');
  const bodyRow = document.querySelector('#tableWrap .table-scroll tbody tr');
  if(!headCells.length || !bodyRow) return;
  const bodyCells = bodyRow.children;
  if(bodyCells.length !== headCells.length) return;
  // 先清除再按数据行实测宽度同步到表头，避免双表错列
  for(let i=0;i<headCells.length;i++){
    headCells[i].style.width = '';
    if(bodyCells[i]) bodyCells[i].style.width = '';
  }
  const widths = [];
  for(let i=0;i<bodyCells.length;i++){
    widths.push(bodyCells[i].getBoundingClientRect().width);
  }
  for(let i=0;i<headCells.length;i++){
    if(headCells[i].classList.contains('hide-m')) continue;
    if(bodyCells[i] && bodyCells[i].classList.contains('hide-m')) continue;
    const w = widths[i];
    if(w > 0){
      headCells[i].style.width = w + 'px';
      if(bodyCells[i]) bodyCells[i].style.width = w + 'px';
    }
  }
}
/* 设备字段由客户端匿名上报，内容可伪造；拼进 innerHTML 前一律转义（防存储型 XSS） */
function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
/* 客户端列：渠道 + 完整版本号一起显示；title 保留完整原文，便于核对/复制。
 * 以前只渲染 d.version 且没有 title，长版本号（如 2.1.05-oss）在固定列宽里
 * 容易被误认成被截断的 2.1.0。 */
function clientCell(d){
  const ver = String(d.version == null ? '' : d.version).trim();
  const app = String(d.app == null ? '' : d.app).trim();
  if(!ver && !app) return '<span class="dim">—</span>';
  const full = [app, ver].filter(Boolean).join(' · ');
  return '<span class="client-cell" title="'+esc(full)+'">'+
    (app && app !== 'unknown' ? '<span class="chan-pill">'+esc(app)+'</span>' : '')+
    (ver ? '<span class="ver-pill">'+esc(ver)+'</span>' : '')+
  '</span>';
}
function renderTable(){
  const q = (document.getElementById('search').value||'').toLowerCase();
  const qRaw = q.replace(/-/g,'');
  const list = devices.filter(d=>String(d.id||'').toLowerCase().replace(/-/g,'').includes(qRaw) || String(d.note||'').toLowerCase().includes(q));
  document.getElementById('stTotal').textContent = devices.length;
  document.getElementById('stActive').textContent = devices.filter(d=>!d.banned).length;
  document.getElementById('stBanned').textContent = devices.filter(d=>d.banned).length;
  document.getElementById('liveDot').className = devices.length ? 'dot' : 'dot off';
  const wrap = document.getElementById('tableWrap');
  const colgroup = '<colgroup><col class="c-id"><col class="c-note"><col class="c-app"><col class="c-seen"><col class="c-status"><col class="c-act"></colgroup>';
  const thead = '<thead><tr>'+
    '<th>机器码 / DEVICE ID</th><th>备注</th><th class="hide-m">客户端</th><th class="hide-m">最近活跃</th><th>状态</th><th style="text-align:right">操作</th>'+
    '</tr></thead>';
  const tbodyRows = list.map(d=>'<tr>'+
    '<td class="mono" title="'+esc(d.id)+'">'+
      esc(fmtDeviceId(d.id))+
      ((d.version||d.app)?'<div class="mobile-ver">'+clientCell(d)+'</div>':'')+
    '</td>'+
    '<td><span class="note-cell dim" data-note="'+esc(d.id)+'" title="点击编辑备注">'+esc(d.note||'—')+'</span></td>'+
    '<td class="hide-m">'+clientCell(d)+'</td>'+
    '<td class="hide-m"><span class="mono">'+ago(d.lastSeen)+'</span></td>'+
    '<td>'+(d.banned
      ? '<span class="badge ban"><span class="b-dot"></span>已封禁'+(d.bannedAt?' · '+ago(d.bannedAt):'')+'</span>'
      : '<span class="badge ok"><span class="b-dot"></span>正常</span>')+'</td>'+
    '<td style="text-align:right"><div class="row-flex" style="justify-content:flex-end">'+
      (d.banned
        ? '<button class="btn sm" data-act="unban" data-id="'+esc(d.id)+'">解禁</button>'
        : '<button class="btn ghost sm" data-act="ban" data-id="'+esc(d.id)+'">封禁</button>')+
      '<button class="btn ghost sm" data-act="delete" data-id="'+esc(d.id)+'">移除</button>'+
    '</div></td>'+
  '</tr>').join('');

  if(window.innerWidth <= 860){
    /* 移动端：单表+sticky表头，外层#tableWrap横向滚动，底部出现滚动条 */
    const rows = list.length ? tbodyRows : '<tr><td colspan="6"><div class="empty">NO DEVICES · 暂无登记设备<br><br>设备在用户完成登录后自动出现在这里</div></td></tr>';
    wrap.innerHTML = '<table>'+colgroup+thead+'<tbody>'+rows+'</tbody></table>';
  } else {
    /* 桌面端：双表结构，表头固定 */
    const head = '<div class="table-head"><table>'+colgroup+thead+'</table></div>';
    const body = list.length
      ? '<div class="table-scroll"><table>'+colgroup+'<tbody>'+tbodyRows+'</tbody></table></div>'
      : '<div class="table-scroll"><div class="empty">NO DEVICES · 暂无登记设备<br><br>设备在用户完成登录后自动出现在这里</div></div>';
    wrap.innerHTML = head + body;
    syncColWidths();
  }
}
/* 事件委托：表格按钮与备注单元格用 data 属性，避免内联 onclick 的引号转义
   （本文件会被 Worker 模板字符串内嵌，反斜杠转义会被提前吃掉） */
document.getElementById('tableWrap').addEventListener('click', function(e){
  const btn = e.target.closest('button[data-act]');
  if(btn){ doAct(btn.dataset.act, btn.dataset.id); return; }
  const cell = e.target.closest('.note-cell');
  if(cell) editNote(cell);
});
/* 备注：点击单元格变输入框，Enter/失焦保存 */
function editNote(cell){
  if(cell.querySelector('input')) return;
  const id = cell.dataset.note;
  const d = devices.find(x=>x.id===id);
  const old = (d && d.note) || '';
  cell.innerHTML = '<input type="text" value="'+esc(old)+'" style="width:100%;max-width:130px;padding:4px 8px;font-size:12px">';
  const input = cell.querySelector('input');
  input.focus(); input.select();
  let done = false;
  const save = async function(){
    if(done) return; done = true;
    const v = input.value.trim();
    if(v !== old){
      if(await API.act('note', id, { note: v })){ toast('备注已保存'); await loadDevices(); }
      else toast('备注保存失败：管理接口不可用，请重新登录');
    }
    else renderTable();
  };
  input.addEventListener('keydown', function(ev){ if(ev.key==='Enter') save(); if(ev.key==='Escape'){ done=true; renderTable(); } });
  input.addEventListener('blur', save);
}
/* 自动刷新（30 秒） */
let autoTimer = setInterval(function(){ if(authed) loadDevices(); }, 30000);
function toggleAuto(){
  const btn = document.getElementById('autoBtn');
  if(autoTimer){ clearInterval(autoTimer); autoTimer = null; btn.textContent = '自动刷新: 关'; }
  else{
    autoTimer = setInterval(function(){ if(authed) loadDevices(); }, 30000);
    btn.textContent = '自动刷新: 开';
  }
}
function toggleSidebar(){
  const aside = document.querySelector('aside');
  const overlay = document.getElementById('sidebarOverlay');
  const isMobile = window.innerWidth <= 860;
  if(isMobile){
    const expanded = aside.classList.toggle('expanded');
    if(overlay) overlay.classList.toggle('show', expanded);
    // 移动端不持久化展开状态，刷新后恢复默认折叠
  }else{
    aside.classList.toggle('collapsed');
    localStorage.setItem('oc_sidebar', aside.classList.contains('collapsed') ? '1' : '0');
  }
}
(function initSidebar(){
  if(window.innerWidth > 860){
    const saved = localStorage.getItem('oc_sidebar');
    if(saved === '1') document.querySelector('aside').classList.add('collapsed');
  }
})();
async function doAct(action,id){
  if(!(await API.act(action,id))){ toast('操作失败：管理接口不可用，请重新登录'); return; }
  toast({ban:'已封禁该设备',unban:'已解除封禁',delete:'已移除登记'}[action]||'完成');
  await loadDevices();
}

/* ---------- 外观设置（localStorage 持久化） ---------- */
function setTheme(t){
  document.documentElement.dataset.theme = t;
  localStorage.setItem('oc_theme',t);
  document.getElementById('thDark').classList.toggle('on',t==='dark');
  document.getElementById('thLight').classList.toggle('on',t==='light');
}

/* 修复：背景图加载失败时自动提示并回退 */
function setBg(url){
  const layer = document.getElementById('bgLayer');
  if(!url){
    layer.style.backgroundImage = 'none';
    localStorage.removeItem('oc_bg');
    return;
  }
  const img = new Image();
  img.onload = function(){
    layer.style.backgroundImage = 'url("'+url+'")';
    localStorage.setItem('oc_bg',url);
  };
  img.onerror = function(){
    layer.style.backgroundImage = 'none';
    localStorage.removeItem('oc_bg');
    document.getElementById('bgUrl').value = '';
    toast('背景加载失败：链接受防盗链保护或不是图片直链');
  };
  img.src = url;
}

function setOpacity(v){
  document.documentElement.style.setProperty('--fg-opacity', v/100);
  document.getElementById('opVal').textContent = v+'%';
  document.getElementById('opRange').value = v;
  localStorage.setItem('oc_opacity',v);
}
function resetPrefs(){
  localStorage.removeItem('oc_theme');localStorage.removeItem('oc_bg');localStorage.removeItem('oc_opacity');
  setTheme('light'); setBg(''); setOpacity(96);
  document.getElementById('bgUrl').value = '';
  toast('已恢复默认外观');
}
(function initPrefs(){
  setTheme(localStorage.getItem('oc_theme')||'light');
  const bg = localStorage.getItem('oc_bg')||'';
  if(bg){ setBg(bg); document.getElementById('bgUrl').value = bg; }
  setOpacity(localStorage.getItem('oc_opacity')||96);
})();
/* resize 跨桌面/移动端边界时重新渲染，确保双表/单表结构切换正确 */
let lastVpWide = window.innerWidth > 860;
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const nowWide = window.innerWidth > 860;
    if(nowWide !== lastVpWide && authed){
      lastVpWide = nowWide;
      renderTable();
      // 从移动端切到桌面端时清理展开状态
      const aside = document.querySelector('aside');
      const overlay = document.getElementById('sidebarOverlay');
      aside.classList.remove('expanded');
      if(overlay) overlay.classList.remove('show');
    }
  }, 200);
});

/* ---------- toast ---------- */
let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}
</script>
</body>
</html>
`;

/* ---------- 管理 Cookie（HMAC 签名，密钥即 ADMIN_PASSWORD 本身） ---------- */
async function signToken(secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("oc-admin-v1"));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function isAuthed(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(COOKIE_NAME + "=([0-9a-f]{64})"));
  if (!m) return false;
  return m[1] === await signToken(env.ADMIN_PASSWORD);
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

/* ---------- 机器码：统一格式与校验 ---------- */
const DEVICE_ID_RAW_RE = /^[0-9a-fA-F]{16}$/;
const DEVICE_ID_INPUT_RE = /^[0-9a-fA-F]{4}(?:[-]?[0-9a-fA-F]{4}){3}$|^[0-9a-fA-F]{16}$/;

/** 去掉连接符、小写化，得到 16 位十六进制原始机器码；非法则返回 null。 */
function normalizeDeviceId(id) {
  if (typeof id !== "string") return null;
  const raw = id.replace(/-/g, "").toLowerCase();
  return DEVICE_ID_RAW_RE.test(raw) ? raw : null;
}

/** 将 16 位原始机器码格式化为 XXXX-XXXX-XXXX-XXXX。 */
function formatDeviceId(raw) {
  if (!DEVICE_ID_RAW_RE.test(String(raw))) return String(raw);
  const v = String(raw).toLowerCase();
  return `${v.slice(0, 4)}-${v.slice(4, 8)}-${v.slice(8, 12)}-${v.slice(12, 16)}`;
}

/* ---------- KV 绑定解析（容忍 Dashboard 里绑定名填错 / 未重新部署） ----------
 * Dashboard 的「绑定」表有「变量名称」和「KV 命名空间」两列，容易把变量名称
 * 填成 oss、把命名空间选成 DEVICES；也可能加了绑定却没重新部署（绑定不会
 * 热更新到已部署版本）。两种情况都表现为 env.DEVICES 不存在：
 *   /admin/api/devices 抛 500 → 管理页降级成模拟数据 → 看到假设备与假的 "2.1.0"。
 * 这里按常见名 + KV 结构特征找到真正的绑定，统一挂到 env.DEVICES，
 * 并把命中的名字交给 /admin/api/health 输出，方便一眼核对配置。
 */
const KV_BINDING_NAMES = ["DEVICES", "devices", "oss", "KV", "DEVICES_KV", "DEVICE_KV"];
function resolveKVBinding(env) {
  const isKV = v => v && typeof v === "object" && typeof v.get === "function" && typeof v.put === "function";
  for (const name of KV_BINDING_NAMES) {
    if (isKV(env?.[name])) return { kv: env[name], name };
  }
  for (const [name, value] of Object.entries(env || {})) {
    if (isKV(value)) return { kv: value, name };
  }
  return { kv: null, name: null };
}

/* ---------- 面板配置（KV 持久化，任意端打开面板均为同一参数） ---------- */
async function getConfig(env) {
  const cfg = await env.DEVICES.get(CONFIG_KEY, "json");
  const limit = Number(cfg?.limit);
  return { limit: Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT };
}

async function countDevices(env) {
  let count = 0;
  let cursor;
  do {
    const page = await env.DEVICES.list({ prefix: KV_PREFIX, cursor });
    count += page.keys.length;
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return count;
}

/* ---------- 版本号解析 ----------
 * 各端历史上用过 version / v / ver / appVersion / versionName / build 等字段名，
 * 也可能放在查询参数或 X-App-Version 请求头里。统一在此收敛：
 *  - 完整保留原字符串（如 "2.1.05-oss"），绝不按版本号语义截断；
 *  - 仅设 64 字符上限防滥用（正常版本号远小于此）；
 *  - 任一来源缺失时由调用方回退到 KV 里的旧值，不写空、不写 "2.1.0" 之类默认值。
 */
const VERSION_KEYS = ["version", "v", "ver", "appVersion", "app_version", "versionName", "clientVersion", "client_version", "build"];
const VERSION_HEADERS = ["x-app-version", "x-client-version", "x-appversion"];
function readVersion(sources) {
  for (const src of sources) {
    if (!src) continue;
    const isMap = typeof src.get === "function";
    const keys = isMap ? [...VERSION_HEADERS, ...VERSION_KEYS] : VERSION_KEYS;
    for (const k of keys) {
      const val = isMap ? src.get(k) : src[k];
      if (val != null && String(val).trim()) return String(val).trim().slice(0, 64);
    }
  }
  return "";
}

/* ---------- 设备 API（App 端调用，匿名） ---------- */
async function handleCheckin(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }
  const rawId = normalizeDeviceId(String(body.id || "").trim());
  // 兼容历史 8–64 位机器码；新设备统一为 16 位十六进制
  const legacyId = String(body.id || "").trim().replace(/-/g, "").toLowerCase();
  const id = rawId || (legacyId.length >= 8 && legacyId.length <= 64 && /^[0-9a-f]{8,64}$/.test(legacyId) ? legacyId : null);
  if (!id) return json({ ok: false, error: "invalid_device_id", help: "机器码须为 16 位十六进制，可带连字符（XXXX-XXXX-XXXX-XXXX）" }, 400);

  const key = KV_PREFIX + id;
  const now = Date.now();
  const existing = await env.DEVICES.get(key, "json");

  // 数量上限：新设备超过上限时拒绝登记（App 端 fail-open，不影响已有设备）
  if (!existing) {
    const { limit } = await getConfig(env);
    if (await countDevices(env) >= limit) {
      return json({ ok: false, error: "limit_reached" }, 403);
    }
  }

  // 版本号：优先本次上报（body 字段 / 请求头），没带才沿用 KV 旧值，避免把完整版本覆盖成空。
  const reportedVersion = readVersion([body, request.headers]);
  const record = {
    id: id.toLowerCase(),
    firstSeen: existing?.firstSeen ?? now,
    lastSeen: now,
    app: String(body.app || body.channel || existing?.app || "unknown").slice(0, 16),
    version: reportedVersion || String(existing?.version || ""),
    banned: existing?.banned ?? false,
    note: existing?.note ?? "",
    ...(existing?.bannedAt ? { bannedAt: existing.bannedAt } : {}),
  };
  await env.DEVICES.put(key, JSON.stringify(record));
  return json({ ok: true });
}

async function handleStatus(request, url, env) {
  const q = String(url.searchParams.get("id") || "").trim();
  const id = normalizeDeviceId(q) || q.replace(/-/g, "").toLowerCase();
  if (!id || id.length < 8 || id.length > 64 || !/^[0-9a-f]{8,64}$/.test(id)) return json({ banned: false });
  const key = KV_PREFIX + id;
  const record = await env.DEVICES.get(key, "json");
  if (record) {
    // App 每次状态轮询都应携带当前版本/渠道（v / app 参数或 X-App-Version 头）：
    // 版本变化或超过 60 秒未活跃时回写 KV，面板"客户端版本 / 最近活跃"因此实时准确——
    // 覆盖安装升级后无需重新登录，最迟 5 分钟（App 节流间隔）面板即显示完整版本号。
    // 注意：App 端若不带 v，这里读到的就是空串，版本会停留在上次 checkin 的旧值，
    // 表现为"版本号只显示旧的短版本"。DeviceGate.isBanned() 必须拼上 v / app 参数。
    const v = readVersion([url.searchParams, request.headers]);
    const app = String(url.searchParams.get("app") || url.searchParams.get("channel") || request.headers.get("x-app-channel") || "").slice(0, 16);
    const now = Date.now();
    const changed = (v && v !== record.version) || (app && app !== record.app);
    if (changed || now - (record.lastSeen || 0) > 60000) {
      if (v) record.version = v;
      if (app) record.app = app;
      record.lastSeen = now;
      await env.DEVICES.put(key, JSON.stringify(record));
    }
    return json({ banned: record.banned === true });
  }
  // 未登记设备：数量已达上限则按封禁处理（App 只报通用登录失败，用户无感知）
  const { limit } = await getConfig(env);
  if (await countDevices(env) >= limit) return json({ banned: true, limited: true });
  return json({ banned: false });
}

/* ---------- 管理 API（需 Cookie） ---------- */
async function handleAdminLogin(request, env) {
  if (!env.ADMIN_PASSWORD) return json({ ok: false, error: "admin_not_configured" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }
  if (String(body.password || "") !== env.ADMIN_PASSWORD) {
    return json({ ok: false }, 401);
  }
  const token = await signToken(env.ADMIN_PASSWORD);
  return json({ ok: true }, 200, {
    "set-cookie": `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
  });
}

async function handleAdminDevices(env) {
  // 明确报错而不是抛异常：Worker 抛 500 时管理页会把它当成"接口不可用"，
  // 悄悄降级成内置模拟数据，管理员就会看到假设备和假的 "2.1.0" 版本号。
  if (!env.DEVICES || typeof env.DEVICES.get !== "function") {
    return json({ ok: false, error: "kv_not_bound", help: "KV namespace DEVICES 未绑定" }, 503);
  }
  const out = [];
  let cursor;
  do {
    const page = await env.DEVICES.list({ prefix: KV_PREFIX, cursor });
    for (const k of page.keys) {
      const v = await env.DEVICES.get(k.name, "json");
      if (v) out.push(v);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  out.sort((a, b) => b.lastSeen - a.lastSeen);
  return json({ devices: out });
}

async function handleAdminAction(action, request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }
  const id = String(body.id || "").toLowerCase();
  const key = KV_PREFIX + id;
  const now = Date.now();
  const record = await env.DEVICES.get(key, "json");
  if (!record) return json({ ok: false, error: "not_found" }, 404);

  if (action === "delete") {
    await env.DEVICES.delete(key);
  } else if (action === "note") {
    record.note = String(body.note || "").slice(0, 100);
    await env.DEVICES.put(key, JSON.stringify(record));
  } else {
    record.banned = action === "ban";
    if (action === "ban") record.bannedAt = now;
    else delete record.bannedAt;
    await env.DEVICES.put(key, JSON.stringify(record));
  }
  return json({ ok: true });
}

async function handleAdminConfigGet(env) {
  const { limit } = await getConfig(env);
  return json({ limit, count: await countDevices(env) });
}

async function handleAdminConfigPost(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }
  const limit = Number(body.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100000) {
    return json({ ok: false, error: "bad_limit" }, 400);
  }
  await env.DEVICES.put(CONFIG_KEY, JSON.stringify({ limit }));
  return json({ ok: true, limit });
}

/** 部署健康检查：返回 Worker 运行依赖是否就绪，用于部署脚本判断是否成功。 */
async function handleAdminHealth(env) {
  const kvOk = typeof env.DEVICES?.get === "function";
  const pwdOk = !!env.ADMIN_PASSWORD && String(env.ADMIN_PASSWORD).length >= 1;
  const cfg = kvOk ? await getConfig(env).catch(() => ({ limit: DEFAULT_LIMIT })) : { limit: DEFAULT_LIMIT };
  const count = kvOk ? await countDevices(env).catch(() => 0) : 0;
  return json({
    ok: kvOk && pwdOk,
    checks: {
      kv_namespace: kvOk,
      admin_password: pwdOk,
    },
    // 只输出绑定变量名（不含 namespace id / 密钥值），用于自证配置是否填对
    kv_binding: env.__kvBindingName || null,
    config: { limit: cfg.limit },
    devices: { count },
    hint: kvOk && pwdOk
      ? "ready"
      : !kvOk
        ? (env.__kvBindingName
            ? "已检测到 KV 绑定，但变量名称是 '" + env.__kvBindingName + "'；建议改成 DEVICES，并点「保存并部署」让绑定生效"
            : "运行时没有检测到任何 KV 绑定：请在 Dashboard「设置 → 绑定」添加 KV 命名空间绑定，变量名称填 DEVICES，然后点「保存并部署」")
        : "ADMIN_PASSWORD 未配置，请用 secret 注入",
  }, kvOk && pwdOk ? 200 : 503, { "cache-control": "no-store" });
}

/* ---------- 自建部署指南（Worker 内嵌网页，供 App 调用） ---------- */
const SELF_HOSTING_MD = `# Orange Cloud 自建部署与定制指南

本指南帮助你基于本仓库构建、部署并分发**属于你自己的 Orange Cloud 版本**：自建 Cloudflare OAuth Client、OAuth 回调中转 Worker，以及 Android / Web 的 CI 构建。

> 阅读对象：有一定动手能力、拥有 Cloudflare 账号和一个自有域名（免费域名如 us.kg 亦可）的用户。

---

## 0. 架构总览

\`\`\`
┌────────────┐   授权请求    ┌──────────────────┐
│  App/Web    │ ───────────▶ │ Cloudflare OAuth  │
│ (你的构建)  │ ◀─────────── │ (你的 Client)     │
└─────┬──────┘   code+state  └──────────────────┘
      │ 回调 https://你的域名/oauth/callback
      ▼
┌──────────────────────────────────────────────┐
│ Cloudflare Worker（workers/oauth-callback）    │
│  · /oauth/callback  302 中转回 App            │
│  · KV 命名空间 DEVICES：OAuth 回调状态暂存      │
└──────────────────────────────────────────────┘
\`\`\`

- App 是 PKCE 公共客户端（\`token_endpoint_auth_method = none\`），**没有也不需要 Client Secret**；
- 所有机密（管理密码、API Token）只存在于 Cloudflare Secret / GitHub Secrets，**绝不写进仓库**。

---

## 1. 创建 Cloudflare OAuth Client

1. 登录 Cloudflare 控制台 → 选中你的账号 → **Manage Account → OAuth clients → 创建客户端**。
2. 按此填写：

   | 字段 | 值 |
   |---|---|
   | 客户端名称 | 你的应用名（如 \`Orange Cloud\`） |
   | 响应类型 | \`Code, Token, ID Token\` |
   | 授权类型 | \`Authorization Code, Refresh Token\` |
   | 令牌身份验证方法 | \`None (PKCE)\` |
   | 重定向（回调）URL | \`https://<你的域名>/oauth/callback\` |
   | 客户端 URL | \`https://<你的域名>\` |

3. **范围（Scopes）**：把需要的权限全部勾上（本仓库权限目录支持 142 项，建议全选，App 内登录时可按需裁剪）。
4. 保存后记录 **Client ID**（32 位十六进制）。

## 2. 域名验证 + 转 Public（分发必需）

新客户端默认是 **Private**——只有你自己账号的成员能授权，其他用户会看到
"This is a private application and can only be authorized by members of the developer's account"。

1. 在客户端列表复制 **Verification DNS TXT record** 的完整值
   （形如 \`cloudflare_oauth_client_publisher=xxxxxxxx\`，每次创建/重置都可能变化，以页面当前显示为准）。
2. 到域名的 DNS 管理页添加记录：
   - 类型 \`TXT\`，名称 \`<回调域名的主机部分>\`（如回调是 \`oss.example.com\` 则填 \`oss\`），内容粘贴完整值。
3. 编辑客户端 → 高级选项 → 上传 **徽标（Logo）**（转 Public 的必填项），保存。
4. 列表页 **⋯ → Restart Verification**，等状态变绿 **Verified**。
5. **⋯ → Change Visibility → Public**。之后任何 Cloudflare 用户都能授权。

## 3. 部署 OAuth 回调 Worker

代码在 [\`workers/oauth-callback/\`](../workers/oauth-callback/)。

\`\`\`bash
cd workers/oauth-callback
npx wrangler login
npx wrangler kv namespace create DEVICES   # 记下返回的 id
\`\`\`

编辑 \`wrangler.toml\`：

\`\`\`toml
name = "你的worker名"
main = "worker.js"
compatibility_date = "2026-08-28"
workers_dev = false
routes = [ { pattern = "<你的域名>", custom_domain = true } ]   # 与 OAuth 回调同域名

[[kv_namespaces]]
binding = "DEVICES"          # 变量名必须叫 DEVICES
id = "上一步创建的KV id"
\`\`\`

部署：

\`\`\`bash
npx wrangler deploy
\`\`\`

也可以全部在 Cloudflare 网页完成：Workers → 粘贴 \`worker.js\` → Settings 里绑 KV（变量名 \`DEVICES\`）、绑自定义域。

## 4. GitHub Actions 构建（Android APK + Web）

Fork 本仓库后，在 **Settings → Secrets and variables → Actions** 配置：

**Secrets（机密）**

| 名称 | 用途 | 必填 |
|---|---|---|
| \`OAUTH_CLIENT_ID\` | 你的 OAuth Client ID | 否（不填用仓库默认值） |
| \`CLOUDFLARE_API_TOKEN\` | Web 构建用（Cloudflare API Token） | 构建 Web 时必填 |
| \`KEYSTORE_BASE64\` | 固定签名密钥（base64 编码的 .keystore） | 分发时强烈建议 |
| \`KEYSTORE_ALIAS\` | 密钥别名（如 \`release\`） | 配了密钥则必填 |
| \`KEYSTORE_PASSWORD\` | 密钥库与密钥密码 | 配了密钥则必填 |

> **签名一致性 = 可覆盖安装**：不配 \`KEYSTORE_*\` 时 CI 每次生成临时密钥，每个版本签名都不同，Android 会拒绝覆盖安装（用户只能卸载重装、丢失本地账号数据）。配置固定密钥后所有版本签名一致，升级直接覆盖。生成方式：
> \`\`\`bash
> keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10950
> base64 -w 0 release.keystore   # 输出粘贴到 Secret KEYSTORE_BASE64
> \`\`\`
> 注意：如果已经用临时密钥发布过版本，老用户仍需卸载重装一次（机器码不受影响），之后的版本就能正常覆盖了。

**Variables（变量）**

| 名称 | 示例 | 必填 |
|---|---|---|
| \`OAUTH_REDIRECT_URI\` | \`https://<你的域名>/oauth/callback\` | 使用自有域名时必填 |

触发构建：**Actions → Build & Release (Web + Android) → Run workflow**，填写版本号（如 \`2.1.01\`），完成后自动生成 GitHub Release 并附带 OSS APK。

> 机器码采用 Widevine 设备 ID，与签名无关，更换签名密钥不影响设备识别。

## 5. 本地构建 Android

\`\`\`bash
cd apps/android
cat > local.properties <<EOF
sdk.dir=<你的SDK路径>
OAUTH_CLIENT_ID=<你的Client ID>
OAUTH_REDIRECT_URI=https://<你的域名>/oauth/callback
EOF
./gradlew assembleOssRelease
\`\`\`

## 6. iOS 构建

1. 安装 Xcode，打开 \`apps/ios/\` 工程；
2. 修改 \`Orange Cloud/Core/Auth/OAuthConfig.swift\` 中的 \`clientId\` 与 \`redirectUri\` 为你的值；
3. 用自己的 Apple 开发者证书签名（CI 不含 iOS 构建）。

## 7. 定制建议

- **应用名 / 图标 / 包名**：\`apps/android/app/src/main/res/values/strings.xml\` 的 \`app_name\`、\`build.gradle.kts\` 的 \`applicationIdSuffix\`、各 \`mipmap\` 目录图标；
- **关于页链接**：\`ui/settings/SettingsScreen.kt\`（GitHub 仓库地址、隐私政策、使用条款）；
- **多语言**：13 个 \`values-*/strings.xml\`，新增文案记得全部补齐；
- **版本更新日志**：编辑 \`packages/changelog/android.json\` / \`ios.json\` 后运行 \`pnpm changelog:gen\`。

## 8. 安全须知

- API Token、keystore 密码等**只放 Secret**，永远不要提交进仓库；
- 如果密码曾经明文泄露，请立即更换；
- OAuth Client 转 Public 后任何人都能授权，请妥善保管 Client ID 与回调中转 Worker。
`;

/** 极简 Markdown → HTML */
function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  let out = "";
  let inCode = false;
  let codeLang = "";
  let codeBody = [];
  let inUl = false;
  let inOl = false;

  const closeCode = () => {
    if (inCode) {
      out += `<pre class="sh-pre"><code class="sh-code">${escapeHtml(codeBody.join("\n"))}</code></pre>\n`;
      inCode = false;
      codeLang = "";
      codeBody = [];
    }
  };

  const closeLists = () => {
    if (inUl) { out += "</ul>\n"; inUl = false; }
    if (inOl) { out += "</ol>\n"; inOl = false; }
  };

  const parseTableCells = (row) => {
    return row
      .replace(/^\s*\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map(c => c.trim());
  };

  const isTableRow = (s) => /^\s*\|.*\|\s*$/.test(s);
  const isSeparatorRow = (cells) => cells.length > 0 && cells.every(c => /^\s*:?-+:?\s*$/.test(c));

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.replace(/\r$/, "");

    if (line.startsWith("```")) {
      if (inCode) { closeCode(); }
      else { closeLists(); codeLang = line.slice(3).trim(); inCode = true; }
      i++;
      continue;
    }

    if (inCode) { codeBody.push(line); i++; continue; }

    // Table block
    if (isTableRow(line)) {
      closeLists();
      const rows = [];
      while (i < lines.length && isTableRow(lines[i].replace(/\r$/, ""))) {
        rows.push(lines[i].replace(/\r$/, ""));
        i++;
      }
      const cellsRows = rows.map(parseTableCells);
      let hasHeader = false;
      let headerCells = [];
      let bodyRows = cellsRows;
      if (cellsRows.length >= 2 && isSeparatorRow(cellsRows[1])) {
        hasHeader = true;
        headerCells = cellsRows[0];
        bodyRows = cellsRows.slice(2);
      }
      if (cellsRows.length > 0 && (!hasHeader || bodyRows.length > 0 || headerCells.length > 0)) {
        out += '<div class="sh-table-wrap">\n<table class="sh-table">\n';
        if (hasHeader) {
          out += '<thead><tr>' + headerCells.map(c => `<th>${inlineFmt(c)}</th>`).join("") + '</tr></thead>\n';
        }
        out += '<tbody>\n';
        for (const row of bodyRows) {
          out += '<tr>' + row.map(c => `<td>${inlineFmt(c)}</td>`).join("") + '</tr>\n';
        }
        out += '</tbody>\n</table>\n</div>\n';
      }
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeLists();
      const level = Math.min(heading[1].length + 1, 6);
      out += `<h${level} class="sh-h">${inlineFmt(heading[2])}</h${level}>\n`;
      i++;
      continue;
    }

    const ulMatch = line.match(/^\s*[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inUl) { closeLists(); out += '<ul class="sh-ul">\n'; inUl = true; }
      out += `<li>${inlineFmt(ulMatch[1])}</li>\n`;
      i++;
      continue;
    }

    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inOl) { closeLists(); out += '<ol class="sh-ol">\n'; inOl = true; }
      out += `<li>${inlineFmt(olMatch[1])}</li>\n`;
      i++;
      continue;
    }

    if (/^\s*$/.test(line)) { closeLists(); i++; continue; }

    closeLists();
    out += `<p class="sh-p">${inlineFmt(line)}</p>\n`;
    i++;
  }

  closeCode();
  closeLists();
  return out;
}

function inlineFmt(text) {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="sh-img" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="sh-a">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="sh-inline">$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function handleSelfHosting() {
  const body = markdownToHtml(SELF_HOSTING_MD);
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Orange Cloud · 自建部署指南</title>
<style>
:root {
  --oc-orange: #f48120;
  --t-primary: rgba(0, 0, 0, 0.88);
  --t-secondary: rgba(60, 60, 67, 0.62);
  --t-tertiary: rgba(60, 60, 67, 0.32);
  --glass-bg: rgba(252, 250, 247, 0.6);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-inset: rgba(255, 255, 255, 0.4);
  --glass-shadow: 0 5px 12px rgba(0, 0, 0, 0.07);
  --divider: rgba(60, 60, 67, 0.14);
  --radius-island: 20px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --t-primary: rgba(255, 255, 255, 0.92);
    --t-secondary: rgba(235, 235, 245, 0.62);
    --t-tertiary: rgba(235, 235, 245, 0.32);
    --glass-bg: rgba(46, 42, 40, 0.52);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-inset: rgba(255, 255, 255, 0.09);
    --glass-shadow: 0 5px 14px rgba(0, 0, 0, 0.3);
    --divider: rgba(235, 235, 245, 0.13);
  }
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body {
  margin: 0;
  position: relative;
  font-family: -apple-system, "SF Pro Text", system-ui, "PingFang SC", "PingFang TC", "PingFang HK", "Hiragino Sans", "Noto Sans CJK SC", sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  background: linear-gradient(180deg, #ffe8d1 0%, #f9f3ea 100%);
  color: var(--t-primary);
  overflow-x: hidden;
}
body::before {
  content: "";
  position: absolute;
  left: 50%;
  top: -15%;
  width: min(1040px, 160vw);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 176, 102, 0.5) 0%, rgba(255, 176, 102, 0) 70%);
  pointer-events: none;
}
.f-display {
  font-family: ui-rounded, -apple-system, system-ui, sans-serif;
  letter-spacing: 0.2px;
}
.t-primary { color: var(--t-primary); }
.t-secondary { color: var(--t-secondary); }
.t-tertiary { color: var(--t-tertiary); }

/* Header */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 16px 24px;
  background: rgba(252, 250, 247, 0.55);
  -webkit-backdrop-filter: blur(18px) saturate(1.5);
  backdrop-filter: blur(18px) saturate(1.5);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.5);
}
@media (prefers-color-scheme: dark) {
  .site-header {
    background: rgba(46, 42, 40, 0.45);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
}
.header-inner {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--t-primary);
}
.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f48120, #d96d0e);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(244, 129, 32, 0.3);
}
.brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

/* Main */
.container {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
  padding: 120px 24px 80px;
}
.page-title {
  font-size: 34px;
  font-weight: 700;
  margin-bottom: 8px;
}
.page-sub {
  font-size: 13px;
  color: var(--t-secondary);
  margin-bottom: 32px;
}

/* Glass card */
.glass {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(22px) saturate(1.7);
  backdrop-filter: blur(22px) saturate(1.7);
  border: 0.5px solid var(--glass-border);
  border-radius: var(--radius-island);
  box-shadow:
    inset 0 1px 0 var(--glass-inset),
    var(--glass-shadow);
  padding: 36px;
}

/* Markdown content */
.sh-h {
  font-size: 18px;
  font-weight: 600;
  color: var(--t-primary);
  padding: 28px 0 12px;
  border-top: 0.5px solid var(--divider);
}
.sh-h:first-of-type {
  border-top: none;
  padding-top: 0;
}
.sh-p, .sh-ul, .sh-ol {
  font-size: 15px;
  line-height: 1.65;
  color: var(--t-secondary);
  margin-bottom: 14px;
}
.sh-p:last-child { margin-bottom: 0; }
.sh-ul, .sh-ol {
  margin-left: 22px;
}
.sh-ul { list-style-type: disc; }
.sh-ol { list-style-type: decimal; }
.sh-ul li, .sh-ol li { margin-bottom: 8px; }
.sh-a {
  color: var(--oc-orange);
  text-decoration: none;
  border-bottom: 1px solid rgba(244, 129, 32, 0.3);
}
.sh-a:hover { border-bottom-color: var(--oc-orange); }
.sh-inline {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 13px;
  background: rgba(60, 60, 67, 0.06);
  padding: 2px 6px;
  border-radius: 6px;
  color: var(--t-primary);
}
.sh-pre {
  background: rgba(60, 60, 67, 0.05);
  border: 0.5px solid var(--divider);
  border-radius: 14px;
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
}
.sh-pre code {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
  display: block;
  white-space: pre;
  color: var(--t-primary);
}
blockquote {
  border-left: 3px solid var(--oc-orange);
  padding-left: 14px;
  margin: 16px 0;
  color: var(--t-secondary);
  font-size: 14px;
}
hr {
  border: 0;
  border-top: 0.5px solid var(--divider);
  margin: 24px 0;
}
.updated {
  margin-top: 24px;
  font-size: 13px;
  color: var(--t-tertiary);
}

/* Tables */
.sh-table-wrap {
  overflow-x: auto;
  margin: 16px 0;
  border-radius: 14px;
  border: 0.5px solid var(--divider);
  background: rgba(60, 60, 67, 0.03);
}
.sh-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
  color: var(--t-primary);
}
.sh-table thead {
  background: rgba(60, 60, 67, 0.06);
  border-bottom: 0.5px solid var(--divider);
}
.sh-table th,
.sh-table td {
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
  border-bottom: 0.5px solid var(--divider);
}
.sh-table th {
  font-weight: 600;
  color: var(--t-primary);
  white-space: nowrap;
}
.sh-table tbody tr:last-child td {
  border-bottom: none;
}
.sh-table td code {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 12px;
  background: rgba(60, 60, 67, 0.06);
  padding: 2px 5px;
  border-radius: 5px;
  color: var(--t-primary);
}

@media (max-width: 600px) {
  .container { padding: 100px 16px 64px; }
  .glass { padding: 24px; }
  .page-title { font-size: 28px; }
  .site-header { padding: 14px 16px; }
}
</style>
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="brand">
      <div class="brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="#fff"/></svg>
      </div>
      <span class="brand-name">Orange Cloud</span>
    </a>
  </div>
</header>
<main class="container">
  <h1 class="page-title f-display t-primary">自建部署指南</h1>
  <p class="page-sub">Orange Cloud Self-Hosting Guide</p>
  <div class="glass">${body}</div>
  <p class="updated">最后更新：2026 年 8 月</p>
</main>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

/* ---------- 路由 ---------- */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // KV 绑定归一化：把任意变量名的 KV 绑定统一挂到 env.DEVICES，
    // 并记下命中的名字供 /admin/api/health 输出（见 resolveKVBinding 注释）。
    const resolved = resolveKVBinding(env);
    env = {
      ...env,
      DEVICES: resolved.kv || env.DEVICES,
      __kvBindingName: resolved.name,
    };

    // OAuth 回调中转（原有功能）
    if (path === CALLBACK_PATH) {
      const hasCode = url.searchParams.has("code");
      const hasState = url.searchParams.has("state");
      const hasError = url.searchParams.has("error");
      if (!hasError && (!hasCode || !hasState)) {
        return new Response("Missing OAuth callback parameters", {
          status: 400, headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      const appCallback = new URL(APP_CALLBACK);
      url.searchParams.forEach((value, key) => appCallback.searchParams.set(key, value));
      return Response.redirect(appCallback.toString(), 302);
    }

    // 设备 API：缺少 KV 绑定时代码会直接抛错，这里先给明确提示
    if (path === "/api/device/checkin" && method === "POST") {
      if (typeof env.DEVICES?.get !== "function") return json({ ok: false, error: "kv_not_bound", help: "Dashboard「设置 → 绑定」添加 KV 命名空间绑定，变量名称必须是 DEVICES，然后点「保存并部署」" }, 503);
      return handleCheckin(request, env);
    }
    if (path === "/api/device/status" && method === "GET") {
      if (typeof env.DEVICES?.get !== "function") return json({ banned: false, error: "kv_not_bound", help: "KV 绑定的变量名必须是 DEVICES" }, 503);
      return handleStatus(request, url, env);
    }

    // 自建部署指南页面（App 内调用）
    if (path === "/self-hosting" || path === "/self-hosting/") {
      return handleSelfHosting();
    }

    // 管理面板页面
    if (path === "/admin" || path === "/admin/") {
      return new Response(ADMIN_HTML, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    // 管理 API
    if (path === "/admin/api/login" && method === "POST") return handleAdminLogin(request, env);

    // 健康检查放在鉴权门之前：部署脚本需要匿名探活。
    // 只返回布尔标志与计数，不含密码、KV id 或设备明细，可安全公开。
    if (path === "/admin/api/health" && method === "GET") return handleAdminHealth(env);

    if (path.startsWith("/admin/api/")) {
      if (!(await isAuthed(request, env))) return json({ ok: false, error: "unauthorized" }, 401);
      if (path === "/admin/api/devices" && method === "GET") return handleAdminDevices(env);
      if (path === "/admin/api/config" && method === "GET") return handleAdminConfigGet(env);
      if (path === "/admin/api/config" && method === "POST") return handleAdminConfigPost(request, env);
      for (const action of ["ban", "unban", "delete", "note"]) {
        if (path === "/admin/api/" + action && method === "POST") {
          return handleAdminAction(action, request, env);
        }
      }
      return json({ ok: false, error: "not_found" }, 404);
    }

    return new Response("Orange Cloud OAuth callback worker", {
      status: path === "/" ? 200 : 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
