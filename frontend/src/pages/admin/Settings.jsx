
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";

export default function AdminSettings() {
  const { get, patch } = useApi();
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { get("/api/admin/settings").then(setSettings).catch(()=>{}); }, []);
  function set(k,v) { setSettings(s=>({...s,[k]:v})); }
  async function save() { await patch("/api/admin/settings", settings); setSaved(true); setTimeout(()=>setSaved(false),2000); }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform settings</h1>
        <button className="btn btn-primary btn-sm" onClick={save}>{saved?"Saved ✓":"Save settings"}</button>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-adjustments" />Global controls</div>
        <div className="row"><div className="row-label"><div className="lbl">Maintenance mode</div><div className="sub">Takes entire platform offline</div></div><Toggle value={settings.maintenance_mode} onChange={v=>set("maintenance_mode",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">New signups open</div></div><Toggle value={settings.signups_open} onChange={v=>set("signups_open",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Auto health alerts to firms</div></div><Toggle value={settings.weekly_digest_email} onChange={v=>set("weekly_digest_email",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">WhatsApp alerts when firms message me</div></div><Toggle value={settings.whatsapp_alerts} onChange={v=>set("whatsapp_alerts",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">AI model</div></div>
          <select className="select" style={{width:180}} value={settings.ai_model||"claude-sonnet-4-6"} onChange={e=>set("ai_model",e.target.value)}>
            <option value="claude-sonnet-4-6">claude-sonnet-4-6</option><option value="claude-opus-4-6">claude-opus-4-6</option>
          </select>
        </div>
      </div>
    </div>
  );
}
