"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Brain, ClipboardList, GraduationCap, LayoutDashboard, Library, Mic, PenLine, Settings, Sparkles } from "lucide-react";

const items = [
  ["/dashboard","Dashboard",LayoutDashboard],
  ["/courses","My Courses",BookOpen],
  ["/practice-exams","Practice Exams",ClipboardList],
  ["/skills/reading","Reading",BookOpen],
  ["/skills/writing","Writing",PenLine],
  ["/skills/listening","Listening",Library],
  ["/skills/speaking","Speaking",Mic],
  ["/resources","Resources",GraduationCap],
  ["/analytics","Progress & Gaps",Brain],
  ["/mistakes","Mistake Bank",Library],
  ["/admin","Admin CMS",Settings]
];

export function Shell({children}:{children:React.ReactNode}) {
  const path=usePathname();
  return <div className="shell">
    <aside className="sidebar">
      <div style={{display:"flex",gap:10,alignItems:"center",fontWeight:900,fontSize:21,marginBottom:22}}><Sparkles size={22}/> GED Academy</div>
      <div className="subtitle" style={{marginBottom:10}}>Comprehensive practice platform</div>
      <nav style={{display:"grid",gap:4}}>
        {items.map(([href,label,Icon]: any) => <Link className={`navitem ${path?.startsWith(String(href))?"active":""}`} href={String(href)} key={String(href)}><Icon size={17}/>{String(label)}</Link>)}
      </nav>
      <div style={{marginTop:24,paddingTop:18,borderTop:"1px solid #eee"}} className="muted">
        <div style={{fontWeight:800,color:"#344054"}}>No-login demo mode</div>
        <small>Local learner profile</small>
      </div>
    </aside>
    <main className="main">{children}</main>
  </div>
}
