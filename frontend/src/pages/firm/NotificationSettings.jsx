
import React, { useState } from "react";
import Toggle from "../../components/Toggle.jsx";

const ROWS = [
  {key:"escalation",label:"Bot escalates to human"},
  {key:"health",label:"Health score drops below 70"},
  {key:"conflict",label:"Conflict detected in docs"},
  {key:"gap",label:"Bot can't answer (gap found)"},
  {key:"daily",label:"Daily message summary"},
  {key:"renewal",label:"Subscription renewal reminder"},
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(Object.fromEntries(ROWS.map(r=>[r.key,{email:true,wa:r.key!=="health"&&r.key!=="gap"&&r.key!=="daily"}])));

  function toggle(key, channel) {
    setPrefs(p=>({...p,[key]:{...p[key],[channel]:!p[key][channel]}}));
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Notification settings</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-bell" />Notify me when...</div>
        {ROWS.map(r => (
          <div key={r.key} className="row">
            <div className="row-label"><div className="lbl">{r.label}</div></div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <Toggle value={prefs[r.key].email} onChange={()=>toggle(r.key,"email")} />
              <Toggle value={prefs[r.key].wa} onChange={()=>toggle(r.key,"wa")} />
              <span style={{fontSize:10,color:"var(--text2)"}}>Email · WA</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
