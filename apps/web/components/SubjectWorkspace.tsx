"use client";

export function SubjectWorkspace({ subject, passage, question }: { subject: string; passage?: any; question?: any }) {
  if (subject === "SCIENCE") {
    const rows = Array.isArray(question?.data?.dataset) ? question.data.dataset : [];
    return <div className="card" style={{ marginBottom: 16 }}><div className="badge">SCIENCE WORKSPACE</div><h3>Experiment / data</h3>{rows.length ? <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>{rows.map((row: any, index: number) => <tr key={index}>{Object.values(row).map((value: any, cell: number) => <td key={cell} style={{ borderBottom: "1px solid #eee", padding: 8 }}>{String(value)}</td>)}</tr>)}</tbody></table> : <div className="toolPanel">This question has no attached dataset yet. Add <code>data.dataset</code> in Admin CMS to present a shared table for linked questions.</div>}<p className="muted">Use the data table, identify variables, then test each answer against the evidence.</p></div>;
  }
  if (subject === "SOCIAL_STUDIES") return <div className="card" style={{ marginBottom: 16 }}><div className="badge">SOURCE VIEWER</div><h3>{passage?.title || "Historical source"}</h3><div className="passageText">{passage?.content || "Attach a document excerpt, map, political cartoon, or economic chart to this question in Admin CMS."}</div><p className="muted">Evaluate evidence, inference, source purpose, and author perspective before selecting an answer.</p></div>;
  return null;
}
