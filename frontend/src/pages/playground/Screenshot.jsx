
import React, { useState, useRef } from "react";
import { useApi } from "../../hooks/useApi.js";

export default function PlaygroundScreenshot() {
  const { upload } = useApi();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    setLoading(true);
    const fd = new FormData(); fd.append("image", file);
    try { const d = await upload("/api/playground/screenshot", fd); setAnalysis(d.analysis); }
    catch(err) { setAnalysis("Error: "+err.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Screenshot reader</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-screenshot" />MT4/MT5 screenshot test</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:12,lineHeight:1.6}}>Users send a screenshot of their MT4/MT5 terminal. The bot reads it, explains what it shows, and cross-references with their rules.</div>
        <input type="file" accept="image/*" ref={fileRef} style={{display:"none"}} onChange={handleFile} />
        <div onClick={()=>fileRef.current?.click()} style={{border:"2px dashed var(--border2)",borderRadius:10,padding:28,textAlign:"center",cursor:"pointer",background:"var(--bg)",marginBottom:12}}>
          <i className="ti ti-photo" style={{fontSize:26,color:"var(--text3)",display:"block",marginBottom:8}} />
          <div style={{fontSize:12,color:"var(--text2)"}}>{loading?"Analysing...":"Drop MT4/MT5 screenshot here to test"}</div>
        </div>
        <div style={{background:"var(--bg)",borderRadius:8,padding:12}}>
          <div style={{fontSize:12,fontWeight:500,marginBottom:6}}>{analysis?"Bot response:":"Example bot response:"}</div>
          <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6}}>
            {analysis || "📊 I can see your MT4 terminal. You have 3 open trades with floating P&L of +$142. Current drawdown: 2.3% — within your 5% daily limit. Lot sizes correct for Evaluation rules. No violations. ✅"}
          </div>
        </div>
      </div>
    </div>
  );
}
