
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

const PLANS = ["trial","starter","pro","enterprise"];
const STATUSES = ["active","paused","cancelled","overdue"];

const planColor = p => ({trial:"amber",starter:"blue",pro:"green",enterprise:"purple"}[p]||"gray");
const statusColor = s => ({active:"green",paused:"amber",cancelled:"red",overdue:"red"}[s]||"gray");

export default function AdminFirms() {
  const { get, patch, del, post } = useApi();
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editForm, setEditForm] = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const d = await get("/api/admin/firms"); setFirms(d||[]); }
    finally { setLoading(false); }
  }

  async function openFirm(firm) {
    const full = await get("/api/admin/firms/"+firm.id);
    setSelected(full);
    setEditForm({ plan: full.plan, status: full.status, trial_ends_at: full.trial_ends_at?.split("T")[0]||"" });
    setMsg("");
  }

  async function saveFirm() {
    setSaving(true); setMsg("");
    try {
      await patch("/api/admin/firms/"+selected.id, editForm);
      setMsg("✓ Saved successfully");
      load();
      setSelected(s => ({...s,...editForm}));
    } catch(err) { setMsg("Error: "+err.message); }
    finally { setSaving(false); }
  }

  async function deleteFirm(id, name) {
    if (!confirm(`Delete ${name}? This is permanent and removes all their data.`)) return;
    await del("/api/admin/firms/"+id);
    setSelected(null); load();
  }

  async function extendTrial(days) {
    const current = new Date(selected.trial_ends_at || Date.now());
    const newDate = new Date(current.getTime() + days*86400000).toISOString().split("T")[0];
    setEditForm(f=>({...f, trial_ends_at:newDate, plan:"trial", status:"active"}));
    setMsg(`Trial extended by ${days} days (save to apply)`);
  }

  const filtered = firms.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = !filterPlan || f.plan === filterPlan;
    const matchStatus = !filterStatus || f.status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  return (
    <div style={{display:"flex",gap:16,height:"calc(100vh - 88px)"}}>

      {/* LEFT: firm list */}
      <div style={{flex:1,overflow:"auto"}}>
        <div className="page-header">
          <h1 className="page-title">All firms ({firms.length})</h1>
          <button className="btn btn-primary btn-sm" onClick={()=>{ setSelected("new"); setEditForm({plan:"trial",status:"active",name:"",email:""}); setMsg(""); }}>
            <i className="ti ti-plus" />Add firm
          </button>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input className="input" placeholder="Search firms..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1}} />
          <select className="select" style={{width:110}} value={filterPlan} onChange={e=>setFilterPlan(e.target.value)}>
            <option value="">All plans</option>
            {PLANS.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <select className="select" style={{width:110}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All status</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <div style={{textAlign:"center",padding:40,color:"var(--text3)"}}>Loading...</div>
          : filtered.length===0 ? <EmptyState icon="ti-building" title="No firms" description="No firms registered yet. Share your signup link." />
          : (
          <div className="card" style={{padding:0}}>
            {filtered.map(firm => (
              <div key={firm.id} onClick={()=>openFirm(firm)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:selected?.id===firm.id?"var(--pl)":"transparent"}}>
                <div style={{width:32,height:32,borderRadius:8,background:"var(--pl)",color:"var(--pd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,flexShrink:0}}>
                  {firm.name.substring(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{firm.name}</div>
                  <div style={{fontSize:11,color:"var(--text2)"}}>{firm.email}</div>
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  <Badge color={planColor(firm.plan)}>{firm.plan}</Badge>
                  <Badge color={statusColor(firm.status)}>{firm.status}</Badge>
                </div>
                <div style={{width:50,flexShrink:0}}>
                  <div style={{fontSize:11,color:"var(--text2)",textAlign:"right"}}>H:{firm.health_score}</div>
                  <div className="prog-bar" style={{marginTop:3}}><div className="prog-fill pf-green" style={{width:firm.health_score+"%"}} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: firm detail panel */}
      {selected && selected !== "new" && (
        <div style={{width:360,flexShrink:0,overflow:"auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:600}}>{selected.name}</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setSelected(null)}><i className="ti ti-x" /></button>
          </div>

          {msg && <div style={{fontSize:11,padding:"6px 10px",borderRadius:6,background:msg.startsWith("✓")?"var(--gl)":"var(--bl)",color:msg.startsWith("✓")?"var(--gt)":"var(--bt)",marginBottom:10}}>{msg}</div>}

          <div className="card">
            <div className="card-title"><i className="ti ti-info-circle" />Firm details</div>
            <div className="row"><span style={{color:"var(--text2)",minWidth:80,fontSize:12}}>Email</span><span style={{fontSize:12}}>{selected.email}</span></div>
            <div className="row"><span style={{color:"var(--text2)",minWidth:80,fontSize:12}}>Joined</span><span style={{fontSize:12}}>{new Date(selected.created_at).toLocaleDateString()}</span></div>
            <div className="row"><span style={{color:"var(--text2)",minWidth:80,fontSize:12}}>Health</span><span style={{fontSize:12,fontWeight:500,color:"var(--p)"}}>{selected.health_score}/100</span></div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-credit-card" />Plan & status — change here</div>

            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:5}}>Plan</label>
              <select className="select" value={editForm.plan||""} onChange={e=>setEditForm(f=>({...f,plan:e.target.value}))}>
                {PLANS.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>

            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:5}}>Status</label>
              <select className="select" value={editForm.status||""} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>
                {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>

            {(editForm.plan==="trial"||selected.plan==="trial") && (
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:5}}>Trial end date</label>
                <input className="input" type="date" value={editForm.trial_ends_at||""} onChange={e=>setEditForm(f=>({...f,trial_ends_at:e.target.value}))} />
              </div>
            )}

            <button className="btn btn-primary btn-sm btn-full" onClick={saveFirm} disabled={saving} style={{marginBottom:8}}>
              {saving?"Saving...":"Save plan & status"}
            </button>

            <div style={{display:"flex",gap:6}}>
              <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>extendTrial(7)}>+7 days trial</button>
              <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>extendTrial(14)}>+14 days</button>
              <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>extendTrial(30)}>+30 days</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-bolt" />Quick actions</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditForm(f=>({...f,plan:"starter",status:"active"}))} style={{justifyContent:"flex-start"}}>
                <i className="ti ti-arrow-up-right" />Upgrade to Starter ($99/mo)
              </button>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditForm(f=>({...f,plan:"pro",status:"active"}))} style={{justifyContent:"flex-start"}}>
                <i className="ti ti-arrow-up-right" />Upgrade to Pro ($299/mo)
              </button>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditForm(f=>({...f,plan:"enterprise",status:"active"}))} style={{justifyContent:"flex-start"}}>
                <i className="ti ti-arrow-up-right" />Upgrade to Enterprise ($999/mo)
              </button>
              <div style={{borderTop:"1px solid var(--border)",paddingTop:7,marginTop:2}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setEditForm(f=>({...f,status:"paused"}))} style={{justifyContent:"flex-start",width:"100%"}}>
                  <i className="ti ti-pause" />Pause account
                </button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setEditForm(f=>({...f,status:"active"}))} style={{justifyContent:"flex-start",width:"100%",marginTop:5}}>
                  <i className="ti ti-player-play" />Reactivate account
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-send" />Send message to this firm</div>
            <textarea className="textarea" rows={3} placeholder="Type a message to send to this firm..." id={"firm-msg-"+selected.id} />
            <div style={{display:"flex",gap:7,marginTop:8}}>
              <button className="btn btn-primary btn-sm" onClick={async()=>{
                const ta=document.getElementById("firm-msg-"+selected.id);
                if(!ta.value.trim()) return;
                await post("/api/admin/broadcast",{platforms:["email"],message:ta.value,targetFirmId:selected.id});
                ta.value=""; setMsg("✓ Message sent to "+selected.name);
              }}>Send via email</button>
              <button className="btn btn-outline btn-sm">Send via dashboard</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-alert-triangle" style={{color:"var(--r)"}} />Danger zone</div>
            <button className="btn btn-danger btn-sm btn-full" onClick={()=>deleteFirm(selected.id,selected.name)}>
              <i className="ti ti-trash" />Delete firm & all data
            </button>
            <div style={{fontSize:11,color:"var(--text3)",marginTop:6,textAlign:"center"}}>This is permanent and cannot be undone.</div>
          </div>
        </div>
      )}

      {/* Add new firm panel */}
      {selected === "new" && (
        <div style={{width:360,flexShrink:0,overflow:"auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:600}}>Add new firm</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setSelected(null)}><i className="ti ti-x" /></button>
          </div>
          {msg && <div style={{fontSize:11,padding:"6px 10px",borderRadius:6,background:msg.startsWith("✓")?"var(--gl)":"var(--bl)",color:msg.startsWith("✓")?"var(--gt)":"var(--bt)",marginBottom:10}}>{msg}</div>}
          <div className="card">
            <div className="card-title"><i className="ti ti-building" />Firm details</div>
            <div style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:4}}>Firm name</label><input className="input" placeholder="e.g. FundingPip" value={editForm.name||""} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} /></div>
            <div style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:4}}>Email</label><input className="input" type="email" placeholder="admin@firm.com" value={editForm.email||""} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))} /></div>
            <div style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:4}}>Temporary password</label><input className="input" type="password" placeholder="They can change it later" value={editForm.password||""} onChange={e=>setEditForm(f=>({...f,password:e.target.value}))} /></div>
            <div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:4}}>Starting plan</label>
              <select className="select" value={editForm.plan||"trial"} onChange={e=>setEditForm(f=>({...f,plan:e.target.value}))}>
                {PLANS.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm btn-full" disabled={saving} onClick={async()=>{
              setSaving(true); setMsg("");
              try {
                const API = import.meta.env.VITE_API_URL||"";
                const token = localStorage.getItem("bp_token");
                const res = await fetch(API+"/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editForm)});
                const data = await res.json();
                if(!res.ok) throw new Error(data.error);
                if(editForm.plan!=="trial") {
                  await patch("/api/admin/firms/"+data.firm.id,{plan:editForm.plan,status:"active"});
                }
                setMsg("✓ Firm created successfully"); load();
              } catch(err){setMsg("Error: "+err.message);}
              finally{setSaving(false);}
            }}>{saving?"Creating...":"Create firm"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
