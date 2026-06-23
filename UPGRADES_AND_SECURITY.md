# BidCraft — Upgrades & Security Notes (June 2026)

## New features shipped (competitor-parity, all free)

| Feature | Files | Notes |
|---|---|---|
| Excel/CSV RFP import | `src/lib/xlsxParser.ts`, `src/app/api/parse-rfp/route.ts` | SheetJS parses workbooks → labeled CSV blocks; capped at 10 sheets / 60K chars to protect memory and prompt budget |
| PDF export | `src/lib/pdfGenerator.ts`, `src/components/ExportModal.tsx` | Second export format via jspdf (already a dependency); new "PDF" button in the export modal |
| Library health (duplicates + stale) | `supabase/migrations/003_kb_hygiene.sql`, `src/app/api/kb-hygiene/route.ts`, `src/components/LibraryHealth.tsx` | pgvector cosine self-join finds ≥92% similar entries; stale = 90+ days. **Run migration 003 in the Supabase SQL editor first.** |
| Slack notifications | `src/lib/notify.ts` | Fires on successful RFP parse. Optional: set `SLACK_WEBHOOK_URL` in `.env.local`. No-op when unset, never throws, 3s timeout |

## How to verify locally (on your Mac)
1. Open this folder so iCloud downloads any evicted files (`tsconfig.json`, `next.config.ts`, `src/lib/supabase.ts`, `src/lib/voyageai.ts`, `src/types/index.ts`).
2. `npm install` (xlsx was added to package.json)
3. Run `supabase/migrations/003_kb_hygiene.sql` in Supabase SQL editor
4. `npm run build && npm run dev` — upload an .xlsx RFP, try the PDF export button, hit "Library health check" on the Knowledge Base page.

Changes were type-checked in isolation (tsc strict, exit 0) — `tsconfig.check.json` + `typecheck-stubs/` are scratch files, safe to delete.

## Security review

**🔴 Act now**
- `.env.local` contains live API keys and sat in an iCloud-synced folder. Before pushing this repo anywhere: **rotate the Anthropic, Voyage AI, and Supabase service-role keys**, and confirm `.env*` is in `.gitignore` (couldn't verify here — the file is iCloud-evicted).
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It must only ever be read in server code (API routes) — never in a `"use client"` file. Current code respects this; keep it that way.

**🟡 Recommended (add to next.config.ts — file was iCloud-evicted, merge manually):**
```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
// inside nextConfig:
async headers() {
  return [{ source: "/(.*)", headers: securityHeaders }];
},
```

**🟢 Already in place**
- Upload validation: file-type allowlist + 10MB cap in `parse-rfp` (the new spreadsheet path adds sheet-count and output-size caps).
- Errors return messages, not stack traces.
- New Slack webhook reads from env, never logged, fails silent.

**Dependency audit (run June 2026)**
- Started at 8 vulnerabilities (1 critical, 4 high, 3 moderate) → now 3 after fixes applied here.
- ✅ Fixed: jspdf bumped 3.x → **4.2.1** (critical PDF-injection advisories resolved); transitive xmldom/underscore resolved via `npm audit fix`.
- ⚠️ Remaining, action on your Mac:
  - `next` — upgrade to the latest patched release (`npm i next@latest`) and re-run the build; the advisories cover request smuggling and DoS vectors. Done locally so you can smoke-test the app.
  - `xlsx` — the npm registry build is frozen at 0.18.5 (prototype-pollution/ReDoS advisories, no registry fix). Upgrade to the patched official build: `npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (that CDN was blocked from my sandbox). Mitigations already in code: 10MB upload cap + 10-sheet/60K-char parser caps, server-side only.

**Backlog (free, not yet done):** per-IP rate limiting on the API routes (e.g. Vercel KV or upstash free tier), Supabase Auth + RLS for multi-user roles, CSP header after auditing inline styles.
