"use client";
import { useState } from "react";
import { api } from "../lib/api";

export function Chatbot({context}:{context?:Record<string,unknown>}) {
  const [open,setOpen]=useState(false);
  const [message,setMessage]=useState("");
  const [messages,setMessages]=useState<{role:"user"|"ai",text:string}[]>([
    {role:"ai",text:"Hi! I’m GED AI Tutor. Ask about vocabulary, concepts, or how to reason through a problem."}
  ]);
  const [busy,setBusy]=useState(false);
  const [conversationId,setConversationId]=useState<string>();

  async function send(){
    if(!message.trim()||busy)return;
    const text=message.trim(); setMessage(""); setMessages(m=>[...m,{role:"user",text}]); setBusy(true);
    try{
      const r=await api<{reply:string,conversationId:string}>("/tutor/chat",{method:"POST",body:JSON.stringify({message:text,context,conversationId})});
      setConversationId(r.conversationId);
      setMessages(m=>[...m,{role:"ai",text:r.reply}]);
    }catch{setMessages(m=>[...m,{role:"ai",text:"I couldn't reach the tutor service. Please try again."}]);}
    finally{setBusy(false);}
  }

  if(!open) return <button className="btn btn-primary" onClick={()=>setOpen(true)} style={{position:"fixed",right:22,bottom:22,zIndex:20,borderRadius:999,padding:"14px 18px"}}>✨ GED AI Tutor</button>;
  return <div className="chat">
    <div className="chatHead"><div><b>GED AI Tutor</b><div style={{fontSize:11,opacity:.8}}>Context-aware learning help</div></div><button className="btn" style={{background:"transparent",color:"#fff"}} onClick={()=>setOpen(false)}>×</button></div>
    <div className="chatBody">
      {messages.map((m,i)=><div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}
      {busy&&<div className="bubble ai">Thinking…</div>}
    </div>
    <div className="chatInput"><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about a word or concept…"/><button className="btn btn-primary" onClick={send}>Send</button></div>
  </div>
}
