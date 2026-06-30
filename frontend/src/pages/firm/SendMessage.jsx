
import React, { useState } from "react";
import { useApi } from "../../hooks/useApi.js";

const PLATFORMS = [
  {id:"discord",label:"Discord",icon:"ti-brand-discord"},
  {id:"email",label:"Email members",icon:"ti-mail"},
  {id:"whatsapp",label:"WhatsApp",icon:"ti-brand-whatsapp"},
  {id:"telegram",label:"Telegram",icon:"ti-brand-telegram"},
];

export default function SendMessage() {
  const { post } = useApi();
  const [platform, setPlatform] = useState("discord");
  const [target, setTarget] = useState("");
  const [customCh, setCustomCh] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  async function send() {
    const finalTarget = platform==="discord" && customCh.trim() ? customCh.trim() : target;
    if (!finalTarget || !message.trim()) { setResult("Please fill in recipient and message"); return; }
    setSending(true); setResult("");
    try {
      const r = await post("/api/broadcast", { platform, target: finalTarget, message });
      setResult(r.success ? "✓ Message sent successfully!" : "Failed to send — check connection");
    } catch(err) { setResult("Error: "+err.message); }
    finally { setSending(false); }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Send message</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-send" />Choose platform</div>
        <div className="plat-selector">
          {PLATFORMS.map(p => (
            <div key={p.id} className={"plat-chip"+(platform===p.id?" on":"")} onClick={()=>setPlatform(p.id)}>
              <i className={"ti "+p.icon} />{p.label}
            </div>
          ))}
        </div>

        {platform === "discord" && (
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,color:"var(--text2)",marginBottom:6}}>Select a saved channel or type any channel name</div>
            <input className="input" placeholder="Channel name e.g. announcements" value={target} onChange={e=>setTarget(e.target.value)} style={{marginBottom:7}} />
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <i className="ti ti-hash" style={{fontSize:13,color:"var(--text2)"}} />
              <input className="input" placeholder="Or type custom channel e.g. happy, trading-lounge..." value={customCh} onChange={e=>setCustomCh(e.target.value)} />
            </div>
          </div>
        )}
        {platform === "email" && <input className="input" placeholder="Member email or 'all'" value={target} onChange={e=>setTarget(e.target.value)} style={{marginBottom:10}} />}
        {platform === "whatsapp" && <input className="input" placeholder="WhatsApp number e.g. +1234567890" value={target} onChange={e=>setTarget(e.target.value)} style={{marginBottom:10}} />}
        {platform === "telegram" && <input className="input" placeholder="Telegram group or @username" value={target} onChange={e=>setTarget(e.target.value)} style={{marginBottom:10}} />}

        <textarea className="textarea" rows={4} placeholder="Type your message..." value={message} onChange={e=>setMessage(e.target.value)} />
        {result && <div style={{fontSize:12,marginTop:8,color:result.startsWith("✓")?"var(--g)":"var(--r)"}}>{result}</div>}
        <button className="btn btn-primary" style={{marginTop:10}} onClick={send} disabled={sending}>
          <i className="ti ti-send" />{sending?"Sending...":"Send now"}
        </button>
      </div>
    </div>
  );
}
