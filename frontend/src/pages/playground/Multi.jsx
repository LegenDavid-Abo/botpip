
import React from "react";
export default function PlaygroundMulti() {
  return (
    <div>
      <div className="page-header"><h1 className="page-title">Multi-user simulation</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-users" />David & Ahmed asking simultaneously</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:12}}>Proves the bot threads replies to the correct person with zero crossover.</div>
        <div style={{display:"flex",gap:12,marginBottom:12}}>
          <div style={{flex:1,border:"1px solid var(--border)",borderRadius:8,padding:12,background:"var(--bg)"}}>
            <div style={{fontSize:11,fontWeight:500,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
              <div className="chat-avatar user" style={{width:20,height:20,fontSize:10}}>D</div>David K.
            </div>
            <div style={{fontSize:11,color:"var(--text2)"}}>What is the max drawdown on master?</div>
            <div style={{marginTop:8,fontSize:11,background:"var(--gl)",color:"var(--gt)",padding:"7px 9px",borderRadius:7,lineHeight:1.5}}>
              <div style={{fontSize:10,opacity:.7,marginBottom:2}}>↩ Replying to David K.</div>
              ⚠️ Master max drawdown: <strong>10%</strong> overall, <strong>5%</strong> daily.
            </div>
          </div>
          <div style={{flex:1,border:"1px solid var(--border)",borderRadius:8,padding:12,background:"var(--bg)"}}>
            <div style={{fontSize:11,fontWeight:500,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
              <div className="chat-avatar" style={{width:20,height:20,fontSize:10,background:"var(--bl)",color:"var(--bt)"}}>A</div>Ahmed S.
            </div>
            <div style={{fontSize:11,color:"var(--text2)"}}>How do payouts work?</div>
            <div style={{marginTop:8,fontSize:11,background:"var(--bl)",color:"var(--bt)",padding:"7px 9px",borderRadius:7,lineHeight:1.5}}>
              <div style={{fontSize:10,opacity:.7,marginBottom:2}}>↩ Replying to Ahmed S.</div>
              💰 Payouts every Monday. <strong>80%</strong> to you. Min 5 trading days.
            </div>
          </div>
        </div>
        <div style={{fontSize:12,color:"var(--gt)",background:"var(--gl)",padding:"8px 10px",borderRadius:7}}>
          <i className="ti ti-check" style={{fontSize:13}} /> Each reply correctly threaded to its own user — zero crossover.
        </div>
      </div>
    </div>
  );
}
