
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";

export default function WidgetPreview() {
  const { get, post } = useApi();
  const [color, setColor] = useState("#7F77DD");
  const [welcome, setWelcome] = useState("Hi! Ask me anything about rules, payouts, or your account.");
  const [botName, setBotName] = useState("Support Bot");
  const [autoOpen, setAutoOpen] = useState(false);
  const [showMobile, setShowMobile] = useState(true);
  const [saved, setSaved] = useState(false);

  async function save() {
    await post("/api/integrations/website", { widget_color: color, widget_welcome_message: welcome, widget_auto_open: autoOpen, widget_show_mobile: showMobile });
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Widget preview</h1></div>

      <div className="widget-preview">
        <div style={{fontSize:11,color:"var(--text3)",marginBottom:8}}>Your website — bot appears bottom-right</div>
        <div style={{fontSize:12,color:"var(--text2)",opacity:.5}}>Your website content is here...</div>
        <div className="widget-popup-preview">
          <div style={{fontSize:12,fontWeight:500,marginBottom:8,display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:18,height:18,background:color,borderRadius:"50%"}} /><span>{botName}</span>
            <div style={{marginLeft:"auto",width:8,height:8,background:"var(--g)",borderRadius:"50%"}} />
          </div>
          <div style={{background:"var(--bg)",borderRadius:7,padding:"7px 9px",fontSize:11,lineHeight:1.5,marginBottom:8}}>{welcome}</div>
          <div style={{display:"flex",gap:5}}>
            <input style={{flex:1,border:"1px solid var(--border)",borderRadius:5,padding:"5px 8px",fontSize:11}} placeholder="Ask a question..." disabled />
            <button style={{background:color,color:"#fff",border:"none",borderRadius:5,padding:"5px 10px",fontSize:11}}>Send</button>
          </div>
        </div>
        <div className="widget-btn-preview" style={{background:color}}><i className="ti ti-message-chatbot" /></div>
      </div>

      <div className="card">
        <div className="card-title"><i className="ti ti-palette" />Widget settings</div>
        <div className="row"><div className="row-label"><div className="lbl">Button colour</div></div><input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:40,height:28,border:"1px solid var(--border2)",borderRadius:6,cursor:"pointer"}} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Welcome message</div></div><input className="input" style={{flex:1,marginLeft:8}} value={welcome} onChange={e=>setWelcome(e.target.value)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Bot display name</div></div><input className="input" style={{width:160,marginLeft:8}} value={botName} onChange={e=>setBotName(e.target.value)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Auto-open after 5 seconds</div></div><Toggle value={autoOpen} onChange={setAutoOpen} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Show on mobile</div></div><Toggle value={showMobile} onChange={setShowMobile} /></div>
      </div>
      <button className="btn btn-primary" onClick={save}>{saved?"Saved ✓":"Save widget settings"}</button>
    </div>
  );
}
