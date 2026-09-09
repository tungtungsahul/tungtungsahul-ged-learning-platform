"use client";
import { useState } from "react";

function calculate(expression: string) {
  const normalized = expression.replace(/×/g, "*").replace(/÷/g, "/").replace(/√/g, "Math.sqrt").replace(/\^/g, "**").replace(/\bsin\(/g, "Math.sin(").replace(/\bcos\(/g, "Math.cos(").replace(/\btan\(/g, "Math.tan(");
  if (!/^[0-9+\-*/().,\sA-Za-z*]+$/.test(normalized) || /Math\.(?!sqrt|sin|cos|tan)/.test(normalized)) throw new Error("Invalid expression");
  // The whitelist above limits the expression to numeric operators and four Math functions.
  const result = Function(`"use strict"; return (${normalized})`)();
  if (typeof result !== "number" || !Number.isFinite(result)) throw new Error("Invalid result");
  return String(Math.round(result * 1e10) / 1e10);
}

export function MathTools() {
  const [value, setValue] = useState(""), [error, setError] = useState("");
  const press = (key: string) => { if (key === "=") { try { setValue(calculate(value)); setError(""); } catch { setError("Check the expression."); } } else if (key === "C") { setValue(""); setError(""); } else setValue(x => x + key); };
  return <div className="card" style={{ marginTop: 18 }}><div className="section-title">Scientific calculator</div><input aria-label="Calculator display" value={value} onChange={e => setValue(e.target.value)} inputMode="decimal" style={{ width: "100%", boxSizing: "border-box", padding: 12, fontSize: 20, textAlign: "right" }} />
    <div className="grid grid4" style={{ marginTop: 8 }}>{["sin(", "cos(", "tan(", "√(", "7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+", "(", ")", "^", "C"].map(key => <button className="btn btn-soft" key={key} onClick={() => press(key)}>{key}</button>)}</div>{error && <div className="muted" style={{ marginTop: 8 }}>{error}</div>}
    <details style={{ marginTop: 14 }}><summary><b>Formula sheet</b></summary><div className="muted" style={{ display: "grid", gap: 5, marginTop: 8 }}>Rectangle: A = lw<br />Triangle: A = ½bh<br />Circle: A = πr²<br />Volume: V = lwh<br />Pythagorean theorem: a² + b² = c²<br />Slope: (y₂ − y₁)/(x₂ − x₁)<br />Distance: √((x₂ − x₁)² + (y₂ − y₁)²)</div></details>
  </div>;
}
