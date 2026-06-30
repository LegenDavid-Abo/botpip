
import React, { useState } from "react";

export default function AdminForecast() {
  const [starter, setStarter] = useState(5);
  const [pro, setPro] = useState(10);
  const [ent, setEnt] = useState(3);
  const [churn, setChurn] = useState(5);

  const monthly = starter*99 + pro*299 + ent*999;
  const afterChurn = Math.round(monthly * (1 - churn/100));

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Revenue forecast</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-adjustments" />Scenario builder</div>
        <div className="row"><div className="row-label"><div className="lbl">Starter firms</div></div><div className="slider-row" style={{width:180}}><input type="range" min={0} max={30} value={starter} onChange={e=>setStarter(+e.target.value)} /><span className="slider-value">{starter}</span></div></div>
        <div className="row"><div className="row-label"><div className="lbl">Pro firms</div></div><div className="slider-row" style={{width:180}}><input type="range" min={0} max={30} value={pro} onChange={e=>setPro(+e.target.value)} /><span className="slider-value">{pro}</span></div></div>
        <div className="row"><div className="row-label"><div className="lbl">Enterprise firms</div></div><div className="slider-row" style={{width:180}}><input type="range" min={0} max={20} value={ent} onChange={e=>setEnt(+e.target.value)} /><span className="slider-value">{ent}</span></div></div>
        <div className="row"><div className="row-label"><div className="lbl">Churn rate %/month</div></div><div className="slider-row" style={{width:180}}><input type="range" min={0} max={20} value={churn} onChange={e=>setChurn(+e.target.value)} /><span className="slider-value">{churn}%</span></div></div>
      </div>
      <div className="two-col">
        <div className="roi-box"><div className="roi-label">Monthly revenue</div><div className="roi-value">${monthly.toLocaleString()}</div></div>
        <div className="roi-box"><div className="roi-label">Annual revenue</div><div className="roi-value">${(monthly*12).toLocaleString()}</div></div>
        <div className="roi-box"><div className="roi-label">Total firms</div><div className="roi-value">{starter+pro+ent}</div></div>
        <div className="roi-box"><div className="roi-label">After churn</div><div className="roi-value">${afterChurn.toLocaleString()}</div></div>
      </div>
    </div>
  );
}
