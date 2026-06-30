
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function EscalationInbox() {
  const { get, patch } = useApi();
  const [escalations, setEscalations] = useState([]);

  useEffect(() => { load(); }, []);
  async function load() { const d = await get("/api/escalations"); setEscalations(d||[]); }
  async function resolve(id) { await patch("/api/escalations/"+id+"/resolve", { resolved_by:"agent" }); load(); }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Escalation inbox</h1></div>
      {escalations.length === 0
        ? <EmptyState icon="ti-headset" title="No escalations" description="Conversations the bot couldn't handle confidently will appear here." />
        : (
        <div className="card">
          <div className="card-title"><i className="ti ti-headset" />Conversations needing a human</div>
          {escalations.map(e => (
            <div key={e.id} className="row" style={{alignItems:"flex-start"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"var(--pl)",color:"var(--pd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,flexShrink:0}}>
                {(e.conversations?.platform_user_name||"?").substring(0,2).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div className="lbl">{e.conversations?.platform_user_name || "Unknown"} <Badge color={e.confidence_at_escalation<40?"red":"amber"}>{e.confidence_at_escalation<40?"Low confidence":"Escalated"}</Badge></div>
                <div className="sub">{e.reason} — confidence {e.confidence_at_escalation}%</div>
                <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{e.conversations?.platform} · {new Date(e.created_at).toLocaleString()}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={()=>resolve(e.id)}>Mark resolved</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
