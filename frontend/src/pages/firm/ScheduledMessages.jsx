
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function ScheduledMessages() {
  const { get, post, del } = useApi();
  const [scheduled, setScheduled] = useState([]);
  const [platform, setPlatform] = useState("discord");
  const [target, setTarget] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  useEffect(() => { get("/api/scheduled").then(setScheduled).catch(()=>{}); }, []);

  async function schedule() {
    if (!target || !content || !date) return;
    const send_at = new Date(`${date}T${time}`).toISOString();
    const s = await post("/api/scheduled", { platform, target, content, send_at });
    setScheduled(ss=>[...ss,s]); setTarget(""); setContent(""); setDate("");
  }

  async function cancel(id) { await del("/api/scheduled/"+id); setScheduled(ss=>ss.filter(s=>s.id!==id)); }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Scheduled messages</h1></div>

      {scheduled.length === 0
        ? <EmptyState icon="ti-calendar" title="Nothing scheduled" description="Schedule announcements, reminders, or updates to send automatically." />
        : (
        <div className="card">
          <div className="card-title"><i className="ti ti-calendar" />Upcoming</div>
          {scheduled.map(s => (
            <div key={s.id} className="row">
              <i className={"ti "+(s.platform==="discord"?"ti-brand-discord":"ti-mail")} style={{fontSize:14,color:"var(--p)"}} />
              <div style={{flex:1}}>
                <div className="lbl">{s.target} — {s.content.substring(0,40)}{s.content.length>40?"...":""}</div>
                <div className="sub">{new Date(s.send_at).toLocaleString()}</div>
              </div>
              <span className="badge badge-amber">Pending</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>cancel(s.id)}><i className="ti ti-trash" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title"><i className="ti ti-plus" />Schedule new</div>
        <div className="plat-selector">
          {["discord","email","whatsapp"].map(p => (
            <div key={p} className={"plat-chip"+(platform===p?" on":"")} onClick={()=>setPlatform(p)}><i className={"ti ti-"+(p==="discord"?"brand-discord":p==="email"?"mail":"brand-whatsapp")} />{p}</div>
          ))}
        </div>
        <input className="input" placeholder="Channel or recipient..." value={target} onChange={e=>setTarget(e.target.value)} style={{marginBottom:8}} />
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <input className="input" type="time" value={time} onChange={e=>setTime(e.target.value)} />
        </div>
        <textarea className="textarea" rows={3} placeholder="Message..." value={content} onChange={e=>setContent(e.target.value)} />
        <button className="btn btn-primary btn-sm" style={{marginTop:8}} onClick={schedule}>Schedule</button>
      </div>
    </div>
  );
}
