# BidCraft — AI-Powered RFP Automation

> Transform your RFP response process from 40–60 hours of repetitive work into a streamlined, AI-assisted workflow that produces a polished first draft in minutes.

<!-- Replace the placeholder below with a real screenshot once deployed -->
![BidCraft Dashboard](docs/screenshots/dashboard.png)

---

## The Problem

IT services companies waste **40–60 hours** responding to each RFP — manually hunting through past proposals, copy-pasting boilerplate, and formatting Word documents. Most of that effort is repetitive and doesn't require expert judgment. The people who know the answers are blocked by the people doing the formatting.

## The Solution

BidCraft automates the repetitive parts using a **RAG (Retrieval-Augmented Generation)** pipeline backed by your company's own knowledge base:

| Feature | What it does |
|---------|-------------|
| **AI question extraction** | Upload a PDF or Word RFP — Claude extracts every question, assigns a category, and flags mandatory items |
| **Semantic KB search** | Voyage AI embeddings + Supabase pgvector finds the most relevant past answers from your knowledge base |
| **RAG response generation** | Claude generates a tailored draft using KB context, company profile, and configurable tone / length |
| **Confidence scoring** | Every response gets a 0–100 confidence score so reviewers know exactly where to focus |
| **Rich text review workflow** | TipTap editor, inline feedback, star ratings, edit-distance tracking — structured review from draft to approved |
| **Professional Word export** | One-click export with cover page, table of contents, category sections, and appendix |

---

## Architecture

```
Upload RFP  →  Parse Document  →  Extract Questions  →  Search Knowledge Base  →  Generate Responses  →  Review & Edit  →  Export DOCX
PDF/DOCX       Claude Vision        Categorized             Voyage AI +                Claude Sonnet            TipTap             docx
               + Mammoth            + Confidence            pgvector (RAG)             (grounded in KB)         Editor             library
```

### Data Flow Diagram

```mermaid
flowchart LR
    A["📄 Upload RFP\nPDF / DOCX"] --> B["🔍 Document Parser\nClaude Vision + Mammoth"]
    B --> C["📋 Question Extraction\nCategory + Confidence score"]
    C --> D["🔎 Semantic Search\nVoyage AI Embeddings"]
    D --> E[("🗄️ Supabase pgvector\nKnowledge Base\n~240 entries")]
    E --> F["🤖 Response Generation\nClaude Sonnet — RAG"]
    F --> G["✏️ Review & Edit\nRich Text + Feedback"]
    G --> H["📥 Export\nWord Document"]

    style A fill:#7c3aed,color:#fff
    style F fill:#0891b2,color:#fff
    style E fill:#059669,color:#fff
    style H fill:#dc2626,color:#fff
```

---

## Technology Stack

| Layer | Technology | Justification |
|-------|-----------|--------------|
| **Framework** | Next.js 16 (App Router) | Full-stack React with colocated API routes, server components, and TypeScript end-to-end |
| **AI Model** | Anthropic Claude Sonnet 4 | Best-in-class reasoning for structured document parsing and long-form professional writing |
| **Embeddings** | Voyage AI `voyage-3-lite` | 512-dimensional semantic embeddings optimised for retrieval quality at low cost |
| **Vector DB** | Supabase + pgvector | PostgreSQL cosine-similarity search with no extra infrastructure; pairs naturally with existing auth/storage |
| **Rich Text** | TipTap 3 (ProseMirror) | Headless, extensible editor — full formatting control without a heavy third-party UI |
| **Word Export** | `docx` v9 | Programmatic DOCX generation with cover page, TOC, and section formatting |
| **State** | Zustand + localStorage | Lightweight client-state with zero backend auth complexity for an MVP |
| **Styling** | Tailwind CSS 4 | Utility-first dark-mode-first design system |
| **Language** | TypeScript 5 (strict) | End-to-end type safety across API routes, service layer, and UI components |

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- A [Supabase](https://supabase.com) project (free tier works)
- An [Anthropic](https://console.anthropic.com) API key
- A [Voyage AI](https://dash.voyageai.com) API key

### 1. Clone & install

```bash
git clone https://github.com/bhargavhari/bidcraft.git
cd bidcraft
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
# Open .env.local and fill in your API keys
```

See [Environment Variables](#environment-variables) for the full reference.

### 3. Set up the database

In the [Supabase SQL Editor](https://supabase.com/dashboard), paste and run:

```
supabase/migrations/001_initial_schema.sql
```

This creates the `knowledge_base`, `rfp_projects`, and `generated_responses` tables, installs the `pgvector` extension, and registers the `match_knowledge_base` RPC function used by semantic search.

### 4. Seed the knowledge base

```bash
# 65 base entries (fast — batched embeddings)
npm run seed

# Full 240-entry knowledge base across 7 categories (~17 min each on Voyage AI free tier)
npx tsx scripts/seed-batch-1.ts   # Technical (25) + Security & Compliance (25)
npx tsx scripts/seed-batch-2.ts   # Experience & References (25) + Staffing (25)
npx tsx scripts/seed-batch-3.ts   # Methodology (30) + Pricing (20)
npx tsx scripts/seed-batch-4.ts   # General (30)
```

> **Note:** Voyage AI's free tier is limited to 3 RPM. Each batch script waits 21 seconds between embedding calls — total runtime ~17 minutes per batch. Add a payment method at [dash.voyageai.com](https://dash.voyageai.com) to unlock standard rate limits and drop that to under a minute.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Claude API key — RFP parsing and response generation |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL (safe for the browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (safe for browser — RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key — **server-side only, never exposed to browser** |
| `VOYAGE_API_KEY` | ✅ | Voyage AI key — 512-dim KB embedding generation and query |

Copy [`.env.example`](.env.example) to `.env.local` and fill in each value.

---

## Screenshots

> Add real screenshots to `docs/screenshots/` after deploying and update these paths.

| Upload & Parse | Response Generation | Review & Edit |
|:-:|:-:|:-:|
| ![Upload](docs/screenshots/upload.png) | ![Responses](docs/screenshots/responses.png) | ![Review](docs/screenshots/review.png) |

| Knowledge Base | Dashboard | Export Modal |
|:-:|:-:|:-:|
| ![KB](docs/screenshots/knowledge-base.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Export](docs/screenshots/export.png) |

---

## Project Structure

```
bidcraft/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # RFP upload, drag-and-drop, question extraction
│   │   ├── responses/page.tsx        # AI response generation with batch mode
│   │   ├── review/page.tsx           # 3-panel review: questions | editor | feedback
│   │   ├── knowledge-base/page.tsx   # KB CRUD, semantic search, past RFP import
│   │   ├── dashboard/page.tsx        # Analytics: time saved, confidence, category breakdown
│   │   ├── history/page.tsx          # Browse and restore past RFP sessions
│   │   ├── profile/page.tsx          # Company profile, certifications, case studies
│   │   └── api/
│   │       ├── parse-rfp/            # POST — extract questions from PDF/DOCX via Claude
│   │       ├── generate-response/    # POST — RAG pipeline: pgvector search + Claude generation
│   │       ├── parse-company-doc/    # POST — extract company profile from capability statements
│   │       ├── export-docx/          # POST — generate formatted Word document
│   │       ├── embeddings/           # POST — generate Voyage AI embedding for a text
│   │       └── search/               # GET  — semantic KB search
│   ├── components/
│   │   ├── ExportModal.tsx           # Export configuration dialog (options, preview stats)
│   │   ├── RichTextEditor.tsx        # TipTap editor with formatting toolbar
│   │   ├── Toast.tsx                 # Toast notification system
│   │   ├── LoadingSpinner.tsx
│   │   └── OnboardingTour.tsx        # First-run tutorial flow
│   ├── lib/
│   │   ├── supabase.ts               # Browser + server Supabase client factory
│   │   ├── voyageai.ts               # Voyage AI embedding wrapper (raw fetch, no SDK)
│   │   ├── semanticSearch.ts         # pgvector cosine-similarity search via Supabase RPC
│   │   ├── prompts.ts                # Claude system prompt builders (tone, length, KB context)
│   │   ├── knowledgeBaseService.ts   # KB CRUD with auto embedding generation
│   │   ├── docxGenerator.ts          # DOCX: cover page, TOC, category sections, appendix
│   │   ├── responseService.ts        # Optional Supabase persistence for generated responses
│   │   └── storage.ts                # localStorage: sessions, profile, feedback, review state
│   └── types/
│       ├── index.ts                  # Core types: RFPQuestion, GeneratedResponse, KnowledgeBaseEntry
│       └── database.ts               # Supabase schema types for createClient<Database>()
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql    # pgvector + knowledge_base + rfp_projects + match RPC
│       └── 002_response_upsert_constraint.sql
├── scripts/
│   ├── seed-knowledge-base.ts        # Seed 65 base KB entries (batched)
│   ├── seed-batch-1.ts               # Technical + Security & Compliance (50 entries)
│   ├── seed-batch-2.ts               # Experience & References + Staffing (50 entries)
│   ├── seed-batch-3.ts               # Methodology + Pricing (50 entries)
│   └── seed-batch-4.ts               # General (30 entries)
├── .env.example                      # Environment variable template (commit this, not .env.local)
├── vercel.json                       # Function timeout configuration for Vercel
├── next.config.ts                    # Next.js config: React Compiler, serverExternalPackages
└── package.json
```

---

## Deployment

### Vercel (Recommended)

BidCraft is a standard Next.js app — Vercel detects and configures it automatically.

**Steps:**

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: BidCraft RFP Automation Platform"
   git remote add origin https://github.com/YOUR_USERNAME/bidcraft.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo

3. Under **Project Settings → Environment Variables**, add all five variables from `.env.example` with your real values

4. Click **Deploy**

Vercel handles build caching, CDN, and serverless function scaling automatically. The `vercel.json` in this repo configures a 60-second timeout for the parse and generate routes (required for large PDFs and multi-KB RAG pipelines).

**Manual / self-hosted:**

```bash
npm run build
npm start
```

---

## Roadmap

### Near-term

- [ ] **RLHF pipeline** — Capture edit distances and 5-star ratings from the review page; use high-rated (⭐ 4–5) responses to iteratively refine prompts and surface better KB entries
- [ ] **Team collaboration** — Multi-user support via Supabase Auth: shared knowledge base, role-based workflow (Author → Reviewer → Approver), comment threads on individual responses
- [ ] **Compliance attachment manager** — Auto-attach certification PDFs (SOC 2, ISO 27001, FedRAMP, CMMC) to relevant Security & Compliance questions at export time

### Medium-term

- [ ] **Procurement portal integrations** — Pull opportunities directly from SAM.gov, GovWin IQ, and Unison; skip manual RFP download entirely
- [ ] **Response versioning** — Git-style diff view across all edits to a response, with ability to restore any previous version
- [ ] **Win/loss feedback loop** — Connect contract award outcomes back to response quality scores to identify which KB entries and prompts actually win work

### Metrics to Track & Optimise

| Metric | Target | Why it matters |
|--------|--------|----------------|
| Time to first draft | < 5 min | Core value proposition |
| Average confidence score | > 80% | Indicates strong KB coverage |
| Edit distance from AI draft | < 30% | Measures how useful the AI output actually is |
| Star rating average | ≥ 4.0 / 5 | Reviewer satisfaction proxy |
| KB semantic hit rate (similarity ≥ 0.6) | > 90% | RAG pipeline health |
| Responses requiring complete rewrite | < 5% | Flags prompt or KB gaps |

---

## Author

**Bhargav Hari**

- GitHub: [@bhargavhari](https://github.com/bhargavhari)
- LinkedIn: [linkedin.com/in/bhargavhari](https://linkedin.com/in/bhargavhari)

---

## License

MIT © 2025 Bhargav Hari
