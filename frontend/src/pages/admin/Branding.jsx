
import React, { useState } from "react";
import Toggle from "../../components/Toggle.jsx";

export default function AdminBranding() {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7F77DD");
  const [logo, setLogo] = useState("");
  const [domain, setDomain] = useState("");
  const [hidePowered, setHidePowered] = useState(false);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">White-label branding</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-brush" />Enterprise firm appearance</div>
        <div className="row"><div className="row-label"><div className="lbl">Platform name</div><div className="sub">Shown instead of "BotPip" to Enterprise firms</div></div><input className="input" style={{width:160}} placeholder="e.g. TradingBot Pro" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Brand colour</div></div><input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:40,height:28,border:"1px solid var(--border2)",borderRadius:6,cursor:"pointer"}} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Logo URL</div></div><input className="input" style={{width:200}} placeholder="https://yourfirm.com/logo.png" value={logo} onChange={e=>setLogo(e.target.value)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Custom dashboard domain</div></div><input className="input" style={{width:200}} placeholder="app.yourfirm.com" value={domain} onChange={e=>setDomain(e.target.value)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Hide "Powered by BotPip"</div></div><Toggle value={hidePowered} onChange={setHidePowered} /></div>
      </div>
      <button className="btn btn-primary">Save branding</button>
    </div>
  );
}
