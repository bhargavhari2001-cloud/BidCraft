// Per-process sliding-window rate limiter.
// NOTE: Vercel serverless runs multiple instances — for strict distributed
// limiting in production, replace with Upstash Redis or Vercel KV.
const WINDOW_MS = 60_000;
const store = new Map<string, number[]>();

export function checkRateLimit(
  ip: string,
  limit: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const hits = (store.get(ip) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    return { allowed: false, remaining: 0, resetAt: hits[0] + WINDOW_MS };
  }

  hits.push(now);
  store.set(ip, hits);

  // Probabilistic cleanup to prevent unbounded memory growth
  if (Math.random() < 0.005) {
    for (const [k, v] of store) {
      if (v.every((t) => t <= cutoff)) store.delete(k);
    }
  }

  return { allowed: true, remaining: limit - hits.length, resetAt: now + WINDOW_MS };
}

export function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  );
}

export function rateLimitError(resetAt: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again in a minute." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}
