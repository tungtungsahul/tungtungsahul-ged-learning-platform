"use client";
import {useEffect,useState} from "react"; import {useParams,useSearchParams,useRouter} from "next/navigation"; import {Shell} from "../../../../components/Shell"; import {api} from "../../../../lib/api";
export default function Result(){
 const {examId}=useParams<{examId:string}>(); const params=useSearchParams(); const router=useRouter(); const [r,setR]=useState<any>(null);
 useEffect(()=>{const id=params.get("attemptId");if(id)api<any>(`/exams/${examId}/attempts/${id}/result`).then(setR)},[examId,params]);
 if(!r)return <div className="content">Loading result…</div>;
 const band=r.scoreBand || (r.gedScore>=175?"175–200":r.gedScore>=165?"165–174":r.gedScore>=145?"145–164":"Below 145");
 return <Shell><div className="topbar"><b>Exam Result</b></div><div className="content"><button className="btn btn-soft" onClick={()=>router.push("/dashboard")}>← Dashboard</button>
  <div className="card" style={{marginTop:16}}><div className="badge">{band}</div><div className="muted" style={{marginTop:10}}>{r.scoreLabel || "Simulated GED Practice Score"}</div><h1 className="title" style={{marginTop:4}}>{r.gedScore}/200</h1><p className="subtitle">Raw performance: {r.percentage}% · {r.passed?"PASSED":"NOT PASSED"}</p>
   <div className="grid grid4" style={{marginTop:16}}><div><div className="kpi">{r.correctAnswers}</div><div className="muted">Correct</div></div><div><div className="kpi">{r.incorrectAnswers}</div><div className="muted">Incorrect</div></div><div><div className="kpi">{r.unanswered}</div><div className="muted">Unanswered</div></div><div><div className="kpi">{Math.floor(r.timeUsedSeconds/60)}m</div><div className="muted">Time used</div></div></div>
  </div>
  <div style={{marginTop:18}}>{r.questions.map((q:any)=><div className="card" style={{marginBottom:12}} key={q.id}><div className="badge">{q.topic}</div><h3>{q.order}. {q.text}</h3><div>Your answer: <b>{typeof q.studentAnswer==="string"?q.studentAnswer:q.studentAnswer?`${q.studentAnswer.label}. ${q.studentAnswer.text}`:"Unanswered"}</b></div><div style={{marginTop:5}}>Correct: <b>{q.correctAnswer?.label?`${q.correctAnswer.label}. ${q.correctAnswer.text}`:q.correctAnswer}</b></div><p className="muted">{q.explanation}</p></div>)}</div>
 </div></Shell>
}
