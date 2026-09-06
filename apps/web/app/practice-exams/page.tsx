"use client";
import {useEffect,useState} from "react";
import {Shell} from "../../components/Shell";
import {api} from "../../lib/api";
export default function PracticeExams(){
 const [exams,setExams]=useState<any[]>([]); useEffect(()=>{api<any[]>("/exams").then(setExams)},[]);
 return <Shell><div className="topbar"><b>Practice Exams</b></div><div className="content"><h1 className="title">Practice center</h1><p className="subtitle">Full subjects, skill drills, and mixed mock exams.</p><div className="grid grid2" style={{marginTop:20}}>{exams.map(e=><div className="card" key={e.id}><div className="badge">{e.subject}</div><h2>{e.title}</h2><p className="muted">{e.description}</p><div style={{display:"flex",gap:8}}><span className="badge">{Math.round(e.durationSeconds/60)} min</span><span className="badge">{e.mode}</span></div><a className="btn btn-primary" style={{display:"inline-block",marginTop:14}} href={`/exams/${e.id}`}>Start</a></div>)}</div></div></Shell>
}
