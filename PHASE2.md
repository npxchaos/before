# Phase 2 — End-to-End Processing Loop (n8n ↔ Supabase ↔ Frontend)

This document describes the next steps to wire the full processing loop for URL submissions, including the API contract, n8n workflow, Supabase data model, Realtime UX, testing, and deployment. It includes detailed checklists for execution.

## Goals
- Frontend submits a URL and immediately shows progress.
- API persists a `submission` and triggers n8n.
- n8n processes and writes back progress/result to Supabase using service role.
- Frontend reacts instantly via Supabase Realtime and renders the result.

---

## Architecture (High-Level Flow)
1) Frontend: POST `/api/submit-url` with `{ url }` → receive `{ submissionId }`.
2) API: Insert row into `submissions` with status `queued` and progress `0`.
3) API: Trigger n8n webhook with `{ submission_id, url, user_id }`.
4) n8n: Update `submissions` row to `processing`, stream progress updates.
5) n8n: On success → set `status='succeeded'`, `progress=100`, write `result` and `score`.
6) n8n: On failure → set `status='failed'`, write `error_code` and `error_message`.
7) Frontend: Subscribes to that row and updates UI in real-time.

---

## Data Model (Supabase)
Recommended table `submissions` columns (extend existing):
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references auth.users(id)`
- `url text not null`
- `status text not null check (status in ('queued','processing','succeeded','failed')) default 'queued'`
- `progress int not null default 0`
- `result jsonb`  // structured output from n8n
- `score numeric` // optional aggregate score
- `meta jsonb`    // extra info: og tags, timings, asset URLs
- `error_code text`
- `error_message text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `processed_at timestamptz`

RLS policies (examples):
- Select: `using (user_id = auth.uid())`
- Insert: by API route only (server env), or allow anon insert if you explicitly want public submission
- Update: allow only service role (n8n) or function-based security via edge function

---

## API Contract
- Endpoint: `POST /api/submit-url`
- Request body: `{ url: string }`
- Response body: `{ submissionId: string }`
- Side-effects:
  - Insert row into `submissions` with fields `{ id, user_id, url, status: 'queued', progress: 0 }`
  - Trigger n8n webhook with `{ submission_id, url, user_id }`

Example payload to n8n:
```json
{
  "submission_id": "<uuid>",
  "url": "https://example.com",
  "user_id": "<uuid>"
}
```

---

## n8n Workflow (Webhook → Process → PATCH Supabase)
- Entry: Webhook node receives `{ submission_id, url, user_id }`.
- Immediately PATCH to Supabase (REST) to mark `status='processing'`, `progress=10`.
- Process the URL (crawl, analyze, run Lighthouse, etc.).
- Periodically PATCH progress updates (`progress=25,50,75` with partial `meta`).
- On success: PATCH `{ status: 'succeeded', progress: 100, result, score, meta, processed_at: now }`.
- On failure: PATCH `{ status: 'failed', error_code, error_message, processed_at: now }`.

Supabase REST (HTTP Request node) PATCH example:
- URL: `https://<project>.supabase.co/rest/v1/submissions?id=eq.{{$json.submission_id}}`
- Headers:
  - `apikey: <SERVICE_ROLE>`
  - `Authorization: Bearer <SERVICE_ROLE>`
  - `Content-Type: application/json`
- Body (JSON):
```json
{
  "status": "processing",
  "progress": 10
}
```

On success final update:
```json
{
  "status": "succeeded",
  "progress": 100,
  "result": { "lighthouse": { "performance": 0.92 }, "seo": { "score": 0.8 } },
  "score": 86.5,
  "meta": { "screenshotUrl": "https://..." },
  "processed_at": "{{ $now }}"
}
```

Failure update:
```json
{
  "status": "failed",
  "error_code": "FETCH_TIMEOUT",
  "error_message": "Timed out fetching URL",
  "processed_at": "{{ $now }}"
}
```

Security: store `SERVICE_ROLE` in n8n credentials/environment only. Never expose on the client.

---

## Frontend (Realtime UX)
- After POST, the client gets `{ submissionId }`.
- Create a Supabase Realtime subscription on that row by `id`.
- Update a progress bar/stepper as `status/progress` change.
- On `succeeded` → render `result`.
- On `failed` → show error toast with `error_message` and allow retry.

Pseudocode:
```ts
const channel = supabase
  .channel("submissions-updates")
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'submissions',
      filter: `id=eq.${submissionId}`
    },
    (payload) => {
      const row = payload.new
      setProgress(row.progress)
      setStatus(row.status)
      setResult(row.result)
      if (row.status === 'failed') showToast(row.error_message, 'error')
    }
  )
  .subscribe()
```

---

## Observability & Reliability
- Store each run in `webhook_runs` (optional) for auditing and retries:
  - `id`, `submission_id`, `status`, `attempt`, `request`, `response`, `error`, `created_at`.
- Add retry/backoff for transient network errors in n8n.
- Add rate limits on API (`/api/submit-url`).
- Log dashboard (simple page listing latest submissions with status and timestamps).

---

## Security
- Frontend: anon key with RLS.
- Server (API): use service-side env; never expose secrets to client.
- n8n: use service role; keep instance private; optionally validate HMAC signature on webhook payloads.

---

## Testing
- Unit tests
  - URL validation, form submission lock, toast display, error states.
- Integration tests (Jest msw)
  - Mock `/api/submit-url` → return `submissionId`.
  - Simulate Realtime updates and assert UI transitions.
- E2E (Playwright)
  - User submits URL → sees progress → final result.
  - Error case: API 500 → toast; n8n failure → error toast.

---

## Deployment
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in hosting.
- Set `SERVICE_ROLE` in n8n.
- Add `metadataBase` in `src/app/layout.tsx` to remove Next.js warning.
- Ensure `/verify-email` route is added to Supabase Auth Redirect URLs.

---

## Detailed Checklists

### 1) Database & RLS
- [ ] Ensure `submissions` has all required columns (status, progress, result, score, meta, error fields)
- [ ] Ensure triggers update `updated_at`
- [ ] Add/verify RLS:
  - [ ] Select policy: `user_id = auth.uid()`
  - [ ] Insert policy: via API or restricted as designed
  - [ ] Update policy: restricted; allow only service role (n8n)
- [ ] Optional: create `webhook_runs` table for auditing

### 2) API `/api/submit-url`
- [ ] Validate URL
- [ ] Resolve `user_id` (if authenticated)
- [ ] Insert `submissions` row `{ status: 'queued', progress: 0 }`
- [ ] Call n8n webhook with `{ submission_id, url, user_id }`
- [ ] Return `{ submissionId }`
- [ ] Handle rate limiting and error responses

### 3) n8n Workflow
- [ ] Webhook node receives payload
- [ ] HTTP Request → PATCH Supabase to `processing`, `progress=10`
- [ ] Processing nodes (crawl/analyze)
- [ ] Periodic PATCH updates (25/50/75)
- [ ] Success PATCH (status `succeeded`, result, score, meta, `progress=100`)
- [ ] Failure PATCH (status `failed`, code/message)
- [ ] Credentials: service role stored securely
- [ ] Optional: upload assets to Supabase Storage and write URLs to `meta`

### 4) Frontend
- [ ] POST URL, receive `submissionId`
- [ ] Subscribe to row updates via Supabase Realtime
- [ ] Show progress bar/stepper, status text
- [ ] Render `result` on success; toast on failure
- [ ] Dashboard: list submissions with latest status/score
- [ ] Detail view: show full `result` and `meta`

### 5) Security & Observability
- [ ] Keep service role only on server/n8n
- [ ] Add API logging/minimal audit
- [ ] (Optional) HMAC signature from API to n8n
- [ ] Add retries/backoff in n8n requests to Supabase

### 6) Tests
- [ ] Unit tests for form/validation/loading
- [ ] Integration tests mocking Realtime updates
- [ ] E2E Playwright: submit → progress → success/error

### 7) Deployment
- [ ] Set required env vars in hosting
- [ ] Set `metadataBase` in `src/app/layout.tsx`
- [ ] Add `/verify-email` to Supabase Auth Redirect URLs
- [ ] PR approvals, merge, production deploy

---

## Acceptance Criteria
- [ ] Submitting a URL returns `submissionId` and starts processing
- [ ] Realtime progress visible without manual refresh
- [ ] Successful result renders rich UI from `result` JSON
- [ ] Failure displays meaningful error with retry
- [ ] RLS enforces user isolation; no data leakage
- [ ] n8n retries transient failures and logs errors

---

## Rollback Plan
- [ ] Disable n8n webhook node
- [ ] Revert API to no-op on trigger (still create row with `queued`)
- [ ] Hide Realtime UI; show static queued state
- [ ] Rollback DB changes using migration down scripts

---

## Nice-to-Have Enhancements
- Signed URLs for private assets (screenshots, PDFs)
- Email notifications on completion/failure
- SLA dashboards for processing latency
- Batched processing queues per user/plan
- Webhook HMAC validation and replay protection
