
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function AdminInbox() {
  const { get, patch } = useApi();
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { load(); }, []);
  async function load() { const d = await get("/api/admin/inbox"); setMessages(d||[]); }

  async function openMsg(m) {
    setSelected(m); setReply(""); setFeedback("");
    if (!m.read) await patch("/api/admin/inbox/"+m.id+"/read", {});
    load();
  }

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true); setFeedback("");
    try {
      const result = await patch("/api/admin/inbox/"+selected.id+"/reply", { reply });
      if (result.emailSent === false) {
        setFeedback("⚠️ Reply saved, but the email failed to send. Check your GMAIL_USER and GMAIL_APP_PASSWORD in the backend .env file, then try again.");
      } else {
        setFeedback("✓ Reply sent successfully to "+selected.firms?.email);
        setReply(""); setTimeout(()=>{setSelected(null);setFeedback("");},2500);
      }
    } catch(err) {
      setFeedback("Error: "+err.message);
    } finally {
      setSending(false); load();
    }
  }

  return (
    <div style={{display:"flex",gap:16}}>
      <div style={{flex:1}}>
        <div className="page-header"><h1 className="page-title">Messages from firms</h1></div>
        {messages.length === 0
          ? <EmptyState icon="ti-inbox" title="No messages" description="Messages firms send you will appear here." />
          : (
          <div className="card" style={{padding:0}}>
            {messages.map(m => (
              <div key={m.id} onClick={()=>openMsg(m)} className="inbox-row" style={{padding:"10px 16px"}}>
                {!m.read && <div className="unread-dot" />}
                {m.read && <div style={{width:7}} />}
                <div className="inbox-av">{(m.firms?.name||"?").substring(0,2).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="inbox-from">{m.firms?.name} <span style={{fontWeight:400,color:"var(--text3)"}}>· {new Date(m.created_at).toLocaleString()}</span></div>
                  <div style={{fontSize:11,fontWeight:500,marginTop:1}}>{m.subject}</div>
                  <div className="inbox-preview">{m.content}</div>
                </div>
                <span className={"badge "+(m.read?"badge-gray":"badge-red")}>{m.read?"Read":"Unread"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected && (
        <div style={{width:360,flexShrink:0}}>
          <div className="card">
            <div className="card-title"><i className="ti ti-mail" />{selected.subject}</div>
            <div style={{fontSize:11,color:"var(--text2)",marginBottom:8}}>From {selected.firms?.name} ({selected.firms?.email})</div>
            <div style={{fontSize:12,background:"var(--bg)",padding:10,borderRadius:8,marginBottom:12}}>{selected.content}</div>
            <textarea className="textarea" rows={4} placeholder="Type your reply..." value={reply} onChange={e=>setReply(e.target.value)} />
            {feedback && <div style={{fontSize:12,marginTop:8,padding:"8px 10px",borderRadius:6,background:feedback.startsWith("✓")?"var(--gl)":"var(--rl)",color:feedback.startsWith("✓")?"var(--gt)":"var(--rt)"}}>{feedback}</div>}
            <button className="btn btn-primary btn-sm" style={{marginTop:8}} onClick={sendReply} disabled={sending}>{sending?"Sending...":"Send reply"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
