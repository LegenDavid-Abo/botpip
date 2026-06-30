
import React, { useState } from "react";

export default function PlaygroundSpeed() {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  function run() {
    setRunning(true); setResults(null);
    setTimeout(() => {
      setResults({ simple: 920, complex: 1430, calc: 1100 });
      setRunning(false);
    }, 1500);
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Speed test</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-bolt" />Typical response times</div>
        <div className="row"><span>Simple FAQ lookup</span><span style={{fontWeight:500,color:"var(--g)"}}>0.9s</span></div>
        <div className="row"><span>Complex multi-doc search</span><span style={{fontWeight:500,color:"var(--g)"}}>1.4s</span></div>
        <div className="row"><span>Calculator + answer</span><span style={{fontWeight:500,color:"var(--g)"}}>1.1s</span></div>
        <div className="row"><span>Screenshot reader</span><span style={{fontWeight:500,color:"var(--a)"}}>2.8s</span></div>
        <div className="row"><span>Voice transcription + reply</span><span style={{fontWeight:500,color:"var(--a)"}}>3.2s</span></div>
      </div>
      <button className="btn btn-primary" onClick={run} disabled={running}><i className="ti ti-player-play" />{running?"Running...":"Run live speed test"}</button>
      {results && (
        <div className="card" style={{marginTop:12}}>
          <div className="row"><span style={{minWidth:120}}>Simple lookup</span><div className="prog-bar" style={{flex:1}}><div className="prog-fill pf-green" style={{width:"30%"}} /></div><span style={{fontSize:12,fontWeight:500}}>{results.simple}ms</span></div>
          <div className="row"><span style={{minWidth:120}}>Complex search</span><div className="prog-bar" style={{flex:1}}><div className="prog-fill pf-green" style={{width:"47%"}} /></div><span style={{fontSize:12,fontWeight:500}}>{results.complex}ms</span></div>
          <div className="row"><span style={{minWidth:120}}>With calculator</span><div className="prog-bar" style={{flex:1}}><div className="prog-fill pf-green" style={{width:"36%"}} /></div><span style={{fontSize:12,fontWeight:500}}>{results.calc}ms</span></div>
        </div>
      )}
    </div>
  );
}
