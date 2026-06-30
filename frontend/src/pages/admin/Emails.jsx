
import React, { useState } from "react";

const TEMPLATES = {
  welcome: { label:"Welcome", subject:"Welcome to BotPip — your AI bot is ready", body:"Hi {{firm_name}}, your BotPip account is live! Start by uploading your rules PDF in the Knowledge Base. Your {{trial_days}}-day trial begins now." },
  trial: { label:"Trial ending", subject:"Your BotPip trial ends in {{days}} days", body:"Hi {{firm_name}}, your free trial ends in {{days}} days. Your bot has answered {{msg_count}} questions so far. Add a card to keep it running." },
  payment: { label:"Payment confirmed", subject:"Payment confirmed", body:"Hi {{firm_name}}, payment of ${{amount}} confirmed for your {{plan}} plan. Your bot is fully active." },
  health: { label:"Health alert", subject:"Bot health alert", body:"Hi {{firm_name}}, your bot health score dropped to {{score}}. Issues: {{issues}}. Login to fix them." },
};

export default function AdminEmails() {
  const [tab, setTab] = useState("welcome");
  const [edits, setEdits] = useState({});

  const current = { ...TEMPLATES[tab], ...edits[tab] };
  function update(field, val) { setEdits(e=>({...e,[tab]:{...current,[field]:val}})); }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Email templates</h1></div>
      <div className="stab-row">
        {Object.keys(TEMPLATES).map(k => <div key={k} className={"stab"+(tab===k?" on":"")} onClick={()=>setTab(k)}>{TEMPLATES[k].label}</div>)}
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-mail" />{current.label} email</div>
        <div className="row"><span style={{fontSize:11,color:"var(--text2)",minWidth:50}}>Subject</span><input className="input" style={{flex:1,marginLeft:8}} value={current.subject} onChange={e=>update("subject",e.target.value)} /></div>
        <textarea className="textarea" rows={4} style={{marginTop:8}} value={current.body} onChange={e=>update("body",e.target.value)} />
        <button className="btn btn-primary btn-sm" style={{marginTop:8}}>Save template</button>
      </div>
    </div>
  );
}
