"use client";
import { useEffect,useState } from "react";
import { Shell } from "../../components/Shell";
import { Chatbot } from "../../components/Chatbot";
import { api } from "../../lib/api";

export default function Dashboard(){
  const [data,setData]=useState<any>(null);
  useEffect(()=>{api<any>("/dashboard").then(setData)},[]);
  if(!data)return <div className="content">Loading dashboard…</div>;
  const band=(s:number)=>s>=175?"College credit simulation":s>=165?"College ready simulation":s>=145?"Passing simulation":"Below passing";
  return <Shell><div className="topbar"><b>Dashboard</b><span className="muted">Demo Learner</span></div><div className="content">
    <h1 className="title">Build your GED-ready skills.</h1><p className="subtitle">One place for subjects, language skills, practice exams and targeted review.</p>
    <div className="grid grid4" style={{marginTop:20}}>
      {data.currentPath.map((c:any)=><div className="card" key={c.id}><div className="badge">{c.subject}</div><h3>{c.title}</h3><div className="kpi">{c.progress}%</div><div className="progress"><div style={{width:`${c.progress}%`}}/></div><div className="muted" style={{marginTop:8}}>Course progress</div></div>)}
    </div>
    <div className="grid grid3" style={{marginTop:18}}>
      <div className="card"><div className="section-title">Next exam</div>{data.nextExams[0]?<><h3>{data.nextExams[0].label}</h3><div className="muted">{new Date(data.nextExams[0].scheduledAt).toLocaleString()}</div><a className="btn btn-primary" style={{display:"inline-block",marginTop:12}} href={`/exams/${data.nextExams[0].examId}`}>Open exam</a></>:<div className="muted">No scheduled exam.</div>}</div>
      <div className="card"><div className="section-title">Mistake Bank</div><div className="kpi">{data.mistakeCount}</div><div className="muted">questions waiting for review</div><a className="btn btn-soft" style={{display:"inline-block",marginTop:12}} href="/mistakes">Review mistakes</a></div>
      <div className="card"><div className="section-title">GED scale guide</div><div style={{display:"grid",gap:7}}><div>145–164 · Passing simulation</div><div>165–174 · College ready simulation</div><div>175–200 · College credit simulation</div></div></div>
    </div>
    <div className="card" style={{marginTop:18}}><div className="section-title">Adaptive learning plan</div><div className="grid grid3"><div><b>1. Targeted 10-minute drills</b><p className="muted">Generated around your weakest topics.</p></div><div><b>2. Flashcards</b><p className="muted">Review key terms before practice.</p></div><div><b>3. Mixed mini-test</b><p className="muted">Retest the topic after review.</p></div></div></div>
    <Chatbot/>
  </div></Shell>;
}
