
import React, { useState } from "react";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function AutoFAQ() {
  const { post } = useApi();
  const [faq, setFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true); setError("");
    try { const d = await post("/api/playground/faq", {}); setFaq(d); }
    catch(err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Auto FAQ generator</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-sparkles" />Generate FAQ from conversations</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:12,lineHeight:1.6}}>BotPip analyses all past conversations and automatically generates a structured FAQ from the most common questions.</div>
        {error && <div style={{fontSize:12,color:"var(--r)",marginBottom:10}}>{error}</div>}
        <button className="btn btn-primary btn-full" onClick={generate} disabled={loading}>
          <i className="ti ti-sparkles" />{loading?"Analysing conversations...":"Generate FAQ now"}
        </button>
      </div>

      {faq && faq.length > 0 && (
        <div className="card">
          <div className="card-title"><i className="ti ti-list" />Generated FAQ</div>
          {faq.map((item,i) => (
            <div key={i} className="row">
              <i className="ti ti-circle-check" style={{fontSize:14,color:"var(--g)"}} />
              <div style={{flex:1}}>
                <div className="lbl">{item.question}</div>
                <div className="sub">{item.category} · {item.frequency} frequency</div>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button className="btn btn-primary btn-sm">Publish to Discord</button>
            <button className="btn btn-outline btn-sm">Export as PDF</button>
          </div>
        </div>
      )}

      {!faq && !loading && <EmptyState icon="ti-sparkles" title="No FAQ generated yet" description="Click the button above once your bot has handled at least 10 conversations." />}
    </div>
  );
}
