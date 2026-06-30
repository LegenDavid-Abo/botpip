
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function ChannelSelector() {
  const { get, patch, post } = useApi();
  const [channels, setChannels] = useState([]);
  const [msg, setMsg] = useState("");
  const [target, setTarget] = useState("");
  const [customCh, setCustomCh] = useState("");
  const [text, setText] = useState("");

  useEffect(() => { get("/api/channels/discord").then(setChannels).catch(()=>{}); }, []);

  async function toggleMonitor(channelId, val) {
    await patch(`/api/channels/discord/${channelId}/monitor`, { monitored: val });
    setChannels(cs => cs.map(c => c.channel_id===channelId ? {...c, monitored: val} : c));
  }

  async function sendAnnouncement() {
    const finalTarget = customCh.trim() ? customCh.trim().replace("#","") : target;
    if (!finalTarget || !text.trim()) return;
    await post("/api/broadcast", { platform: "discord", target: finalTarget.startsWith("#")?finalTarget:"#"+finalTarget, message: text });
    setMsg("Sent to Discord!"); setText(""); setCustomCh("");
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Channel selector</h1></div>

      <div className="card">
        <div className="card-title"><i className="ti ti-brand-discord" />Discord channels — toggle to monitor</div>
        <div style={{fontSize:11,color:"var(--text2)",marginBottom:10}}>All channels auto-detected from your connected server. Toggle on/off which ones the bot listens to.</div>
        {channels.length === 0
          ? <EmptyState icon="ti-hash" title="No channels yet" description="Connect Discord first in Integrations — channels auto-detect within seconds." />
          : channels.map(ch => (
            <div key={ch.channel_id} className="row">
              <Toggle value={ch.monitored} onChange={v=>toggleMonitor(ch.channel_id, v)} />
              <i className="ti ti-hash" style={{fontSize:13,color:"var(--text2)"}} />
              <span style={{flex:1,fontSize:12}}>{ch.channel_name}</span>
              <span className={"badge "+(ch.monitored?"badge-green":"badge-gray")}>{ch.monitored?"Monitoring":"Ignored"}</span>
            </div>
          ))
        }
      </div>

      <div className="card">
        <div className="card-title"><i className="ti ti-send" />Announce to your Discord</div>
        {msg && <div style={{fontSize:12,color:"var(--g)",marginBottom:8}}>{msg}</div>}
        <select className="select" style={{width:"100%",marginBottom:8}} value={target} onChange={e=>setTarget(e.target.value)}>
          <option value="">Select channel...</option>
          {channels.map(ch=><option key={ch.channel_id} value={ch.channel_name}>#{ch.channel_name}</option>)}
        </select>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <i className="ti ti-hash" style={{fontSize:14,color:"var(--text2)"}} />
          <input className="input" placeholder="Or type any channel name e.g. happy, payouts..." value={customCh} onChange={e=>setCustomCh(e.target.value)} />
        </div>
        <textarea className="textarea" rows={3} placeholder="Announcement text..." value={text} onChange={e=>setText(e.target.value)} />
        <button className="btn btn-primary btn-sm" style={{marginTop:8}} onClick={sendAnnouncement}><i className="ti ti-send" />Send to Discord</button>
      </div>
    </div>
  );
}
