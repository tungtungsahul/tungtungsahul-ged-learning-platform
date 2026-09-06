"use client";
import {useEffect,useState} from "react"; import {Shell} from "../../components/Shell"; import {api} from "../../lib/api";
export default function Analytics(){
 const [d,setD]=useState<any>(null); useEffect(()=>{api<any>("/skills/analytics").then(setD)},[]);
 if(!d)return <div className="content">Loading analytics…</div>;
 const max=Math.max(100,...d.topicGaps.map((x:any)=>x.misses));
 return <Shell><div className="topbar"><b>Progress & Knowledge Gaps</b></div><div className="content"><h1 className="title">Your learning map</h1><p className="subtitle">Use mistakes to decide what to study next.</p>
  <div className="grid grid4" style={{marginTop:20}}>{d.subjectScores.map((s:any)=><div className="card" key={s.subject}><div className="badge">{s.subject}</div><div className="kpi">{s.score}%</div><div className="progress"><div style={{width:`${s.score}%`}}/></div></div>)}</div>
  <div className="card" style={{marginTop:18}}><div className="section-title">Topic gaps</div>{d.topicGaps.length?d.topicGaps.map((t:any)=><div key={t.topic} style={{display:"grid",gridTemplateColumns:"180px 1fr 60px",gap:10,alignItems:"center",margin:"12px 0"}}><b>{t.topic}</b><div className="progress"><div style={{width:`${(t.misses/max)*100}%`}}/></div><span>{t.misses}</span></div>):<p className="muted">No mistake data yet.</p>}</div>
  <div className="card" style={{marginTop:18}}><div className="section-title">Adaptive plan</div>{d.adaptivePlan.map((p:any)=><div key={p.priority} style={{padding:"12px 0",borderBottom:"1px solid #eee"}}><b>Priority {p.priority}: {p.topic}</b><div className="muted">{p.activity}</div></div>)}</div>
 </div></Shell>
}
