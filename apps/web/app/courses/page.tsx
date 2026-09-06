"use client";
import {useEffect,useState} from "react";
import {Shell} from "../../components/Shell";
import {api} from "../../lib/api";

export default function Courses(){
  const [courses,setCourses]=useState<any[]>([]);
  useEffect(()=>{api<any[]>("/courses").then(setCourses)},[]);
  return <Shell><div className="topbar"><b>My Courses</b></div><div className="content">
    <h1 className="title">Four GED subjects</h1><p className="subtitle">Study by subject or jump straight into targeted practice.</p>
    <div className="grid grid2" style={{marginTop:20}}>{courses.map(c=><div className="card" key={c.id}>
      <span className="badge">{c.subject}</span><h2>{c.title}</h2><p className="muted">{c.description}</p>
      <div style={{fontWeight:900}}>{c.progress}% complete</div><div className="progress"><div style={{width:`${c.progress}%`}}/></div>
      <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}><a className="btn btn-primary" href={`/courses/${c.id}`}>Open course</a>{c.exams?.[0]&&<a className="btn btn-soft" href={`/exams/${c.exams[0].id}`}>Practice</a>}</div>
    </div>)}</div>
  </div></Shell>;
}
