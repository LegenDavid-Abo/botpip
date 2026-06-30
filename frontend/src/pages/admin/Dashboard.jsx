
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../hooks/useApi.js";

export default function AdminDashboard() {
  const { get } = useApi();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => { get("/api/admin/stats").then(setStats).catch(()=>{}); }, []);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Platform overview</h1></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{stats?.active_firms ?? 0}</div><div className="stat-label">Active firms</div><div className="stat-delta delta-up">{stats?.new_firms_week ?? 0} this week</div></div>
        <div className="stat-card"><div className="stat-value">${stats?.mrr ?? 0}</div><div className="stat-label">Monthly revenue</div></div>
        <div className="stat-card"><div className="stat-value">{stats?.messages_today ?? 0}</div><div className="stat-label">Messages today</div></div>
        <div className="stat-card"><div className="stat-value">{stats ? Object.values(stats.by_plan||{}).reduce((a,b)=>a+b,0) : 0}</div><div className="stat-label">Total firms</div></div>
      </div>

      <div className="two-col">
        <div className="card" style={{textAlign:"center",padding:26}}>
          <i className="ti ti-rocket" style={{fontSize:32,color:"var(--p)",display:"block",marginBottom:10}} />
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Platform ready — let's launch</div>
          <div style={{fontSize:12,color:"var(--text2)",marginBottom:14,lineHeight:1.6}}>Set up your plans, add your API keys, then share your signup link with prop firms.</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn btn-primary" onClick={()=>navigate("/admin/plans")}>Set up plans</button>
            <button className="btn btn-outline" onClick={()=>navigate("/admin/apis")}>Add API keys</button>
          </div>
        </div>
        <div className="card">
          <div className="card-title"><i className="ti ti-chart-pie" />Firms by plan</div>
          {stats && Object.entries(stats.by_plan||{}).map(([plan,count]) => (
            <div key={plan} className="row"><span style={{flex:1,textTransform:"capitalize"}}>{plan}</span><span style={{fontWeight:500}}>{count}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
