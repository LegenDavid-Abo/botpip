
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await adminLogin(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><i className="ti ti-shield-half-filled" style={{color:"var(--p)"}} />Bot<span className="accent">Pip</span> Admin</div>
        <h2 style={{fontSize:16,fontWeight:600,marginBottom:4,textAlign:"center"}}>Platform admin</h2>
        <p style={{fontSize:12,color:"var(--text2)",textAlign:"center",marginBottom:20}}>Super admin access only</p>
        {error && <div style={{background:"var(--rl)",color:"var(--rt)",padding:"9px 12px",borderRadius:7,fontSize:12,marginBottom:12}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin email</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in as admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
