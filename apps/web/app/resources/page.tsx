"use client";
import {useEffect,useState} from "react";import {Shell} from "../../components/Shell";import {api} from "../../lib/api";
export default function Resources(){
 const [cards,setCards]=useState<any[]>([]);const[open,setOpen]=useState<Record<string,boolean>>({});useEffect(()=>{api<any[]>("/skills/flashcards").then(setCards)},[]);
 return <Shell><div className="topbar"><b>Resources</b></div><div className="content"><h1 className="title">Vocabulary & tools</h1><p className="subtitle">Practice key academic language before an exam.</p><div className="toolPanel" style={{marginTop:18}}><b>H5P Interactive Flashcards</b><p className="muted">This V1-ready block is designed for H5P content. Use the flashcards below now; a future H5P package can replace the renderer.</p></div><div className="grid grid3" style={{marginTop:18}}>{cards.map(c=><div className="card" key={c.id} onClick={()=>setOpen(x=>({...x,[c.id]:!x[c.id]}))}><div className="badge">{c.tags.join(" · ")}</div><h3>{c.front}</h3><p className="muted">{open[c.id]?c.back:"Click to reveal definition."}</p></div>)}</div>
 </div></Shell>
}
