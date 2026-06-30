
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";

export default function AdminPlans() {
  const { get, patch } = useApi();
  const [plans, setPlans] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { get("/api/admin/plans").then(setPlans).catch(()=>{}); }, []);

  function update(name, key, value) {
    setPlans(ps => ps.map(p => p.name===name ? {...p,[key]:value} : p));
  }

  async function saveAll() {
    setSaving(true); setMsg("");
    try {
      for (const p of plans) await patch("/api/admin/plans/"+p.name, p);
      setMsg("✓ Plans saved and published!");
    } catch(err) { setMsg("Error: "+err.message); }
    finally { setSaving(false); }
  }

  const order = ["starter","pro","enterprise"];
  const sorted = [...plans].sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Plans & pricing</h1>
        <span style={{fontSize:11,color:"var(--text2)"}}>Edit left, preview updates live on right</span>
      </div>
      {msg && <div style={{fontSize:12,padding:"8px 12px",borderRadius:6,background:"var(--gl)",color:"var(--gt)",marginBottom:12}}>{msg}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          {sorted.map(plan => (
            <div key={plan.name} className="card">
              <div className="card-title" style={{textTransform:"capitalize"}}><i className="ti ti-edit" />{plan.name}</div>
              <div className="row"><span style={{flex:1}}>Price ($/month)</span><input className="input" style={{width:80}} type="number" value={plan.price_monthly} onChange={e=>update(plan.name,"price_monthly",+e.target.value)} /></div>
              <div className="row"><span style={{flex:1}}>Platforms</span><input className="input" style={{width:80}} value={plan.platforms_allowed} onChange={e=>update(plan.name,"platforms_allowed",e.target.value)} /></div>
              <div className="row"><span style={{flex:1}}>Messages/month</span><input className="input" style={{width:80}} value={plan.messages_monthly} onChange={e=>update(plan.name,"messages_monthly",e.target.value)} /></div>
              <div className="row"><span style={{flex:1}}>Documents</span><input className="input" style={{width:80}} value={plan.docs_allowed} onChange={e=>update(plan.name,"docs_allowed",e.target.value)} /></div>
              <div className="row"><span style={{flex:1}}>Team seats</span><input className="input" style={{width:80}} value={plan.team_seats} onChange={e=>update(plan.name,"team_seats",e.target.value)} /></div>
              <div className="row"><span style={{flex:1}}>Human handoff</span><Toggle value={plan.human_handoff} onChange={v=>update(plan.name,"human_handoff",v)} /></div>
              <div className="row"><span style={{flex:1}}>API access</span><Toggle value={plan.api_access} onChange={v=>update(plan.name,"api_access",v)} /></div>
              <div className="row"><span style={{flex:1}}>White-label</span><Toggle value={plan.white_label} onChange={v=>update(plan.name,"white_label",v)} /></div>
            </div>
          ))}
          <button className="btn btn-primary btn-full" onClick={saveAll} disabled={saving}>{saving?"Saving...":"Save & publish all plans"}</button>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:500,color:"var(--text2)",marginBottom:8}}>Live preview — what firms see</div>
          {sorted.map(plan => (
            <div key={plan.name} className={"plan-card"+(plan.name==="pro"?" featured":"")}>
              {plan.name==="pro" && <div className="plan-popular">Most popular</div>}
              <div className="plan-name" style={{textTransform:"capitalize"}}>{plan.name}</div>
              <div className="plan-price">${plan.price_monthly}<sup>/month</sup></div>
              <div style={{marginTop:8}}>
                <div className="plan-feature"><i className="ti ti-plug" />{plan.platforms_allowed} platform{plan.platforms_allowed==="1"?"":"s"}</div>
                <div className="plan-feature"><i className="ti ti-message" />{plan.messages_monthly} messages</div>
                <div className="plan-feature"><i className="ti ti-file" />{plan.docs_allowed} documents</div>
                <div className="plan-feature"><i className="ti ti-users" />{plan.team_seats} seats</div>
                {plan.human_handoff && <div className="plan-feature"><i className="ti ti-headset" />Human handoff</div>}
                {plan.api_access && <div className="plan-feature"><i className="ti ti-api" />API access</div>}
                {plan.white_label && <div className="plan-feature"><i className="ti ti-star" />White-label</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
