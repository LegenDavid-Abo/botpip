const API = import.meta.env.VITE_API_URL || "";
export function useApi() {
  const token = localStorage.getItem("bp_token");
  const h = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
  const ah = { Authorization: "Bearer " + token };

  async function req(method, path, body) {
    const isForm = body instanceof FormData;
    const res = await fetch(API + path, { method, headers: isForm ? ah : h, body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Request failed"); }
    return res.json();
  }

  return {
    get: p => req("GET", p),
    post: (p, b) => req("POST", p, b),
    patch: (p, b) => req("PATCH", p, b),
    del: p => req("DELETE", p),
    upload: (p, fd) => req("POST", p, fd)
  };
}