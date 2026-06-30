
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";

export default function ResponseFlow() {
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
        <h1 className="page-title">Response flow</h1>
        <button className="btn btn-primary btn-sm" onClick={save}>{saved?"Saved ✓":"Save settings"}</button>
      </div>

      <div className="card">
        <div className="card-title"><i className="ti ti-route" />Bot mode</div>
        <div className="row"><div className="row-label"><div className="lbl">Full AI</div><div className="sub">Bot handles everything automatically</div></div><Toggle value={settings.bot_mode==="ai"} onChange={()=>set("bot_mode","ai")} /></div>
        <div className="row"><div className="row-label"><div className="lbl">AI + human hybrid</div><div className="sub">AI drafts, human reviews and sends</div></div><Toggle value={settings.bot_mode==="hybrid"} onChange={()=>set("bot_mode","hybrid")} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Human only (bot paused)</div></div><Toggle value={settings.bot_mode==="human"} onChange={()=>set("bot_mode","human")} /></div>
      </div>

      <div className="card">
        <div className="card-title"><i className="ti ti-git-branch" />Smart flow</div>
        <div className="row"><div className="row-label"><div className="lbl">Ask "Evaluation or Master?" before lot sizes</div></div><Toggle value={settings.ask_account_type_first} onChange={v=>set("ask_account_type_first",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Offer calculator after lot size answer</div></div><Toggle value={settings.offer_calculator} onChange={v=>set("offer_calculator",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Stamp ✅ on resolved Discord messages</div></div><Toggle value={settings.stamp_resolved} onChange={v=>set("stamp_resolved",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Auto-create thread for long conversations</div></div><Toggle value={settings.auto_thread_long_convos} onChange={v=>set("auto_thread_long_convos",v)} /></div>
      </div>
    </div>
  );
}
