
import React from "react";
const SERVICES = [
  {name:"API server",ms:23,status:"online"},
  {name:"Discord bot",ms:41,status:"online"},
  {name:"Database (Supabase)",ms:18,status:"online"},
  {name:"Anthropic AI",ms:312,status:"online"},
  {name:"Flutterwave payments",ms:89,status:"online"},
  {name:"WhatsApp",ms:null,status:"pending"},
];
export default function AdminUptime() {
  return (
    <div>
      <div className="page-header"><h1 className="page-title">Uptime monitor</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-activity" />Services</div>
        {SERVICES.map(s => (
          <div key={s.name} className="row">
            <div className={"uptime-dot "+(s.status==="online"?"ud-green":"ud-amber")} />
            <span style={{flex:1}}>{s.name}</span>
            <span style={{fontSize:11,color:"var(--text2)"}}>{s.ms?s.ms+"ms":"—"}</span>
            <span className={"badge "+(s.status==="online"?"badge-green":"badge-amber")}>{s.status==="online"?"Online":"Not configured"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
