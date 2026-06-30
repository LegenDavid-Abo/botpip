
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function Conversations() {
  const { get } = useApi();
  const [convos, setConvos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => { get("/api/conversations"+(filter?`?status=${filter}`:"")).then(setConvos).catch(()=>{}); }, [filter]);

  async function openConvo(c) { setSelected(c); const m = await get("/api/conversations/"+c.id+"/messages"); setMessages(m||[]); }

  const statusColor = s => s==="resolved"?"green":s==="escalated"?"amber":"blue";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Conversations</h1>
        <select className="select" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="">All</option><option value="open">Open</option><option value="resolved">Resolved</option><option value="escalated">Escalated</option>
        </select>
      </div>

      {convos.length === 0
        ? <EmptyState icon="ti-messages" title="No conversations yet" description="Conversations appear here in real time as users message your bot." />
        : (
        <div style={{display:"flex",gap:14}}>
          <div className="card" style={{flex:1,padding:0,maxHeight:560,overflow:"auto"}}>
            {convos.map(c => (
              <div key={c.id} onClick={()=>openConvo(c)} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:selected?.id===c.id?"var(--pl)":"transparent"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"var(--pl)",color:"var(--pd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,flexShrink:0}}>
                  {(c.platform_user_name||"?").substring(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500}}>{c.platform_user_name||"Anonymous"}</div>
                  <div style={{fontSize:11,color:"var(--text2)",textTransform:"capitalize"}}>{c.platform}</div>
                </div>
                <Badge color={statusColor(c.status)}>{c.status}</Badge>
              </div>
            ))}
          </div>
          {selected && (
            <div className="card" style={{flex:1.4,maxHeight:560,overflow:"auto"}}>
              <div className="card-title"><i className="ti ti-message" />{selected.platform_user_name} — {selected.platform}</div>
              {messages.map(m => (
                <div key={m.id} className={"chat-msg "+(m.role==="user"?"user":"")}>
                  <div className={"chat-avatar "+(m.role==="user"?"user":"bot")}>{m.role==="user"?"U":"B"}</div>
                  <div className={"chat-bubble "+(m.role==="user"?"user":"bot")}>{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
