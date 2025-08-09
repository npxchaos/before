# Project Context
_Last updated: 2025-08-09T19:56:17.748Z_

## Overview
- Repo: before.useprompta
- Branch: thiago

## Tech Stack
- Name: prompta
- Version: 0.1.0
- Dependencies: @supabase/supabase-js, class-variance-authority, clsx, lucide-react, next, react, react-dom, tailwind-merge
- DevDependencies: @tailwindcss/postcss, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, @types/jest, @types/node, @types/react, @types/react-dom, eslint, eslint-config-next, husky, jest, jest-environment-jsdom, tailwindcss, tw-animate-css, typescript


## TypeScript
- TSConfig: present















## Scripts
- `dev`: next dev --turbopack
- `build`: next build
- `start`: next start
- `lint`: next lint
- `test`: jest
- `test:watch`: jest --watch
- `test:coverage`: jest --coverage
- `test:ci`: jest --ci --coverage --watchAll=false
- `context:update`: node scripts/gen-context.mjs
- `prepare`: husky

## Recent Commits
- c8c0ace 2025-08-09 fix(hero): preserve original Hero layout and embed UrlSubmitForm inline without visual changes
- 8edc977 2025-08-09 refactor(form): extract URL submit form into reusable component and integrate in Hero
- 94ff0c8 2025-08-09 fix(n8n): replace template literal in Slack text with concatenation for valid JSON import
- 2321f31 2025-08-09 chore(n8n): conform workflows to n8n import schema (typeVersion, position, connections, top-level settings)
- bb02eec 2025-08-09 chore(n8n): escape functionCode blocks as JSON strings across all workflows
- 2316966 2025-08-09 fix(migrations): add idempotent migration to ensure submissions.progress exists for monitoring views
- 20a6024 2025-08-09 fix(migrations): make monitoring types/tables/indexes/policies idempotent
- ba1e7d5 2025-08-09 fix(migrations): make check_submission_rate_limit constraint idempotent
- 40d18e6 2025-08-09 fix(migrations): ensure submissions.progress column exists for monitoring queries; add missing workflow files placeholders
- 8125d2f 2025-08-09 feat(monitoring): add alerts/metrics tables and views; add workflows for page audit, visibility tracker, result aggregator, and error handler

## Changed Files (not committed)
```
M _docs/aeo_n8n_workflows/5_Full_Site_Crawler.json
 D _docs/aeo_n8n_workflows/6_Progress_Patch.json
 M package-lock.json
 M package.json
?? .cursor/
?? .husky/
?? _docs/aeo_n8n_workflows/7_Monitoring.json.zip
?? _docs/aeo_n8n_workflows_final_final_copy_copy.zip
?? scripts/
```

