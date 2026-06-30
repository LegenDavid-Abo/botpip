
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const [form, setForm] = useState({name:"",email:"",password:""});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { firmSignup } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await firmSignup(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><i className="ti ti-robot" style={{color:"var(--p)"}} />Bot<span className="accent">Pip</span></div>
        <h2 style={{fontSize:16,fontWeight:600,marginBottom:4,textAlign:"center"}}>Start your free trial</h2>
        <p style={{fontSize:12,color:"var(--text2)",textAlign:"center",marginBottom:20}}>14 days free. No card required to start.</p>
        {error && <div style={{background:"var(--rl)",color:"var(--rt)",padding:"9px 12px",borderRadius:7,fontSize:12,marginBottom:12}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Firm name</label>
            <input className="input" value={form.name} onChange={set("name")} placeholder="e.g. FundingPip" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set("email")} placeholder="you@yourfirm.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" minLength={8} required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{marginTop:4}}>
            {loading ? "Creating account..." : "Create account & start trial →"}
          </button>
        </form>
        <div className="form-divider">already have an account?</div>
        <div style={{textAlign:"center",fontSize:12}}><Link to="/login">Sign in</Link></div>
      </div>
    </div>
  );
}
