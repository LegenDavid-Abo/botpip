
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function AdminCoupons() {
  const { get, post } = useApi();
  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState("percent_first");
  const [value, setValue] = useState("");
  const [expiry, setExpiry] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { get("/api/admin/coupons").then(setCoupons).catch(()=>{}); }, []);

  async function create() {
    if (!code || !value) return;
    setSaving(true);
    const c = await post("/api/admin/coupons", { code, discount_type:type, discount_value:+value, expires_at: expiry||null, max_uses: maxUses?+maxUses:null });
    setCoupons(cs=>[c,...cs]); setCode(""); setValue(""); setExpiry(""); setMaxUses(""); setSaving(false);
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Coupons & discounts</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-tag" />Create coupon</div>
        <div className="row"><span style={{flex:1}}>Code</span><input className="input" style={{width:160}} placeholder="LAUNCH50" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} /></div>
        <div className="row"><span style={{flex:1}}>Discount type</span>
          <select className="select" style={{width:180}} value={type} onChange={e=>setType(e.target.value)}>
            <option value="percent_first">% off first month</option><option value="percent_forever">% off forever</option><option value="fixed">Fixed $ off</option><option value="trial_extension">Free trial extension</option>
          </select>
        </div>
        <div className="row"><span style={{flex:1}}>Discount amount</span><input className="input" style={{width:80}} placeholder="50" value={value} onChange={e=>setValue(e.target.value)} /></div>
        <div className="row"><span style={{flex:1}}>Expiry date</span><input className="input" type="date" style={{width:160}} value={expiry} onChange={e=>setExpiry(e.target.value)} /></div>
        <div className="row"><span style={{flex:1}}>Max uses</span><input className="input" style={{width:100}} placeholder="100 or blank=unlimited" value={maxUses} onChange={e=>setMaxUses(e.target.value)} /></div>
        <button className="btn btn-primary btn-sm" style={{marginTop:10}} onClick={create} disabled={saving}>{saving?"Creating...":"Create coupon"}</button>
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-history" />Active coupons</div>
        {coupons.length===0 ? <div style={{fontSize:12,color:"var(--text3)",textAlign:"center",padding:16}}>No coupons yet.</div> : coupons.map(c => (
          <div key={c.id} className="row">
            <span style={{flex:1,fontWeight:500}}>{c.code}</span>
            <span style={{fontSize:11,color:"var(--text2)"}}>{c.discount_value}{c.discount_type.includes("percent")?"%":"$"} off</span>
            <span className="badge badge-green">{c.uses_count}/{c.max_uses||"∞"} used</span>
          </div>
        ))}
      </div>
    </div>
  );
}
