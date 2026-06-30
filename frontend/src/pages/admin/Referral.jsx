
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function AdminReferral() {
  const { get, post } = useApi();
  const [affiliates, setAffiliates] = useState([]);
  const [rate, setRate] = useState(20);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => { get("/api/admin/affiliates").then(setAffiliates).catch(()=>{}); }, []);

  async function addAffiliate() {
    if (!name || !email) return;
    const a = await post("/api/admin/affiliates", { name, email, commission_rate: rate });
    setAffiliates(as=>[a,...as]); setName(""); setEmail("");
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Referral & affiliates</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-settings" />Program settings</div>
        <div className="row"><div className="row-label"><div className="lbl">Commission rate</div></div>
          <div className="slider-row" style={{width:160}}>
            <input type="range" min={5} max={40} step={5} value={rate} onChange={e=>setRate(+e.target.value)} />
            <span className="slider-value">{rate}%</span>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-plus" />Add affiliate</div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={addAffiliate}>Add affiliate</button>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-users" />Affiliates</div>
        {affiliates.length===0 ? <EmptyState icon="ti-gift" title="No affiliates yet" description="Add affiliates above to start tracking referrals." />
          : affiliates.map(a => (
            <div key={a.id} className="row">
              <span style={{flex:1,fontWeight:500}}>{a.name}</span>
              <span style={{fontSize:11,color:"var(--text2)"}}>Code: {a.referral_code}</span>
              <span className="badge badge-green">${a.total_earned} earned</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
