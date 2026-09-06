"use client";
import {useEffect,useState} from "react";import {Shell} from "../../components/Shell";import {api} from "../../lib/api";
export default function Admin(){
 const [exams,setExams]=useState<any[]>([]);const [raw,setRaw]=useState('[{"examId":"exam-rla-detailed","text":"New question?","type":"MULTIPLE_CHOICE","topic":"Imported","difficulty":"EASY","order":99,"explanation":"Imported explanation","data":{}}]');const [msg,setMsg]=useState("");
 useEffect(()=>{api<any[]>("/exams").then(setExams)},[]);
 async function imp(){try{const r=await api<any>("/admin/import/questions",{method:"POST",body:JSON.stringify({questions:JSON.parse(raw)})});setMsg(`Imported ${r.created} question(s). Refresh the exam.`)}catch(e:any){setMsg(e.message)}}
 return <Shell><div className="topbar"><b>Admin CMS</b></div><div className="content"><h1 className="title">Create & import content</h1><p className="subtitle">V1 final CMS foundation for authoring and bulk import.</p>
   <div className="card" style={{marginTop:18}}><div className="section-title">Existing exams</div>{exams.map(e=><div key={e.id} style={{padding:"10px 0",borderBottom:"1px solid #eee"}}><b>{e.title}</b> · {e.subject} · {Math.round(e.durationSeconds/60)} min</div>)}</div>
   <div className="card" style={{marginTop:18}}><div className="section-title">Bulk question import — JSON</div><textarea value={raw} onChange={e=>setRaw(e.target.value)} rows={10} style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:10,fontFamily:"monospace"}}/><button className="btn btn-primary" onClick={imp} style={{marginTop:10}}>Import</button><p className="muted">{msg}</p></div>
   <div className="card" style={{marginTop:18}}><div className="section-title">Planned authoring capabilities</div><div className="grid grid3"><div>LaTeX / KaTeX question data</div><div>Image/audio asset fields</div><div>PDF/Word extraction pipeline</div></div></div>
 </div></Shell>
}
