# 🔐 Access & Functionality Rules for Prompta

## 🛡️ Access Levels

### 1. Visitors (Non-Authenticated)
- **Can access:**
  - Homepage
  - Audit form (URL submission)
  - Pricing & Plans
  - About / Info Pages
- **Cannot access:**
  - Audit results
  - Personal dashboard
  - Audit history

### 2. Free Users (Authenticated - Free Plan)
- **Can:**
  - Run 1 audit per month
  - View basic results: AEO Score, general suggestions
- **Limitations:**
  - No export (Markdown/JSON)
  - No saved history
  - No detailed insights

### 3. Premium Users
- **Can:**
  - Run multiple audits
  - View full analysis (score, trends, AI presence, breakdowns)
  - Export results (Markdown/JSON)
  - View history and progression
  - Receive advanced suggestions
  - Integrate with external services (e.g., Zapier)

### 4. Admins
- **Can:**
  - Full dashboard access
  - Manage users and billing
  - Monitor audits and performance
  - Edit content, text, and themes

---

## ⚙️ Platform Behavior & Workflow

- Audits require valid URL submission.
- A new job is created with statuses:
  - `pending`, `processing`, `done`, `error`
- User is redirected to `/results` once audit completes.
- Stripe/Supabase is used to manage usage limits.
- Dark mode:
  - Follows system preferences
  - Supports manual toggle

---

## 🔧 Infrastructure Notes
- Audit processing handled via n8n + backend queue
- Stripe for subscriptions, Supabase for auth/storage
- Results stored temporarily and cleaned based on tier
- All public pages cached, dashboard data is real-time

