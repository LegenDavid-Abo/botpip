
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";

export default function AIBehaviour() {
  const { user, refreshUser } = useAuth();
  const { patch } = useApi();
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (user) setSettings(user); }, [user]);

  function set(key, val) { setSettings(s=>({...s,[key]:val})); }

  async function save() {
    await patch("/api/firm/settings", settings);
    refreshUser();
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI behaviour</h1>
        <button className="btn btn-primary btn-sm" onClick={save}>{saved?"Saved ✓":"Save settings"}</button>
      </div>

      <div className="card">
        <div className="card-title"><i className="ti ti-brain" />Confidence & accuracy</div>
        <div className="row">
          <div className="row-label"><div className="lbl">Confidence threshold</div></div>
          <div className="slider-row" style={{width:160}}>
            <input type="range" min={50} max={95} step={5} value={settings.confidence_threshold||75} onChange={e=>set("confidence_threshold",+e.target.value)} />
            <span className="slider-value">{settings.confidence_threshold||75}%</span>
          </div>
        </div>
        <div className="row"><div className="row-label"><div className="lbl">Escalate to human below threshold</div><div className="sub">Bot says "Let me get a human for this" when unsure</div></div><Toggle value={settings.human_handoff} onChange={v=>set("human_handoff",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Only answer from uploaded docs</div><div className="sub">Never guesses or uses outside information</div></div><Toggle value={settings.only_from_docs} onChange={v=>set("only_from_docs",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Share doc link when relevant</div><div className="sub">Bot includes source link only when it directly helps</div></div><Toggle value={settings.share_links_when_relevant} onChange={v=>set("share_links_when_relevant",v)} /></div>
      </div>

      <div className="card">
        <div className="card-title"><i className="ti ti-settings" />Advanced</div>
        <div className="row"><div className="row-label"><div className="lbl">MT4/MT5 screenshot reader</div><div className="sub">Bot reads trading terminal screenshots</div></div><Toggle value={settings.mt4_screenshot_reader} onChange={v=>set("mt4_screenshot_reader",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Voice message support</div><div className="sub">Transcribes voice and replies in text</div></div><Toggle value={settings.voice_messages} onChange={v=>set("voice_messages",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Reply threading</div><div className="sub">Every reply points to the exact message</div></div><Toggle value={settings.reply_threading} onChange={v=>set("reply_threading",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Personalise by name</div></div><Toggle value={settings.personalise_names} onChange={v=>set("personalise_names",v)} /></div>
        <div className="row">
          <div className="row-label"><div className="lbl">Typing delay (human feel)</div></div>
          <div className="slider-row" style={{width:160}}>
            <input type="range" min={0} max={4} step={0.5} value={(settings.typing_delay_ms||1500)/1000} onChange={e=>set("typing_delay_ms",Math.round(+e.target.value*1000))} />
            <span className="slider-value">{((settings.typing_delay_ms||1500)/1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
