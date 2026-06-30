
import React, { useState, useEffect, useRef } from "react";
import { useApi } from "../../hooks/useApi.js";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function KnowledgeBase() {
  const { get, del, upload, post } = useApi();
  const [docs, setDocs] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef();

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    const [d,c] = await Promise.all([get("/api/kb/docs"), get("/api/kb/conflicts")]);
    setDocs(d||[]); setConflicts(c||[]);
  }

  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    setLoading(true); setMsg("");
    try {
      const fd = new FormData(); fd.append("file", file);
      await upload("/api/kb/upload", fd);
      setMsg("Document uploaded and indexing... refresh in 30 seconds.");
      refresh();
    } catch(err) { setMsg("Error: "+err.message); }
    finally { setLoading(false); }
  }

  async function handleURL() {
    if (!url.trim()) return; setLoading(true); setMsg("");
    try {
      await post("/api/kb/upload", { url });
      setMsg("URL queued for indexing."); setUrl(""); refresh();
    } catch(err) { setMsg("Error: "+err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this document?")) return;
    await del("/api/kb/docs/"+id); refresh();
  }

  async function resolveConflict(id, resolution) {
    await post("/api/kb/conflicts/"+id+"/resolve", { resolution });
    refresh();
  }

  const statusColor = s => s==="indexed"?"green":s==="error"?"red":"amber";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Knowledge base</h1>
        <button className="btn btn-primary btn-sm" onClick={()=>fileRef.current?.click()} disabled={loading}>
          <i className="ti ti-upload" />{loading?"Uploading...":"Upload document"}
        </button>
      </div>

      <input type="file" ref={fileRef} accept=".pdf,.docx,.txt" style={{display:"none"}} onChange={handleFile} />

      <div onClick={()=>fileRef.current?.click()} style={{border:"2px dashed var(--border2)",borderRadius:10,padding:28,textAlign:"center",cursor:"pointer",background:"var(--bg)",marginBottom:12}} className="hover:bg-bg3">
        <i className="ti ti-upload" style={{fontSize:28,color:"var(--text3)",display:"block",marginBottom:8}} />
        <div style={{fontSize:12,color:"var(--text2)"}}>Drag & drop PDFs, Word docs — or click to browse</div>
        <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>Bot learns ONLY from what you upload — never guesses</div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <input className="input" value={url} onChange={e=>setUrl(e.target.value)} placeholder="Or paste a website URL e.g. https://yourfirm.com/rules" style={{flex:1}} />
        <button className="btn btn-outline" onClick={handleURL} disabled={loading}><i className="ti ti-world" />Index URL</button>
      </div>

      {msg && <div style={{fontSize:12,padding:"8px 12px",borderRadius:6,background:"var(--bl)",color:"var(--bt)",marginBottom:12}}>{msg}</div>}

      {docs.length === 0
        ? <EmptyState icon="ti-file-text" title="No documents yet" description="Upload your rules PDF, payout structure, evaluation guide, and FAQ. Each document gets an accuracy score after indexing." />
        : (
          <div className="card">
            <div className="card-title"><i className="ti ti-file-text" />Documents & accuracy</div>
            {docs.map(doc => (
              <div key={doc.id} className="row">
                <i className={"ti "+(doc.type==="url"?"ti-world":"ti-file-type-pdf")} style={{fontSize:16,color:doc.type==="url"?"var(--p)":"var(--r)",flexShrink:0}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.name}</div>
                  {doc.status==="indexed" && <div style={{fontSize:11,color:"var(--text2)"}}>{doc.chunk_count} chunks · {doc.accuracy_score}% accuracy</div>}
                </div>
                <Badge color={statusColor(doc.status)}>{doc.status}</Badge>
                <button className="btn btn-ghost btn-sm" onClick={()=>handleDelete(doc.id)}><i className="ti ti-trash" /></button>
              </div>
            ))}
          </div>
        )
      }

      {conflicts.length > 0 && (
        <div className="card">
          <div className="card-title"><i className="ti ti-alert-triangle" style={{color:"var(--a)"}} />Conflicts detected — resolve before going live</div>
          {conflicts.map(c => (
            <div key={c.id} style={{padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{fontSize:12,fontWeight:500,color:"var(--r)",marginBottom:4}}>{c.description}</div>
              <div style={{display:"flex",gap:6,marginTop:8}}>
                <button className="btn btn-primary btn-sm" onClick={()=>resolveConflict(c.id,"Use primary document")}>Use doc A</button>
                <button className="btn btn-outline btn-sm" onClick={()=>resolveConflict(c.id,"Use secondary document")}>Use doc B</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title"><i className="ti ti-settings" />Sync settings</div>
        <div className="row"><div className="row-label"><div className="lbl">Conflict alert when docs contradict each other</div></div><span className="badge badge-green">Always on</span></div>
        <div className="row"><div className="row-label"><div className="lbl">Auto re-sync website URLs every 7 days</div><div className="sub">Keeps your bot up to date automatically</div></div><span className="badge badge-green">Active</span></div>
      </div>
    </div>
  );
}
