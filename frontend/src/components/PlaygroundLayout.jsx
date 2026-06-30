
import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

const nav = [
  { section:"Testing" },
  { to:"/playground", label:"Live bot test", icon:"ti-message-chatbot", end:true },
  { to:"/playground/multi", label:"Multi-user sim", icon:"ti-users" },
  { to:"/playground/speed", label:"Speed test", icon:"ti-bolt" },
  { to:"/playground/screenshot", label:"Screenshot reader", icon:"ti-screenshot" },
  { to:"/playground/quiz", label:"Quiz mode", icon:"ti-brain" },
  { section:"Quality" },
  { to:"/playground/health", label:"Health score", icon:"ti-heart-rate-monitor" },
  { to:"/playground/interview", label:"AI interviewer", icon:"ti-microphone" },
  { to:"/playground/gaps", label:"Gap finder", icon:"ti-search" },
  { to:"/playground/conflicts", label:"Conflict checker", icon:"ti-alert-triangle" },
];

export default function PlaygroundLayout() {
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-logo"><i className="ti ti-robot" /><span>Bot<span className="accent">Pip</span></span></div>
        <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"var(--al)",color:"var(--at)",fontWeight:500}}>Playground</span>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate("/dashboard")}><i className="ti ti-arrow-left" />Back to dashboard</button>
        </div>
      </div>
      <div className="app-body">
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Playground</div>
            <div className="sidebar-sub">Test before going live</div>
          </div>
          {nav.map((item,i) =>
            item.section
              ? <div key={i} className="nav-section">{item.section}</div>
              : <NavLink key={item.to} to={item.to} end={item.end} className={({isActive})=>"nav-item"+(isActive?" active":"")}>
                  <i className={"ti "+item.icon} />{item.label}
                </NavLink>
          )}
        </nav>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
