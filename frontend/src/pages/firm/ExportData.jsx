
import React from "react";
import Toggle from "../../components/Toggle.jsx";

const API = import.meta.env.VITE_API_URL || "";

export default function ExportData() {
  const token = localStorage.getItem("bp_token");

  function exportData(type) {
    fetch(`${API}/api/export/${type}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `botpip-${type}.json`; a.click();
      });
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Export data</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-download" />Export options</div>
        <div className="row"><div className="row-label"><div className="lbl">All conversations (JSON)</div><div className="sub">Every message, response, confidence score, platform</div></div><button className="btn btn-outline btn-sm" onClick={()=>exportData("conversations")}>Export</button></div>
        <div className="row"><div className="row-label"><div className="lbl">Analytics events (JSON)</div><div className="sub">All tracked events for custom analysis</div></div><button className="btn btn-outline btn-sm" onClick={()=>exportData("analytics")}>Export</button></div>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-calendar" />Scheduled exports</div>
        <div className="row"><div className="row-label"><div className="lbl">Auto-export monthly report</div></div><Toggle value={false} onChange={()=>{}} /></div>
      </div>
    </div>
  );
}
