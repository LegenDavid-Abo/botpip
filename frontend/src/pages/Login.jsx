
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { firmLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await firmLogin(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><i className="ti ti-robot" style={{color:"var(--p)"}} />Bot<span className="accent">Pip</span></div>
        <h2 style={{fontSize:16,fontWeight:600,marginBottom:4,textAlign:"center"}}>Sign in</h2>
        <p style={{fontSize:12,color:"var(--text2)",textAlign:"center",marginBottom:20}}>AI support platform for prop trading firms</p>
        {error && <div style={{background:"var(--rl)",color:"var(--rt)",padding:"9px 12px",borderRadius:7,fontSize:12,marginBottom:12}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@yourfirm.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{marginTop:4}}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="form-divider">or</div>
        <div style={{textAlign:"center",fontSize:12}}>
          <span style={{color:"var(--text2)"}}>No account? </span><Link to="/signup">Start free trial</Link>
        </div>
        <div style={{textAlign:"center",marginTop:10,fontSize:11}}>
          <Link to="/admin/login" style={{color:"var(--text3)"}}>Platform admin login →</Link>
        </div>
      </div>
    </div>
  );
}
