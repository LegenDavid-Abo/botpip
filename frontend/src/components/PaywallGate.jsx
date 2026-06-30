
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Wraps any page. If the firm has not paid (no active plan beyond trial)
 * renders a lock overlay. The page is blurred behind it so the user
 * can see *what* they are missing but cannot interact with it.
 *
 * Trial firms can still use the dashboard (for setup), but every
 * integration, AI config, and comms feature is locked behind payment.
 */
const FREE_ROUTES = [
  "/dashboard",
  "/dashboard/subscription",
  "/dashboard/contact",
];

export default function PaywallGate({ children, path }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Super admins and paid firms: pass straight through
  const isPaid = user && ["starter","pro","enterprise"].includes(user?.plan) && user?.status === "active";
  const isTrialAllowed = FREE_ROUTES.some(r => path === r);

  if (!user || isPaid || isTrialAllowed) return children;

  // Trial or unpaid firm hitting a locked page
  const daysLeft = user.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at) - Date.now()) / 86400000))
    : 0;
  const isExpired = daysLeft === 0;

  return (
    <div style={{position:"relative"}}>
      {/* blurred background */}
      <div style={{filter:"blur(4px)",pointerEvents:"none",userSelect:"none",opacity:.45}}>
        {children}
      </div>

      {/* lock overlay */}
      <div style={{
        position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
        background:"rgba(247,247,248,0.75)",backdropFilter:"blur(2px)",borderRadius:12,zIndex:100
      }}>
        <div style={{
          background:"#fff",border:"1px solid var(--border)",borderRadius:14,padding:"32px 36px",
          textAlign:"center",maxWidth:380,boxShadow:"0 8px 32px rgba(0,0,0,0.12)"
        }}>
          <div style={{fontSize:40,marginBottom:12}}>🔒</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:8,color:"var(--text)"}}>
            {isExpired ? "Trial expired" : `${daysLeft} days left on trial`}
          </div>
          <div style={{fontSize:13,color:"var(--text2)",marginBottom:20,lineHeight:1.6}}>
            {isExpired
              ? "Your free trial has ended. Upgrade to a plan to unlock all features and keep your bot live."
              : "This feature is locked during your trial. Upgrade now to unlock everything — Discord, Telegram, WhatsApp, AI settings, broadcasting, and more."}
          </div>
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={() => navigate("/dashboard/subscription")}
            style={{marginBottom:10}}
          >
            <i className="ti ti-credit-card" /> Upgrade to unlock everything
          </button>
          <div style={{fontSize:11,color:"var(--text3)"}}>
            Starter from $99/mo · 5-min setup · cancel anytime
          </div>
        </div>
      </div>
    </div>
  );
}
