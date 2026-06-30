
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useApi } from "../../hooks/useApi.js";

export default function Subscription() {
  const { user, refreshUser } = useAuth();
  const { post } = useApi();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function upgrade(plan) {
    setLoading(true); setMsg("");
    try {
      const { url } = await post("/api/payments/checkout", { plan });
      window.location.href = url;
    } catch(err) { setMsg(err.message); setLoading(false); }
  }

  async function cancelPlan() {
    if (!confirm("Cancel your subscription? Your bot will pause until you choose a new plan.")) return;
    setLoading(true); setMsg("");
    try {
      await post("/api/payments/cancel", {});
      setMsg("✓ Subscription cancelled.");
      refreshUser();
    } catch(err) { setMsg(err.message); }
    finally { setLoading(false); }
  }

  if (!user) return null;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">My subscription</h1></div>

      {msg && <div style={{fontSize:12,padding:"8px 12px",borderRadius:6,background:msg.startsWith("✓")?"var(--gl)":"var(--rl)",color:msg.startsWith("✓")?"var(--gt)":"var(--rt)",marginBottom:12}}>{msg}</div>}

      <div className="card">
        <div className="row"><span style={{color:"var(--text2)"}}>Current plan</span><span className="badge badge-purple">{user.plan} {user.plan!=="trial" && `· $${{starter:99,pro:299,enterprise:999}[user.plan]}/mo`}</span></div>
        {user.plan==="trial" && <div className="row"><span style={{color:"var(--text2)"}}>Trial ends</span><span>{user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : "—"}</span></div>}
        <div className="row"><span style={{color:"var(--text2)"}}>Status</span><span className="badge badge-green">{user.status}</span></div>
      </div>

      {user.plan !== "enterprise" && (
        <div className="card">
          <div className="card-title"><i className="ti ti-arrow-up-right" />Upgrade your plan</div>
          <div style={{fontSize:11,color:"var(--text2)",marginBottom:10}}>Secure checkout via Flutterwave — pay by card, bank transfer, or mobile money, from anywhere in the world.</div>
          {user.plan!=="starter" && user.plan==="trial" && <button className="btn btn-outline btn-full" style={{marginBottom:8}} onClick={()=>upgrade("starter")} disabled={loading}>Upgrade to Starter — $99/mo</button>}
          {user.plan!=="pro" && <button className="btn btn-primary btn-full" style={{marginBottom:8}} onClick={()=>upgrade("pro")} disabled={loading}>Upgrade to Pro — $299/mo</button>}
          <button className="btn btn-outline btn-full" onClick={()=>upgrade("enterprise")} disabled={loading}>Upgrade to Enterprise — $999/mo</button>
        </div>
      )}

      {user.plan !== "trial" && (
        <div className="card">
          <div className="card-title"><i className="ti ti-credit-card" />Manage subscription</div>
          <button className="btn btn-danger btn-full" onClick={cancelPlan} disabled={loading}>Cancel subscription</button>
        </div>
      )}
    </div>
  );
}
