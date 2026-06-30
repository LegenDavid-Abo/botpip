
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";

export default function AdminBilling() {
  const { get, patch } = useApi();
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { get("/api/admin/settings").then(setSettings).catch(()=>{}); }, []);
  function set(k,v) { setSettings(s=>({...s,[k]:v})); }
  async function save() { await patch("/api/admin/settings", settings); setSaved(true); setTimeout(()=>setSaved(false),2000); }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Billing & trials</h1>
        <button className="btn btn-primary btn-sm" onClick={save}>{saved?"Saved ✓":"Save settings"}</button>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-clock" />Trial settings — you control this</div>
        <div className="row"><div className="row-label"><div className="lbl">Trial duration</div><div className="sub">Change anytime — only affects new signups</div></div>
          <select className="select" style={{width:120}} value={settings.trial_days||14} onChange={e=>set("trial_days",+e.target.value)}>
            <option value={7}>7 days</option><option value={14}>14 days</option><option value={21}>21 days</option><option value={30}>30 days</option>
          </select>
        </div>
        <div className="row"><div className="row-label"><div className="lbl">Require card on signup</div></div><Toggle value={settings.trial_require_card} onChange={v=>set("trial_require_card",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Auto-charge when trial ends</div></div><Toggle value={settings.trial_auto_charge} onChange={v=>set("trial_auto_charge",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Expiry warning email</div></div>
          <select className="select" style={{width:140}} value={settings.trial_expiry_warning_days||3} onChange={e=>set("trial_expiry_warning_days",+e.target.value)}>
            <option value={1}>1 day before</option><option value={3}>3 days before</option><option value={7}>7 days before</option>
          </select>
        </div>
        <div className="row"><div className="row-label"><div className="lbl">Grace period after non-payment</div></div>
          <select className="select" style={{width:120}} value={settings.grace_period_days||3} onChange={e=>set("grace_period_days",+e.target.value)}>
            <option value={0}>0 days</option><option value={3}>3 days</option><option value={7}>7 days</option>
          </select>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-credit-card" />Payment gateway</div>
        <div className="row"><span>Flutterwave</span><span className="badge badge-green">Connected</span></div>
        <div className="row"><div className="row-label"><div className="lbl">Currency</div></div>
          <select className="select" style={{width:100}} value={settings.currency||"USD"} onChange={e=>set("currency",e.target.value)}>
            <option>USD</option><option>EUR</option><option>GBP</option>
          </select>
        </div>
      </div>
    </div>
  );
}
