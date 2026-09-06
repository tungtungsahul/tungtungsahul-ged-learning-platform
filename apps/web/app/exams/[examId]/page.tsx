"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {api} from "../../../lib/api";
import {Chatbot} from "../../../components/Chatbot";

function fmt(s:number){s=Math.max(0,s);return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}

export default function Exam(){
 const {examId}=useParams<{examId:string}>(); const router=useRouter();
 const [a,setA]=useState<any>(null); const [i,setI]=useState(0); const [answers,setAnswers]=useState<Record<string,any>>({}); const [remaining,setRemaining]=useState(0); const [mode,setMode]=useState<"passage"|"question">("question"); const [hl,setHl]=useState(false); const [eliminated,setEliminated]=useState<Record<string,boolean>>({}); const [msg,setMsg]=useState("");
 useEffect(()=>{api<any>(`/exams/${examId}/start`,{method:"POST"}).then(x=>{setA(x);setRemaining(Math.max(0,Math.floor((new Date(x.expiresAt).getTime()-Date.now())/1000)));const m:any={};x.answers?.forEach((z:any)=>m[z.questionId]=z.selectedOptionId||z.textValue||z.payload);setAnswers(m)})},[examId]);
 useEffect(()=>{if(!a)return;const id=setInterval(()=>{const r=Math.max(0,Math.floor((new Date(a.expiresAt).getTime()-Date.now())/1000));setRemaining(r);if(r===0){clearInterval(id);submit()}},1000);return()=>clearInterval(id)},[a]);
 const q=a?.exam?.questions?.[i];
 const passage=a?.exam?.passages?.find((p:any)=>p.id===q?.passageId)||a?.exam?.passages?.[0];
 const answered=useMemo(()=>Object.keys(answers).length,[answers]);
 async function save(value:any){if(!a||!q)return;setAnswers(x=>({...x,[q.id]:value}));try{if(q.type==="MULTIPLE_CHOICE"||q.type==="DROPDOWN"||q.type==="TRUE_FALSE")await api(`/exams/${examId}/attempts/${a.id}/answers`,{method:"POST",body:JSON.stringify({questionId:q.id,selectedOptionId:value})});else await api(`/exams/${examId}/attempts/${a.id}/answers`,{method:"POST",body:JSON.stringify({questionId:q.id,textValue:String(value??"")})});setMsg("✓ Saved")}catch(e:any){setMsg(e.message)}}
 async function submit(){if(!a)return;const r=await api<any>(`/exams/${examId}/attempts/${a.id}/submit`,{method:"POST"});router.push(`/exams/${examId}/result?attemptId=${a.id}`)}
 if(!a||!q)return <div style={{padding:30}}>Loading exam…</div>;
 return <div className="examShell">
  <div className="examTop"><div><b>{a.exam.title}</b><div className="muted">{answered}/{a.exam.questions.length} answered · {msg}</div></div><div style={{display:"flex",gap:8,alignItems:"center"}}><button className="btn btn-muted" onClick={()=>setMode(mode==="passage"?"question":"passage")}>{mode==="passage"?"Question":"Passage"}</button><div className={`examTimer ${remaining<=300?"warn":""}`}>Timer {fmt(remaining)}</div></div></div>
  <div className="examBody">
   <section className="passagePane" style={{display:mode==="question"?"block":undefined}}>
     <div className="toolbar"><button className="btn btn-soft" onClick={()=>setHl(!hl)}>{hl?"Highlight on":"Highlight"}</button><button className="btn btn-muted" onClick={()=>setEliminated({})}>Clear eliminations</button><button className="btn btn-muted" onClick={()=>window.getSelection()?.removeAllRanges()}>Clear selection</button></div>
     <div style={{maxWidth:760,margin:"16px auto"}}><div className="badge">READING PASSAGE</div><h1>{passage?.title}</h1><div className="passageText" onMouseUp={()=>hl&&document.execCommand("backColor",false,"#fff2a8")}>{passage?.content}</div></div>
   </section>
   <section className="questionPane" style={{display:mode==="passage"?"none":undefined}}>
    <div style={{maxWidth:720,margin:"auto"}}><div className="badge">Question {i+1} of {a.exam.questions.length} · {q.topic}</div><h2 style={{fontSize:26,lineHeight:1.4}}>{q.text}</h2>
      {(q.type==="MULTIPLE_CHOICE"||q.type==="DROPDOWN"||q.type==="TRUE_FALSE")&&q.options?.map((o:any)=><button key={o.id} className={`option ${answers[q.id]===o.id?"sel":""}`} onClick={()=>save(o.id)} style={{opacity:eliminated[o.id] ? .35:1}}><span className="optlabel">{o.label}</span><span>{o.text}</span><button onClick={(e)=>{e.stopPropagation();setEliminated(x=>({...x,[o.id]:!x[o.id]}))}} className="btn btn-muted" style={{marginLeft:"auto",padding:"6px 8px"}}>✕</button></button>)}
      {q.type==="FILL_BLANK"&&<div style={{display:"flex",gap:8}}><input autoComplete="off" spellCheck={false} value={answers[q.id]||""} onChange={e=>setAnswers(x=>({...x,[q.id]:e.target.value}))} onBlur={()=>save(answers[q.id]||"")} placeholder="Type your answer" style={{flex:1,padding:12,border:"1px solid #ddd",borderRadius:10}}/><button className="btn btn-primary" onClick={()=>save(answers[q.id]||"")}>Save</button></div>}
      {q.type==="DRAG_DROP"&&<div className="toolPanel"><b>Drag & drop</b><p className="muted">This V1-compatible interaction shell stores a payload. Add item coordinates/content in question data for production authoring.</p><button className="btn btn-soft" onClick={()=>save(JSON.stringify(["A","B","C"]))}>Use sample order</button></div>}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:24}}><button className="btn btn-muted" disabled={i===0} onClick={()=>setI(x=>x-1)}>Previous</button>{i<a.exam.questions.length-1?<button className="btn btn-primary" onClick={()=>setI(x=>x+1)}>Next</button>:<button className="btn btn-primary" onClick={submit}>Submit Exam</button>}</div>
      <div className="card" style={{marginTop:18}}><b>Question navigation</b><div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10}}>{a.exam.questions.map((qq:any,n:number)=><button key={qq.id} className="btn" style={{background:n===i?"#4f46e5":answers[qq.id]?"#e7f6ec":"#f2f4f7",color:n===i?"#fff":"#172033"}} onClick={()=>setI(n)}>{n+1}</button>)}</div></div>
    </div>
   </section>
  </div>
  <Chatbot context={{subject:a.exam.subject,examId:examId,attemptId:a.id,question:q.text,passage:passage?.content,questionNumber:i+1}}/>
 </div>
}
