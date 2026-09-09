const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const LEARNER_ID_KEY = "ged.anonymousLearnerId";

/** A stable, browser-local identity. It is deliberately not an account or login. */
export function anonymousLearnerId() {
  if (typeof window === "undefined") return undefined;
  const existing = window.localStorage.getItem(LEARNER_ID_KEY);
  if (existing) return existing;

  const id = `anon_${crypto.randomUUID()}`;
  window.localStorage.setItem(LEARNER_ID_KEY, id);
  return id;
}

export async function api<T>(path:string, init:RequestInit={}) {
  const learnerId = anonymousLearnerId();
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {...(isFormData ? {} : {"Content-Type":"application/json"}), ...(learnerId ? {"X-Learner-Id": learnerId} : {}), ...(init.headers||{})},
    cache:"no-store"
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.message || "API request failed");
  return data as T;
}
