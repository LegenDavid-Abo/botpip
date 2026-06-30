
import React, { useState, useRef } from "react";
import { useApi } from "../../hooks/useApi.js";

const QUICK_Q = ["What is the max drawdown?","What is my lot size limit?","How do payouts work?","Is news trading allowed?","Give me the link to the rules"];

export default function PlaygroundChat() {
  const { post } = useApi();
  const [messages, setMessages] = useState([{role:"bot",content:"Hello! Upload your knowledge base first, then test me here. Try the quick questions or type your own."}]);
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState({source:"—",confidence:"—",linkShared:"Only when relevant"});
  const [sending, setSending] = useState(false);
  const boxRef = useRef();

  async function send(text) {
    const q = text || input;
    if (!q.trim()) return;
    setMessages(m=>[...m,{role:"user",content:q}]);
    setInput(""); setSending(true);
    try {
      const result = await post("/api/playground/test", { question: q });
      setMessages(m=>[...m,{role:"bot",content:result.answer,ref:q}]);
      setAnalysis({ source: result.sourceDocId?"Indexed document":"No match", confidence: result.confidence+"%", linkShared: result.linkShared?"Yes — shared directly":"No" });
    } catch(err) {
      setMessages(m=>[...m,{role:"bot",content:"Error: "+err.message}]);
    } finally { setSending(false); setTimeout(()=>boxRef.current?.scrollTo(0,9999),50); }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Live bot test</h1></div>
      <div className="card">
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:10}}>Test exactly how your bot answers before going live.</div>
        <div className="chat-box" ref={boxRef}>
          {messages.map((m,i) => (
            <div key={i} className={"chat-msg "+(m.role==="user"?"user":"")}>
              <div className={"chat-avatar "+(m.role==="user"?"user":"bot")}>{m.role==="user"?"Y":"B"}</div>
              <div className={"chat-bubble "+(m.role==="user"?"user":"bot")}>
                {m.ref && <div className="chat-ref">↩ Replying to: "{m.ref.substring(0,38)}{m.ref.length>38?"...":""}"</div>}
                {m.content}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
          {QUICK_Q.map(q => <div key={q} style={{fontSize:11,padding:"4px 10px",border:"1px solid var(--border2)",borderRadius:14,cursor:"pointer",color:"var(--text2)"}} onClick={()=>send(q)}>{q}</div>)}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input className="input" placeholder="Type anything your traders would ask..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} style={{flex:1}} />
          <button className="btn btn-primary" onClick={()=>send()} disabled={sending}>{sending?"...":"Send"}</button>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-info-circle" />Reply analysis</div>
        <div className="row"><span>Source</span><span className="badge badge-blue">{analysis.source}</span></div>
        <div className="row"><span>Confidence</span><span style={{fontWeight:500,color:"var(--p)"}}>{analysis.confidence}</span></div>
        <div className="row"><span>Reply threading</span><span className="badge badge-green">Active</span></div>
        <div className="row"><span>Link shared?</span><span style={{fontSize:12,color:"var(--text2)"}}>{analysis.linkShared}</span></div>
      </div>
    </div>
  );
}
