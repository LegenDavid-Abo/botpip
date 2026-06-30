
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";

export default function PlaygroundHealth() {
  const { get } = useApi();
  const [health, setHealth] = useState(null);

  useEffect(() => { get("/api/playground/health").then(setHealth).catch(()=>{}); }, []);

  if (!health) return <div style={{textAlign:"center",padding:40,color:"var(--text3)"}}>Loading...</div>;

  const circumference = 2 * Math.PI * 28;
  const dash = (health.score/100) * circumference;
  const color = health.score >= 80 ? "var(--g)" : health.score >= 50 ? "var(--a)" : "var(--r)";

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Bot health score</h1></div>
      <div className="card" style={{display:"flex",alignItems:"center",gap:18}}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke="var(--bg3)" strokeWidth="7" />
          <circle cx="36" cy="36" r="28" fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
          <text x="36" y="41" textAnchor="middle" fontSize="16" fontWeight="600" fill={color}>{health.score}</text>
        </svg>
        <div>
          <div style={{fontSize:14,fontWeight:600}}>{health.score>=80?"Excellent health":health.score>=50?"Good health":"Needs attention"}</div>
          <div style={{fontSize:12,color:"var(--text2)",marginTop:4}}>{health.issues.length} issue{health.issues.length!==1?"s":""} found</div>
        </div>
      </div>

      {health.issues.length > 0 && (
        <div className="card">
          <div className="card-title"><i className="ti ti-alert-circle" style={{color:"var(--a)"}} />Issues to fix</div>
          {health.issues.map((issue,i) => (
            <div key={i} className="row"><i className="ti ti-alert-circle" style={{fontSize:13,color:"var(--a)"}} /><span style={{flex:1}}>{issue}</span></div>
          ))}
        </div>
      )}

      {health.positives.length > 0 && (
        <div className="card">
          <div className="card-title"><i className="ti ti-check" style={{color:"var(--g)"}} />What's working well</div>
          {health.positives.map((p,i) => (
            <div key={i} className="row"><i className="ti ti-check" style={{fontSize:13,color:"var(--g)"}} /><span style={{flex:1}}>{p}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}
