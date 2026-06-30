
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";

export default function AdminChangelog() {
  const { get, post } = useApi();
  const [items, setItems] = useState([]);
  const [version, setVersion] = useState("");
  const [type, setType] = useState("feature");
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { get("/api/admin/changelog").then(setItems).catch(()=>{}); }, []);

  async function publish() {
    if (!version || !notes) return;
    setSaving(true);
    const item = await post("/api/admin/changelog", { version, type, notes, notify_firms: notify });
    setItems(i=>[item,...i]); setVersion(""); setNotes(""); setSaving(false);
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Changelog</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-plus" />New release</div>
        <div className="row"><span style={{flex:1}}>Version</span><input className="input" style={{width:100}} placeholder="2.1" value={version} onChange={e=>setVersion(e.target.value)} /></div>
        <div className="row"><span style={{flex:1}}>Type</span>
          <select className="select" style={{width:140}} value={type} onChange={e=>setType(e.target.value)}>
            <option value="feature">Feature</option><option value="fix">Fix</option><option value="improvement">Improvement</option>
          </select>
        </div>
        <textarea className="textarea" rows={3} placeholder="What's new..." value={notes} onChange={e=>setNotes(e.target.value)} style={{marginTop:8}} />
        <div className="row" style={{marginTop:8}}><span style={{flex:1}}>Notify all firms</span><Toggle value={notify} onChange={setNotify} /></div>
        <button className="btn btn-primary btn-sm" onClick={publish} disabled={saving}>{saving?"Publishing...":"Publish"}</button>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-history" />Release history</div>
        {items.length===0 ? <div style={{fontSize:12,color:"var(--text3)",textAlign:"center",padding:16}}>No releases yet.</div> : items.map(it => (
          <div key={it.id} style={{padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
            <div style={{fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:7}}>v{it.version} <span className="badge badge-green">{it.type}</span></div>
            <div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{new Date(it.published_at).toLocaleDateString()}</div>
            <div style={{fontSize:12,color:"var(--text2)",marginTop:4,lineHeight:1.5}}>{it.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
