
import React, { useState } from "react";
import { useApi } from "../../hooks/useApi.js";

export default function ContactSupport() {
  const { post } = useApi();
  const [subject, setSubject] = useState("Integration help");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!content.trim()) return;
    setSending(true);
    await post("/api/support/message", { subject, content });
    setSending(false); setSent(true); setContent("");
    setTimeout(()=>setSent(false),3000);
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Contact BotPip support</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-mail-forward" />Message the BotPip team</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:12,lineHeight:1.6}}>Your message goes directly to the platform owner. You'll get a reply in your dashboard and via email. Urgent issues are followed up on WhatsApp too.</div>
        <select className="select" style={{width:"100%",marginBottom:10}} value={subject} onChange={e=>setSubject(e.target.value)}>
          <option>Integration help</option><option>Billing question</option><option>Upgrade plan</option><option>Bot not working</option><option>Feature request</option><option>Other</option>
        </select>
        <textarea className="textarea" rows={5} placeholder="Describe your issue or question..." value={content} onChange={e=>setContent(e.target.value)} />
        {sent && <div style={{fontSize:12,color:"var(--g)",marginTop:8}}>✓ Message sent! Reply within 1–2 hours.</div>}
        <div style={{display:"flex",gap:10,alignItems:"center",marginTop:10}}>
          <button className="btn btn-primary" onClick={send} disabled={sending}>{sending?"Sending...":"Send message"}</button>
          <span style={{fontSize:11,color:"var(--text2)"}}>Reply within 1–2 hours</span>
        </div>
      </div>
    </div>
  );
}
