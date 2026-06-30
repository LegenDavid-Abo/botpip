
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function PlaygroundConflicts() {
  const { get, patch } = useApi();
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => { get("/api/kb/conflicts").then(setConflicts).catch(()=>{}); }, []);

  async function resolve(id, resolution) {
    await patch("/api/kb/conflicts/"+id+"/resolve", { resolution });
    setConflicts(c=>c.filter(x=>x.id!==id));
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Conflict checker</h1></div>
      {conflicts.length === 0
        ? <EmptyState icon="ti-alert-triangle" title="No conflicts found" description="Upload at least 2 documents to detect conflicts. BotPip checks all docs for contradicting rules automatically." />
        : (
        <div className="card">
          <div className="card-title"><i className="ti ti-alert-triangle" style={{color:"var(--a)"}} />Conflicts found ({conflicts.length})</div>
          {conflicts.map(c => (
            <div key={c.id} style={{padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{fontSize:12,color:"var(--r)",marginBottom:6}}>{c.description}</div>
              <div style={{display:"flex",gap:6}}>
                <button className="btn btn-primary btn-sm" onClick={()=>resolve(c.id,"Use document A")}>Use doc A</button>
                <button className="btn btn-outline btn-sm" onClick={()=>resolve(c.id,"Use document B")}>Use doc B</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
