
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";

export default function AdminUsage() {
  const { get } = useApi();
  const [usage, setUsage] = useState(null);
  useEffect(() => { get("/api/admin/usage").then(setUsage).catch(()=>{}); }, []);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">API usage & costs</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-chart-dots" />This month (30 days)</div>
        <div className="row"><span style={{flex:1}}>Total messages handled</span><span style={{fontWeight:500}}>{usage?.total_messages ?? 0}</span></div>
        <div className="row"><span style={{flex:1}}>Estimated Anthropic cost</span><span style={{fontWeight:500,color:"var(--g)"}}>${usage?.estimated_anthropic_cost ?? "0.00"}</span></div>
        <div className="row"><span style={{flex:1}}>Estimated OpenAI cost</span><span style={{fontWeight:500,color:"var(--g)"}}>${usage?.estimated_openai_cost ?? "0.0000"}</span></div>
        <div className="row"><span style={{flex:1,fontWeight:500}}>Total estimated spend</span><span style={{fontWeight:600,color:"var(--p)"}}>${usage?.total_estimated ?? "0.00"}</span></div>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-bell" />Cost alerts</div>
        <div className="row"><div className="row-label"><div className="lbl">Alert when monthly spend exceeds</div></div><input className="input" style={{width:90}} defaultValue="$100" /></div>
      </div>
    </div>
  );
}
