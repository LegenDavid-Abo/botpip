
import React, { useState, useRef, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";

export default function PlaygroundInterview() {
  const { get, post } = useApi();
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const boxRef = useRef();

  useEffect(() => {
    get("/api/playground/interview/questions").then(qs => {
      setQuestions(qs);
      setHistory([{role:"bot",content:`Question 1 of ${qs.length}: ${qs[0]}`}]);
    }).catch(()=>{});
  }, []);

  async function submitAnswer() {
    if (!input.trim()) return;
    const newAnswers = [...answers, input];
    setHistory(h=>[...h,{role:"user",content:input}]);
    setAnswers(newAnswers); setInput("");

    const result = await post("/api/playground/interview", { questionIndex: qIndex, answer: input, previousAnswers: answers });

    if (result.done) {
      setDone(true);
      setHistory(h=>[...h,{role:"bot",content:"All questions answered! Building your knowledge base now — about 30 seconds. ✅"}]);
    } else {
      setQIndex(result.nextIndex);
      setHistory(h=>[...h,{role:"bot",content:`Question ${result.nextIndex+1} of ${questions.length}: ${result.nextQuestion}`}]);
    }
    setTimeout(()=>boxRef.current?.scrollTo(0,9999),50);
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">AI interviewer</h1></div>
      <div className="card">
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:10,lineHeight:1.6}}>No PDF? Answer 12 questions and the bot builds your full knowledge base. Conflicts auto-detected.</div>
        <div className="chat-box" style={{height:200}} ref={boxRef}>
          {history.map((m,i) => (
            <div key={i} className={"chat-msg "+(m.role==="user"?"user":"")}>
              <div className={"chat-avatar "+(m.role==="user"?"user":"bot")}>{m.role==="user"?"Y":"AI"}</div>
              <div className={"chat-bubble "+(m.role==="user"?"user":"bot")}>{m.content}</div>
            </div>
          ))}
        </div>
        {!done && (
          <div style={{display:"flex",gap:8}}>
            <input className="input" placeholder="Type your answer..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitAnswer()} style={{flex:1}} />
            <button className="btn btn-primary" onClick={submitAnswer}>Answer</button>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-title"><i className="ti ti-alert-triangle" />Conflict detector</div>
        <div style={{fontSize:12,color:"var(--text2)"}}>Scans your answers against any uploaded docs for contradictions. No conflicts yet.</div>
      </div>
    </div>
  );
}
