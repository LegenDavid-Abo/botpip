
import React, { useState } from "react";
import { useApi } from "../../hooks/useApi.js";

const PLATFORMS = [
  {id:"email",label:"Email",icon:"ti-mail"},
  {id:"discord",label:"Discord",icon:"ti-brand-discord"},
  {id:"dashboard",label:"Dashboard banner",icon:"ti-layout-dashboard"},
];

export default function AdminBroadcast() {
  const { post } = useApi();
  const [platforms, setPlatforms] = useState(["email"]);
  const [message, setMessage] = useState("");
  const [targetPlan, setTargetPlan] = useState("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  function togglePlat(id) { setPlatforms(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]); }

  async function send() {
    if (!message.trim() || platforms.length===0) return;
    setSending(true); setResult("");
    try {
      const r = await post("/api/admin/broadcast", { platforms, message, targetPlan });
      setResult(`✓ Sent to ${r.sent}/${r.total} channels across ${r.firms} firms`);
    } catch(err) { setResult("Error: "+err.message); }
    finally { setSending(false); }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Send message</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-send" />Broadcast to firms</div>
        <div className="plat-selector">
          {PLATFORMS.map(p => <div key={p.id} className={"plat-chip"+(platforms.includes(p.id)?" on":"")} onClick={()=>togglePlat(p.id)}><i className={"ti "+p.icon} />{p.label}</div>)}
        </div>
        <select className="select" style={{width:200,marginBottom:10}} value={targetPlan} onChange={e=>setTargetPlan(e.target.value)}>
          <option value="all">All firms</option><option value="pro">Pro only</option><option value="enterprise">Enterprise only</option><option value="trial">Trial firms only</option>
        </select>
        <textarea className="textarea" rows={4} placeholder="Type your message to all firms..." value={message} onChange={e=>setMessage(e.target.value)} />
        {result && <div style={{fontSize:12,marginTop:8,color:result.startsWith("✓")?"var(--g)":"var(--r)"}}>{result}</div>}
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button className="btn btn-primary" onClick={send} disabled={sending}>{sending?"Sending...":"Send now"}</button>
          <button className="btn btn-outline">Schedule</button>
        </div>
      </div>
    </div>
  );
}
