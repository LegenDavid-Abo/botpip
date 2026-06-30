
import React from "react";
const STEPS = [
  {label:"Account created",done:true},
  {label:"Add Anthropic API key",done:false},
  {label:"Set up Flutterwave payments",done:false},
  {label:"Configure plans & pricing",done:false},
  {label:"Create Discord bot app",done:false},
  {label:"Deploy backend to Railway",done:false},
  {label:"Deploy frontend to Vercel",done:false},
  {label:"Invite first firm to test",done:false},
];
export default function AdminOnboarding() {
  const done = STEPS.filter(s=>s.done).length;
  return (
    <div>
      <div className="page-header"><h1 className="page-title">My setup checklist</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-checklist" />Steps to launch BotPip</div>
        {STEPS.map((s,i) => (
          <div key={i} className="onb-item">
            <div className={"onb-icon "+(s.done?"onb-done":"onb-todo")}><i className={"ti "+(s.done?"ti-check":"ti-circle")} /></div>
            <span style={{flex:1}}>{s.label}</span>
            <span className={"badge "+(s.done?"badge-green":"badge-amber")}>{s.done?"Done":"Pending"}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
        <span style={{fontSize:12,color:"var(--text2)"}}>Progress</span>
        <div className="prog-bar" style={{flex:1}}><div className="prog-fill pf-purple" style={{width:(done/STEPS.length*100)+"%"}} /></div>
        <span style={{fontSize:12,fontWeight:500,color:"var(--p)"}}>{done}/{STEPS.length}</span>
      </div>
    </div>
  );
}
