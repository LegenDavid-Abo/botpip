
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function ReplyTemplates() {
  const { get, post, del } = useApi();
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { get("/api/templates").then(setTemplates).catch(()=>{}); }, []);

  async function addTemplate() {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    const t = await post("/api/templates", { name, content, trigger_keywords: name.toLowerCase().split(" ") });
    setTemplates(ts=>[...ts,t]); setName(""); setContent(""); setSaving(false);
  }

  async function removeTemplate(id) {
    await del("/api/templates/"+id);
    setTemplates(ts=>ts.filter(t=>t.id!==id));
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Reply templates</h1></div>

      {templates.length === 0
        ? <EmptyState icon="ti-template" title="No templates yet" description="Save common responses the bot can reuse — drawdown reminders, payout explanations, policy notices." />
        : (
        <div className="card">
          <div className="card-title"><i className="ti ti-template" />Saved templates</div>
          {templates.map(t => (
            <div key={t.id} className="row">
              <i className="ti ti-file-text" style={{fontSize:14,color:"var(--p)"}} />
              <div style={{flex:1}}>
                <div className="lbl">{t.name}</div>
                <div className="sub" style={{maxWidth:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.content}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>removeTemplate(t.id)}><i className="ti ti-trash" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title"><i className="ti ti-plus" />New template</div>
        <div className="row"><div className="row-label"><div className="lbl">Name</div></div><input className="input" style={{flex:1,marginLeft:8}} placeholder="e.g. Weekend trading rules" value={name} onChange={e=>setName(e.target.value)} /></div>
        <textarea className="textarea" rows={3} placeholder="Template content — can use {{variables}}..." value={content} onChange={e=>setContent(e.target.value)} style={{marginTop:8}} />
        <button className="btn btn-primary btn-sm" style={{marginTop:8}} onClick={addTemplate} disabled={saving}>{saving?"Saving...":"Save template"}</button>
      </div>
    </div>
  );
}
