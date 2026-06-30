
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function FirmDashboard() {
  const { user } = useAuth();
  const { get } = useApi();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => { get("/api/analytics?period=1d").then(setAnalytics).catch(()=>{}); }, []);

  const steps = [
    { label:"Account created", done:true },
    { label:"Upload knowledge base", done:(user?.health_score||0) > 10, path:"/dashboard/knowledge" },
    { label:"Connect Discord", done:false, path:"/dashboard/integrations" },
    { label:"Test in playground", done:false, path:"/playground" },
    { label:"Go live", done:false, path:"/dashboard/integrations" },
  ];
  const doneCount = steps.filter(s=>s.done).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{fontSize:11,color:"var(--text2)"}}>Welcome back, {user?.name}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{analytics?.total_messages ?? 0}</div>
          <div className="stat-label">Messages today</div>
          <div className={"stat-delta "+(analytics?.total_messages>0?"delta-up":"delta-down")}>
            {analytics?.total_messages>0?"Bot is live":"Connect platforms"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics?.resolution_rate ?? "—"}%</div>
          <div className="stat-label">AI resolution rate</div>
          <div className="stat-delta" style={{color:"var(--text3)"}}>Last 24 hours</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics?.bot_replies ?? 0}</div>
          <div className="stat-label">Bot replies</div>
          <div className="stat-delta" style={{color:"var(--text3)"}}>Confidence: {analytics?.avg_confidence ?? "—"}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics?.escalations ?? 0}</div>
          <div className="stat-label">Escalations</div>
          <div className={"stat-delta "+(analytics?.escalations===0?"delta-up":"delta-down")}>
            {analytics?.escalations===0?"All resolved":"Need attention"}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card" style={{textAlign:"center",padding:28}}>
          <i className="ti ti-sparkles" style={{fontSize:36,color:"var(--p)",display:"block",marginBottom:10}} />
          <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Set up your bot</div>
          <div style={{fontSize:12,color:"var(--text2)",marginBottom:16,lineHeight:1.6}}>Upload your rules PDF then connect platforms. Takes under 10 minutes.</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn btn-primary" onClick={()=>navigate("/dashboard/knowledge")}><i className="ti ti-upload" />Upload rules</button>
            <button className="btn btn-outline" onClick={()=>navigate("/dashboard/integrations")}><i className="ti ti-plug" />Connect platforms</button>
          </div>
        </div>
        <div className="card">
          <div className="card-title"><i className="ti ti-checklist" />Setup progress</div>
          {steps.map((s,i) => (
            <div key={i} className="onb-item" style={{cursor:s.path?"pointer":"default"}} onClick={()=>s.path&&navigate(s.path)}>
              <div className={"onb-icon "+(s.done?"onb-done":"onb-todo")}>
                <i className={"ti "+(s.done?"ti-check":"ti-circle")} />
              </div>
              <span style={{flex:1,fontSize:12}}>{s.label}</span>
              {s.done ? <span className="badge badge-green">Done</span> : s.path ? <span className="badge badge-amber">Start</span> : null}
            </div>
          ))}
          <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"var(--text2)"}}>Progress</span>
            <div className="prog-bar" style={{flex:1}}><div className="prog-fill pf-purple" style={{width:(doneCount/steps.length*100)+"%"}} /></div>
            <span style={{fontSize:12,fontWeight:500,color:"var(--p)"}}>{doneCount}/{steps.length}</span>
          </div>
        </div>
      </div>

      {analytics?.by_platform && Object.keys(analytics.by_platform).length > 0 && (
        <div className="card">
          <div className="card-title"><i className="ti ti-chart-bar" />Messages by platform</div>
          {Object.entries(analytics.by_platform).map(([plat,count]) => (
            <div key={plat} className="row">
              <span style={{flex:1,textTransform:"capitalize"}}>{plat}</span>
              <div className="prog-bar" style={{width:160}}><div className="prog-fill pf-purple" style={{width:Math.min(100,(count/Math.max(...Object.values(analytics.by_platform)))*100)+"%"}} /></div>
              <span style={{fontSize:12,fontWeight:500,minWidth:30,textAlign:"right"}}>{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
