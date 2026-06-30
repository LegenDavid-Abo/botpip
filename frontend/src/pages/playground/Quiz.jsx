
import React, { useState } from "react";
import { useApi } from "../../hooks/useApi.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function PlaygroundQuiz() {
  const { get } = useApi();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});

  async function runQuiz() {
    setLoading(true); setError("");
    try { const q = await get("/api/playground/quiz"); setQuiz(q); setAnswers({}); }
    catch(err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const score = quiz ? quiz.filter((q,i) => answers[i]===q.correct_index).length : 0;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Quiz mode</h1></div>
      <div className="card">
        <div className="card-title"><i className="ti ti-brain" />Bot quizzes itself on your rules</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:12,lineHeight:1.6}}>Quiz mode tests whether your bot actually knows your rules correctly. Catch mistakes before traders do.</div>
        {error && <div style={{fontSize:12,color:"var(--r)",marginBottom:10}}>{error}</div>}
        <button className="btn btn-primary btn-full" onClick={runQuiz} disabled={loading}>{loading?"Generating quiz...":"Run full quiz"}</button>
      </div>

      {quiz && quiz.length > 0 && (
        <div className="card">
          {quiz.map((q,i) => (
            <div key={i} style={{background:"var(--bg)",borderRadius:8,padding:10,marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:500,marginBottom:6}}>Q{i+1}: {q.question}</div>
              {q.options.map((opt,oi) => (
                <label key={oi} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 0",fontSize:12,cursor:"pointer"}}>
                  <input type="radio" name={"q"+i} checked={answers[i]===oi} onChange={()=>setAnswers(a=>({...a,[i]:oi}))} />
                  {opt} {answers[i]!==undefined && oi===q.correct_index && " ✓"}
                </label>
              ))}
            </div>
          ))}
          <div style={{fontSize:12,fontWeight:500,color:Object.keys(answers).length===quiz.length?(score===quiz.length?"var(--g)":"var(--a)"):"var(--text2)"}}>
            {Object.keys(answers).length===quiz.length ? `Bot scored ${score}/${quiz.length} ${score===quiz.length?"✅ — knowledge verified":"⚠️ — review needed"}` : "Answer all questions to see score"}
          </div>
        </div>
      )}

      {!quiz && !loading && <EmptyState icon="ti-brain" title="No quiz yet" description="Upload your knowledge base then click 'Run full quiz' above." />}
    </div>
  );
}
