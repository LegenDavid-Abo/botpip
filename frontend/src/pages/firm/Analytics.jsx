
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function Analytics() {
  const { get } = useApi();
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState(null);

  useEffect(() => { get("/api/analytics?period="+period).then(setData).catch(()=>{}); }, [period]);

  if (!data) return <div style={{textAlign:"center",padding:40,color:"var(--text3)"}}>Loading...</div>;
  if (data.total_messages === 0) return (
    <div>
      <div className="page-header"><h1 className="page-title">Analytics</h1></div>
      <EmptyState icon="ti-chart-bar" title="No data yet" description="Analytics appear once your bot starts handling messages. Upload your knowledge base and connect a platform to begin." />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <select className="select" value={period} onChange={e=>setPeriod(e.target.value)}>
          <option value="1d">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option>
        </select>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{data.resolution_rate}%</div><div className="stat-label">Resolution rate</div></div>
        <div className="stat-card"><div className="stat-value">{data.escalations}</div><div className="stat-label">Escalations</div></div>
        <div className="stat-card"><div className="stat-value">{data.avg_confidence}%</div><div className="stat-label">Avg confidence</div></div>
        <div className="stat-card"><div className="stat-value">{data.total_messages}</div><div className="stat-label">Total messages</div></div>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-chart-bar" />Messages by platform</div>
        {Object.entries(data.by_platform||{}).map(([plat,count]) => (
          <div key={plat} className="row">
            <span style={{flex:1,textTransform:"capitalize"}}>{plat}</span>
            <div className="prog-bar" style={{width:160}}><div className="prog-fill pf-purple" style={{width:Math.min(100,(count/Math.max(1,...Object.values(data.by_platform)))*100)+"%"}} /></div>
            <span style={{fontSize:12,fontWeight:500,minWidth:30,textAlign:"right"}}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
