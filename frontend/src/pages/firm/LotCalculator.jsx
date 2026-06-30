
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";

export default function LotCalculator() {
  const { user, refreshUser } = useAuth();
  const { patch } = useApi();
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (user) setSettings(user); }, [user]);
  function set(key, val) { setSettings(s=>({...s,[key]:val})); }
  async function save() { await patch("/api/firm/settings", settings); refreshUser(); setSaved(true); setTimeout(()=>setSaved(false),2000); }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Lot size calculator</h1>
        <button className="btn btn-primary btn-sm" onClick={save}>{saved?"Saved ✓":"Save settings"}</button>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-calculator" />Calculator rules</div>
        <div className="row"><div className="row-label"><div className="lbl">Evaluation — max lots</div></div><input className="input" style={{width:90}} type="number" placeholder="e.g. 5" value={settings.evaluation_max_lots||""} onChange={e=>set("evaluation_max_lots",+e.target.value)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Master — max lots</div></div><input className="input" style={{width:90}} type="number" placeholder="e.g. 10" value={settings.master_max_lots||""} onChange={e=>set("master_max_lots",+e.target.value)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Risk formula</div><div className="sub">Used to calculate custom lot size from balance</div></div><input className="input" style={{width:220,marginLeft:8}} placeholder="balance × 1% ÷ pip_value" value={settings.risk_formula||""} onChange={e=>set("risk_formula",e.target.value)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Ask account type before answering</div></div><Toggle value={settings.ask_account_type_first} onChange={v=>set("ask_account_type_first",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Show inline calculator in chat</div><div className="sub">User types balance → bot calculates instantly</div></div><Toggle value={settings.offer_calculator} onChange={v=>set("offer_calculator",v)} /></div>
      </div>
    </div>
  );
}
