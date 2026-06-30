
import React from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PaywallGate from "./PaywallGate.jsx";

const nav = [
  { section:"Setup" },
  { to:"/dashboard", label:"Dashboard", icon:"ti-layout-dashboard", end:true },
  { to:"/dashboard/knowledge", label:"Knowledge base", icon:"ti-brain" },
  { to:"/dashboard/integrations", label:"Integrations", icon:"ti-plug" },
  { to:"/dashboard/channels", label:"Channel selector", icon:"ti-brand-discord" },
  { to:"/dashboard/widget", label:"Widget preview", icon:"ti-device-desktop" },
  { section:"Intelligence" },
  { to:"/dashboard/ai", label:"AI behaviour", icon:"ti-brain" },
  { to:"/dashboard/flow", label:"Response flow", icon:"ti-route" },
  { to:"/dashboard/style", label:"Style & emoji", icon:"ti-palette" },
  { to:"/dashboard/calculator", label:"Lot calculator", icon:"ti-calculator" },
  { to:"/dashboard/templates", label:"Reply templates", icon:"ti-template" },
  { section:"Operations" },
  { to:"/dashboard/escalations", label:"Escalation inbox", icon:"ti-headset" },
  { to:"/dashboard/faq", label:"Auto FAQ", icon:"ti-sparkles" },
  { section:"Comms" },
  { to:"/dashboard/send", label:"Send message", icon:"ti-send" },
  { to:"/dashboard/scheduled", label:"Scheduled", icon:"ti-calendar" },
  { to:"/dashboard/contact", label:"Contact support", icon:"ti-mail-forward" },
  { section:"Data" },
  { to:"/dashboard/analytics", label:"Analytics", icon:"ti-chart-bar" },
  { to:"/dashboard/conversations", label:"Conversations", icon:"ti-messages" },
  { to:"/dashboard/export", label:"Export data", icon:"ti-download" },
  { to:"/dashboard/notifications", label:"Notifications", icon:"ti-bell" },
  { section:"Account" },
  { to:"/dashboard/subscription", label:"My subscription", icon:"ti-credit-card" },
  { to:"/playground", label:"Playground", icon:"ti-flask" },
];

// Routes that don't need payment
const FREE_ROUTES = ["/dashboard","/dashboard/subscription","/dashboard/contact"];

export default function FirmLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isPaid = user && ["starter","pro","enterprise"].includes(user?.plan) && user?.status === "active";
  const isTrial = user?.plan === "trial";
  const daysLeft = user?.trial_ends_at ? Math.max(0,Math.ceil((new Date(user.trial_ends_at)-Date.now())/86400000)) : 0;

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-logo"><i className="ti ti-robot" /><span>Bot<span className="accent">Pip</span></span></div>
        {/* Trial banner */}
        {isTrial && (
          <div style={{display:"flex",alignItems:"center",gap:8,background: daysLeft<=3?"var(--rl)":"var(--al)",color:daysLeft<=3?"var(--rt)":"var(--at)",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:500,cursor:"pointer"}} onClick={()=>navigate("/dashboard/subscription")}>
            <i className="ti ti-clock" />
            {daysLeft > 0 ? `Trial: ${daysLeft} day${daysLeft!==1?"s":""} left — upgrade` : "Trial expired — upgrade now"}
          </div>
        )}
        {isPaid && <span className="badge badge-green" style={{fontSize:11}}>{user.plan} plan</span>}
        <div className="topbar-right">
          <span style={{fontSize:11,background:"var(--bg3)",color:"var(--text2)",padding:"2px 8px",borderRadius:4,fontWeight:500}}>{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}><i className="ti ti-logout" />Logout</button>
        </div>
      </div>
      <div className="app-body">
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">{user?.name || "Your firm"}</div>
            <div className="sidebar-sub">{isTrial ? `Trial · ${daysLeft}d left` : user?.plan || ""}</div>
          </div>
          {nav.map((item,i) =>
            item.section
              ? <div key={i} className="nav-section">{item.section}</div>
              : (
                <NavLink key={item.to} to={item.to} end={item.end}
                  className={({isActive})=>"nav-item"+(isActive?" active":"")+((!isPaid&&!FREE_ROUTES.includes(item.to))?" locked-nav":"")}>
                  <i className={"ti "+item.icon} />
                  {item.label}
                  {!isPaid && !FREE_ROUTES.includes(item.to) && <i className="ti ti-lock" style={{marginLeft:"auto",fontSize:11,color:"var(--text3)"}} />}
                </NavLink>
              )
          )}
        </nav>
        <main className="main-content">
          <PaywallGate path={location.pathname}>
            <Outlet />
          </PaywallGate>
        </main>
      </div>
    </div>
  );
}
