
import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const nav = [
  { section:"Overview" },
  { to:"/admin", label:"Dashboard", icon:"ti-layout-dashboard", end:true },
  { to:"/admin/firms", label:"All firms", icon:"ti-building" },
  { to:"/admin/inbox", label:"Firm messages", icon:"ti-inbox", badge:"red" },
  { to:"/admin/onboarding", label:"My setup checklist", icon:"ti-checklist" },
  { section:"Monetisation" },
  { to:"/admin/plans", label:"Plans & pricing", icon:"ti-credit-card" },
  { to:"/admin/coupons", label:"Coupons & discounts", icon:"ti-tag" },
  { to:"/admin/billing", label:"Billing & trials", icon:"ti-receipt" },
  { to:"/admin/referral", label:"Referral & affiliates", icon:"ti-gift" },
  { to:"/admin/forecast", label:"Revenue forecast", icon:"ti-trending-up" },
  { to:"/admin/roi", label:"ROI calculator", icon:"ti-calculator" },
  { section:"Comms" },
  { to:"/admin/broadcast", label:"Send message", icon:"ti-broadcast" },
  { to:"/admin/emails", label:"Email templates", icon:"ti-mail" },
  { to:"/admin/changelog", label:"Changelog", icon:"ti-notes" },
  { section:"Platform" },
  { to:"/admin/uptime", label:"Uptime monitor", icon:"ti-activity" },
  { to:"/admin/usage", label:"API usage & costs", icon:"ti-chart-dots" },
  { to:"/admin/branding", label:"White-label branding", icon:"ti-brush" },
  { to:"/admin/apis", label:"APIs needed", icon:"ti-api" },
  { to:"/admin/settings", label:"Settings", icon:"ti-adjustments" },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-logo"><i className="ti ti-robot" /><span>Bot<span className="accent">Pip</span></span></div>
        <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"var(--pl)",color:"var(--pt)",fontWeight:500}}>Super admin</span>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={()=>{logout();navigate("/admin/login")}}><i className="ti ti-logout" />Logout</button>
        </div>
      </div>
      <div className="app-body">
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">BotPip HQ</div>
            <div className="sidebar-sub">Platform owner</div>
          </div>
          {nav.map((item,i) =>
            item.section
              ? <div key={i} className="nav-section">{item.section}</div>
              : <NavLink key={item.to} to={item.to} end={item.end} className={({isActive})=>"nav-item"+(isActive?" active":"")}>
                  <i className={"ti "+item.icon} />
                  {item.label}
                  {item.badge && <span className={"nav-badge nb-"+item.badge}>!</span>}
                </NavLink>
          )}
        </nav>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
