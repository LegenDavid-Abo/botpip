
import React, { useState } from "react";

export default function AdminROI() {
  const [agents, setAgents] = useState(3);
  const [salary, setSalary] = useState(3000);
  const [pct, setPct] = useState(80);
  const [plan, setPlan] = useState(299);

  const cost = agents*salary;
  const save = Math.round(cost*(pct/100));
  const net = save - plan;
  const roi = Math.round((net/plan)*100);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">ROI calculator</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-calculator" />Show firms what they save</div>
        <div className="row"><div className="row-label"><div className="lbl">Support agents</div></div><div className="slider-row" style={{width:180}}><input type="range" min={1} max={12} value={agents} onChange={e=>setAgents(+e.target.value)} /><span className="slider-value">{agents}</span></div></div>
        <div className="row"><div className="row-label"><div className="lbl">Agent salary ($/mo)</div></div><div className="slider-row" style={{width:180}}><input type="range" min={1000} max={8000} step={500} value={salary} onChange={e=>setSalary(+e.target.value)} /><span className="slider-value">${salary}</span></div></div>
        <div className="row"><div className="row-label"><div className="lbl">% AI can handle</div></div><div className="slider-row" style={{width:180}}><input type="range" min={50} max={95} step={5} value={pct} onChange={e=>setPct(+e.target.value)} /><span className="slider-value">{pct}%</span></div></div>
        <div className="row"><div className="row-label"><div className="lbl">Your plan price</div></div><div className="slider-row" style={{width:180}}><input type="range" min={99} max={999} step={100} value={plan} onChange={e=>setPlan(+e.target.value)} /><span className="slider-value">${plan}</span></div></div>
      </div>
      <div className="two-col">
        <div className="roi-box"><div className="roi-label">Their monthly cost</div><div className="roi-value">${cost.toLocaleString()}</div></div>
        <div className="roi-box"><div className="roi-label">AI saves</div><div className="roi-value">${save.toLocaleString()}</div></div>
        <div className="roi-box"><div className="roi-label">Net saving</div><div className="roi-value">${Math.max(0,net).toLocaleString()}</div></div>
        <div className="roi-box"><div className="roi-label">ROI</div><div className="roi-value">{Math.max(0,roi).toLocaleString()}%</div></div>
      </div>
    </div>
  );
}
