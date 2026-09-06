const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export async function api<T>(path:string, init:RequestInit={}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {"Content-Type":"application/json", ...(init.headers||{})},
    cache:"no-store"
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.message || "API request failed");
  return data as T;
}
