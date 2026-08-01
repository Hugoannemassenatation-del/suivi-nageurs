import React from "react";

export default function AppStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
      :root{
        --pool-deep:#0B2A63; --pool-mid:#1E52C8; --lane-blue:#3B7DDD;
        --chrono:#D1272B; --foam:#F3F6FB; --panel:#FFFFFF; --ink:#0B1E3D;
        --ink-soft:#55647A; --line-faint:#DCE3F0; --radius:10px;
      }
      *{box-sizing:border-box;}
      body{margin:0;}
      h2,h3,h4{font-family:'Space Grotesk',sans-serif;}
      .app{ display:flex; min-height:100vh; background:var(--foam); color:var(--ink); font-family:'Inter',sans-serif; font-size:14px; }
      .brand-title{ font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:700; letter-spacing:0.04em; }

      /* login */
      .login-screen{ flex:1; display:flex; align-items:center; justify-content:center; padding:24px;
        background: radial-gradient(circle at 20% 15%, #1B3F8F 0%, var(--pool-deep) 55%, #061640 100%); }
      .login-card{ background:#fff; border-radius:16px; padding:28px 26px; width:100%; max-width:380px; box-shadow:0 20px 50px rgba(5,25,32,0.35); }
      .login-brand{ color:var(--chrono); margin-bottom:18px; }
      .login-intro{ font-size:13px; font-weight:600; color:var(--ink-soft); margin:0 0 12px; text-transform:uppercase; letter-spacing:0.04em; }
      .login-hint{ font-size:12px; color:var(--ink-soft); line-height:1.5; }
      .login-error{ color:var(--chrono); font-size:12.5px; margin:8px 0; }
      .login-sent{ font-size:13.5px; line-height:1.6; }

      /* nav */
      .lanenav{ width:230px; flex-shrink:0; background:var(--pool-deep); color:#fff; padding:20px 14px; display:flex; flex-direction:column; gap:18px; }
      .lanenav-brand{ display:flex; align-items:center; gap:10px; padding:0 6px; color:#fff; }
      .brand-logo{ width:34px; height:34px; object-fit:contain; border-radius:6px; background:#fff; padding:3px; }
      .login-logo{ width:56px; height:56px; object-fit:contain; margin-bottom:8px; }
      .brand-sub{ font-size:11px; color:#9FC2CC; }
      .user-badge{ display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px; margin:0 6px; }
      .user-badge-name{ flex:1; font-size:12.5px; font-weight:600; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .user-badge-role{ font-size:10px; color:#fff; opacity:0.75; text-transform:uppercase; letter-spacing:0.04em; }
      .logout-btn{ background:none; border:none; color:#9FC2CC; cursor:pointer; padding:4px; flex-shrink:0; }
      .logout-btn:hover{ color:#fff; }
      .lanes{ display:flex; flex-direction:column; gap:3px; }
      .lane{ display:flex; align-items:center; gap:10px; padding:10px 10px; border-radius:8px; background:transparent; border:none;
        color:#BFD9DE; cursor:pointer; text-align:left; position:relative; font-family:'Inter',sans-serif; font-size:13px; font-weight:500; }
      .lane:hover{ background:rgba(255,255,255,0.06); color:#fff; }
      .lane-active{ background:var(--pool-mid); color:#fff; }
      .lane-num{ font-family:'IBM Plex Mono',monospace; font-size:10px; color:#fff; width:16px; }
      .lane-label{ flex:1; }
      .lane-count{ font-family:'IBM Plex Mono',monospace; font-size:11px; background:rgba(255,255,255,0.12); padding:1px 6px; border-radius:20px; }

      /* layout */
      .view{ flex:1; padding:32px 40px; max-width:1100px; overflow-y:auto; }
      .view-head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:22px; }
      .eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--pool-mid); margin-bottom:4px; }
      .view h2{ font-size:24px; margin:0; }
      .stat-row{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
      .stat-tile{ background:var(--panel); border:1px solid var(--line-faint); border-radius:var(--radius); padding:16px 18px; }
      .stat-label{ font-size:11px; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; }
      .stat-value{ font-family:'IBM Plex Mono',monospace; font-size:26px; font-weight:600; }
      .stat-unit{ font-size:13px; color:var(--ink-soft); margin-left:3px; }
      .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      .panel{ background:var(--panel); border:1px solid var(--line-faint); border-radius:var(--radius); padding:18px; margin-bottom:16px; }
      .panel.note{ display:flex; align-items:flex-start; gap:8px; background:#EAF1FB; border-color:#C7D9F5; color:var(--pool-deep); font-size:12.5px; }
      .panel.note a{ color:var(--pool-deep); }
      .panel-head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
      .panel-head h4{ margin:0; font-size:14px; }
      .link-btn{ background:none; border:none; color:var(--pool-mid); font-size:12px; cursor:pointer; font-weight:600; }

      label{ display:block; font-size:11.5px; font-weight:600; color:var(--ink-soft); margin:10px 0 4px; text-transform:uppercase; letter-spacing:0.03em; }
      input, select, textarea{ width:100%; border:1px solid var(--line-faint); border-radius:7px; padding:8px 10px; font-size:13.5px; font-family:'Inter',sans-serif; background:#fff; color:var(--ink); }
      textarea{ resize:vertical; font-family:'IBM Plex Mono',monospace; font-size:12.5px; }
      .form-grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .form-row{ display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
      .form-row input, .form-row select{ flex:1; min-width:140px; }

      .btn-primary{ display:inline-flex; align-items:center; gap:6px; background:var(--chrono); color:#fff; border:none; padding:9px 16px; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer; }
      .btn-primary:hover{ background:#b41f22; }
      .btn-primary.full{ width:100%; justify-content:center; margin-top:16px; }
      .btn-secondary{ background:var(--foam); border:1px solid var(--line-faint); color:var(--ink); padding:7px 12px; border-radius:7px; font-size:12.5px; font-weight:600; cursor:pointer; }
      .btn-secondary.full{ width:100%; justify-content:center; }
      .icon-btn{ background:none; border:none; color:var(--ink-soft); cursor:pointer; padding:5px; border-radius:6px; }
      .icon-btn:hover{ background:var(--foam); color:var(--chrono); }

      .pill{ background:var(--pool-mid); color:#fff; font-size:10.5px; font-weight:600; padding:2px 8px; border-radius:20px; }
      .pill-alt{ background:var(--lane-blue); }
      .pill-ghost{ background:var(--foam); color:var(--ink-soft); border:1px solid var(--line-faint); }

      .table{ border:1px solid var(--line-faint); border-radius:var(--radius); overflow:hidden; background:var(--panel); }
      .table-row{ display:grid; grid-template-columns:2fr 1.2fr 1.2fr 1.2fr 1fr 40px; align-items:center; padding:10px 16px; border-bottom:1px solid var(--line-faint); font-size:13px; }
      .table-row.allure-row{ grid-template-columns:1fr 1.4fr 1.4fr 1.4fr; }
      .table-row.rpe-scale-row{ grid-template-columns:70px 1fr; }
      .table-row.forme-row{ grid-template-columns:100px 80px 1fr 40px; }
      .table-row.fiche-attend-row{ grid-template-columns:1fr 1.6fr 1fr 0.8fr; }
      .table-row.fiche-perf-row{ grid-template-columns:1.2fr 1fr 1fr 1fr; }
      .table-row.stats-row{ grid-template-columns:1.6fr 1fr 1fr 1fr; }
      .table-row.perf-row{ grid-template-columns:1.3fr 1fr 1fr 1fr 0.8fr 70px; }
      .table-row.splits-row{ grid-template-columns:1fr 1fr 1.2fr 1.2fr 40px; }
      .table-row:last-child{ border-bottom:none; }
      .table-head{ background:var(--foam); font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-soft); font-weight:600; }
      .strong{ font-weight:600; }
      .chrono-best{ font-family:'IBM Plex Mono',monospace; color:var(--chrono); font-weight:600; }
      .vma-summary{ font-size:13px; color:var(--ink-soft); margin-top:6px; }
      .rpe-intro{ font-size:13px; color:var(--ink-soft); line-height:1.55; margin:0 0 12px; }
      .table-actions{ display:flex; align-items:center; gap:6px; }
      .row-line{ font-size:13px; padding:6px 0; border-bottom:1px solid var(--line-faint); }
      .row-line:last-child{ border-bottom:none; }

      .session-list{ display:flex; flex-direction:column; gap:10px; }
      .session-item{ background:var(--panel); border:1px solid var(--line-faint); border-radius:var(--radius); padding:16px 18px; display:flex; justify-content:space-between; gap:16px; }
      .session-item-actions{ display:flex; flex-direction:column; gap:8px; align-items:flex-end; }
      .session-card-top{ display:flex; align-items:center; gap:8px; margin-bottom:6px; }
      .session-date{ font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--ink-soft); }
      .session-title{ font-weight:600; font-size:15px; margin-bottom:4px; }
      .session-content{ white-space:pre-wrap; font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--ink-soft); background:var(--foam); padding:8px 10px; border-radius:7px; margin-bottom:8px; }
      .session-photo{ max-width:280px; border-radius:8px; display:block; margin-bottom:8px; border:1px solid var(--line-faint); }
      .session-meta{ display:flex; gap:6px; font-size:12px; color:var(--ink-soft); }
      .session-vol{ font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--ink-soft); margin-top:4px; }

      .session-picker{ margin-bottom:14px; max-width:420px; }
      .presence-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:10px; }
      .presence-tile{ border-radius:9px; border:1.5px solid var(--line-faint); background:var(--panel); overflow:hidden; }
      .presence-tile.present{ border-color:var(--pool-mid); background:#EAF1FB; }
      .presence-main{ display:flex; align-items:center; gap:10px; padding:12px 14px; background:none; border:none; cursor:pointer; text-align:left; width:100%; }
      .presence-check{ width:20px; height:20px; border-radius:5px; border:1.5px solid var(--line-faint); display:flex; align-items:center; justify-content:center; font-size:13px; color:var(--pool-mid); font-weight:700; flex-shrink:0; }
      .presence-tile.present .presence-check{ border-color:var(--pool-mid); background:var(--pool-mid); color:#fff; }
      .presence-name{ flex:1; font-weight:500; }
      .rpe-row{ display:flex; align-items:center; gap:8px; padding:0 14px 12px; }
      .rpe-label{ font-size:10.5px; font-weight:700; color:var(--ink-soft); text-transform:uppercase; }
      .rpe-row select{ padding:5px 8px; font-size:12px; }

      .forme-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:0 12px; margin-top:4px; }
      .forme-today-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; }
      .forme-today-tile{ border:1.5px solid var(--line-faint); border-radius:9px; padding:10px 12px; display:flex; flex-direction:column; gap:4px; background:#fff; cursor:default; text-align:left; font-family:'Inter',sans-serif; }
      .forme-today-clickable{ cursor:pointer; }
      .forme-today-name{ font-size:12.5px; font-weight:600; }
      .forme-today-score{ font-family:'IBM Plex Mono',monospace; font-size:15px; font-weight:700; }
      .forme-pending{ color:var(--ink-soft); font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.03em; }
      .forme-detail{ font-size:12px; color:var(--ink-soft); }
      .forme-note-dot{ color:var(--chrono); font-size:9px; margin-left:5px; }

      .feed{ display:flex; flex-direction:column; gap:10px; }
      .feed-item{ background:var(--panel); border:1px solid var(--line-faint); border-radius:var(--radius); padding:14px 16px; }
      .feed-top{ display:flex; align-items:center; gap:10px; margin-bottom:6px; }
      .feed-del{ margin-left:auto; }
      .msg-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
      .msg-list li{ display:flex; gap:10px; font-size:13px; }
      .msg-date{ font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--ink-soft); flex-shrink:0; }

      .empty{ display:flex; align-items:center; gap:8px; color:var(--ink-soft); font-size:13px; background:var(--panel); border:1px dashed var(--line-faint); border-radius:var(--radius); padding:16px; }

      .modal-backdrop{ position:fixed; inset:0; background:rgba(10,31,38,0.45); display:flex; align-items:center; justify-content:center; z-index:50; padding:20px; }
      .modal{ background:#fff; border-radius:12px; width:100%; max-width:440px; max-height:88vh; overflow-y:auto; padding:20px 22px 22px; }
      .modal.fiche-modal{ max-width:640px; }
      .modal-head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
      .modal-head h3{ margin:0; font-size:16px; }
      .fiche-sub{ display:flex; align-items:center; gap:8px; margin-top:4px; }
      .fiche-body{ max-height:70vh; }
      .fiche-section-title{ font-size:13px; margin:18px 0 8px; color:var(--pool-deep); }
      .fiche-note{ color:var(--chrono); font-style:italic; }

      @media (max-width: 820px){
        .app{ flex-direction:column; }
        .lanenav{ width:100%; flex-direction:column; padding:12px 16px; gap:10px; }
        .lanes{ flex-direction:row; overflow-x:auto; }
        .lane-label{ display:none; }
        .view{ padding:20px; }
        .stat-row{ grid-template-columns:repeat(2,1fr); }
        .grid-2{ grid-template-columns:1fr; }
      }
    `}</style>
  );
}
