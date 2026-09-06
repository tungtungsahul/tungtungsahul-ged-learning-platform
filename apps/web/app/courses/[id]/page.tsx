"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {Shell} from "../../../components/Shell";

import {api} from "../../../lib/api";
export default function Course(){
  const {id}=useParams<{id:string}>(); const [c,setC]=useState<any>(null);
  useEffect(()=>{api<any>(`/courses/${id}`).then(setC)},[id]); if(!c)return <div className="content">Loading…</div>;
  return <Shell><div className="topbar"><b>{c.title}</b></div><div className="content"><h1 className="title">{c.title}</h1><p className="subtitle">{c.description}</p>
    <div className="card" style={{marginTop:18}}><div className="section-title">Modules</div>{c.modules.map((m:any)=><div key={m.id} style={{padding:"14px 0",borderBottom:"1px solid #eee"}}><b>{m.title}</b>{m.lessons.map((l:any)=><div key={l.id} style={{padding:"9px 0 0 12px"}}>• {l.title}</div>)}</div>)}</div>
    <div className="card" style={{marginTop:18}}><div className="section-title">Practice exams</div>{c.exams.map((e:any)=><div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"12px 0",borderBottom:"1px solid #eee"}}><div><b>{e.title}</b><div className="muted">{Math.round(e.durationSeconds/60)} minutes</div></div><a className="btn btn-primary" href={`/exams/${e.id}`}>Open</a></div>)}</div>
  </div></Shell>
}
