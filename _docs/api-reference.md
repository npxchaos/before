# Prompta Public API and Components Reference

This document covers all publicly exported utilities, hooks, components, and the HTTP API endpoint available in this repository. Examples include correct import paths and minimal usage snippets.

- Source root: `src/`
- UI framework: Next.js (App Router) + React + TypeScript

---

## 1) Utilities

### `cn(...inputs: ClassValue[]): string`
- File: `src/lib/utils.ts`
- Description: Tailwind-first class name merge helper using `clsx` and `tailwind-merge`.
- Example:
```ts
import { cn } from "@/lib/utils";

const classes = cn("p-2", condition && "bg-primary", "text-sm");
```

---

## 2) Supabase Clients

### `supabaseServer`
- File: `src/lib/supabase-server.ts`
- Type: Supabase client for server-side use (e.g., in route handlers).
- Env vars required:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Behavior: Falls back to a mock client at build time if env vars are missing (prevents build-time crashes).
- Example (server route):
```ts
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });
  // ...
}
```

### `supabaseClient`
- File: `src/lib/supabase-server.ts`
- Type: Supabase client for server runtime use where the anon key is sufficient (e.g., API routes authenticating via bearer token).
- Env vars required:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Example (API handler):
```ts
import { supabaseClient } from "@/lib/supabase-server";

const { data, error } = await supabaseClient
  .from("submissions")
  .insert([{ url: "https://example.com", status: "pending", created_at: new Date().toISOString() }])
  .select()
  .single();
```

### `supabase` (browser)
- File: `src/components/providers/AuthProvider.tsx`
- Type: Supabase client for client/browser usage created with anon key.
- Example:
```ts
import { supabase } from "@/components/providers/AuthProvider";

const { data: { session } } = await supabase.auth.getSession();
```

---

## 3) Authentication Provider and Hook

### `AuthProvider`
- File: `src/components/providers/AuthProvider.tsx`
- Description: React context provider exposing auth state and auth actions via `useAuth`.
- Provides: `user`, `loading`, `signIn`, `signUp`, `signOut`, `resetPassword`.
- Usage: Wrap your app body to provide auth context.
- Example (layout):
```tsx
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### `useAuth()`
- File: `src/components/providers/AuthProvider.tsx`
- Returns:
  - `user: User | null`
  - `loading: boolean`
  - `signIn(email, password)`
  - `signUp(email, password)`
  - `signOut()`
  - `resetPassword(email)`
- Example:
```tsx
import { useAuth } from "@/components/providers/AuthProvider";

export function AccountBadge() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <div>
      {user.email}
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
```

### `ProtectedRoute`
- File: `src/components/auth/ProtectedRoute.tsx`
- Props:
  - `children: React.ReactNode`
  - `fallback?: React.ReactNode` (optional UI while redirecting if unauthenticated)
- Behavior: Redirects unauthenticated users to `/login`. Shows a loading state while checking auth.
- Example:
```tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Secure dashboard here</div>
    </ProtectedRoute>
  );
}
```

---

## 4) Theme Provider and Hook

### `ThemeProvider`
- File: `src/components/ThemeProvider.tsx`
- Description: React context provider to manage light/dark theme, persists to `localStorage` and toggles the `dark` class on `<html>`.
- Example:
```tsx
import { ThemeProvider, ThemeScript } from "@/components/ThemeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### `useTheme()`
- File: `src/components/ThemeProvider.tsx`
- Returns:
  - `theme: "light" | "dark"`
  - `setTheme(theme)`
  - `toggleTheme()`
- Example:
```tsx
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? "Switch to light" : "Switch to dark"}
    </button>
  );
}
```

### `ThemeScript`
- File: `src/components/ThemeProvider.tsx`
- Description: Inline `<script>` that runs before hydration to prevent theme flash. Place in `<head>`.

---

## 5) Auth UI Components

### `LoginForm`
- File: `src/components/auth/LoginForm.tsx`
- Props:
  - `onSuccess?: () => void`
  - `onSwitchToSignup?: () => void`
  - `className?: string`
- Behavior: Calls `useAuth().signIn`. Shows loading, toasts, and success state. Invokes `onSuccess` after login.
- Example:
```tsx
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto">
      <LoginForm onSuccess={() => console.log("logged in")} />
    </div>
  );
}
```

### `SignupForm`
- File: `src/components/auth/SignupForm.tsx`
- Props:
  - `onSuccess?: () => void`
  - `onSwitchToLogin?: () => void`
  - `className?: string`
- Behavior: Password validation, visual stepper, creates account via `useAuth().signUp`, shows a verification screen and toasts.
- Example:
```tsx
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto">
      <SignupForm onSuccess={() => console.log("account created")} />
    </div>
  );
}
```

### `AuthModal`
- File: `src/components/auth/AuthModal.tsx`
- Props:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `defaultMode?: "login" | "signup"` (default: `"login"`)
  - `className?: string`
- Behavior: Modal container that toggles between `LoginForm` and `SignupForm`.
- Example:
```tsx
import { useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

export function AuthButtons() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Sign in</button>
      <AuthModal isOpen={open} onClose={() => setOpen(false)} defaultMode="login" />
    </>
  );
}
```

---

## 6) UI Feedback Components
- File: `src/components/ui/FeedbackComponents.tsx`

These are small UI building blocks intended to be reused across forms and flows.

### `Toast`
- Props:
  - `message: string`
  - `type: "success" | "error" | "info"`
  - `onClose: () => void`
- Example:
```tsx
import { Toast } from "@/components/ui/FeedbackComponents";

<Toast message="Saved!" type="success" onClose={() => setShow(false)} />
```

### `ProgressIndicator`
- Props:
  - `currentStep: number`
  - `totalSteps: number`
- Example:
```tsx
import { ProgressIndicator } from "@/components/ui/FeedbackComponents";

<ProgressIndicator currentStep={2} totalSteps={4} />
```

### `LoadingSpinner`
- Props:
  - `size?: "sm" | "md" | "lg"` (default: `"sm"`)
  - `className?: string`
- Example:
```tsx
import { LoadingSpinner } from "@/components/ui/FeedbackComponents";

<LoadingSpinner size="md" className="text-primary" />
```

### `ErrorMessage`
- Props: `message: string`
- Example:
```tsx
import { ErrorMessage } from "@/components/ui/FeedbackComponents";

<ErrorMessage message="Something went wrong" />
```

### `SuccessMessage`
- Props: `message: string`
- Example:
```tsx
import { SuccessMessage } from "@/components/ui/FeedbackComponents";

<SuccessMessage message="Done!" />
```

### `LoadingButton`
- Props: Inherits native `button` props plus
  - `isLoading: boolean`
  - `isComplete?: boolean`
  - `loadingText: string`
  - `completeText?: string`
  - `className?: string`
- Example:
```tsx
import { LoadingButton } from "@/components/ui/FeedbackComponents";

<LoadingButton isLoading={submitting} loadingText="Saving...">
  Save
</LoadingButton>
```

---

## 7) High-level Components

### `Navbar`
- File: `src/components/Navbar.tsx`
- Description: Site header with navigation, theme toggle, and auth controls. Uses `useTheme`, `useAuth`, `AuthModal`, and `UserMenu`.
- Example:
```tsx
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* ... */}
    </div>
  );
}
```

### `Hero`
- File: `src/components/Hero.tsx`
- Description: Landing hero with a URL submission form wired to `/api/submit-url`. Shows client-side validation and toasts.
- Note: Optionally includes bearer auth header if a user session exists.
- Example:
```tsx
import { Hero } from "@/components/Hero";

<Hero />
```

### `UserMenu`
- File: `src/components/auth/UserMenu.tsx`
- Props:
  - `className?: string`
- Description: Dropdown menu for authenticated users. Shows email, join date, dashboard link, and sign out.
- Example:
```tsx
import { UserMenu } from "@/components/auth/UserMenu";

<UserMenu className="ml-2" />
```

### `DashboardContent`
- File: `src/components/dashboard/DashboardContent.tsx`
- Description: Displays a list of the signed-in user's submissions from Supabase and basic stats.
- Usage: Typically wrapped by `ProtectedRoute`.
- Example:
```tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

---

## 8) HTTP API

### POST `/api/submit-url`
- File: `src/app/api/submit-url/route.ts`
- Description: Accepts a URL to queue for processing. Associates submission with the authenticated user if a valid bearer token is provided.
- Auth: Optional. If provided, must be in header `Authorization: Bearer <access_token>` (Supabase access token).
- Rate limiting: Simple in-memory limiter; allows up to 5 submissions per minute per IP. Returns `429` if limited.
- Request body:
```json
{
  "url": "https://example.com"
}
```
- Success response (`200 OK`):
```json
{
  "success": true,
  "message": "URL submitted successfully!",
  "data": {
    "id": "uuid",
    "url": "https://example.com",
    "status": "pending",
    "createdAt": "2025-08-07T12:34:56.000Z",
    "userId": "optional-user-id"
  }
}
```
- Error responses:
  - `400` invalid input or invalid URL
  - `429` rate limited
  - `500` unexpected error or database insert failure
  - `405` for unsupported methods (GET/PUT/DELETE)

- Example (fetch in browser):
```ts
const res = await fetch("/api/submit-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://example.com" })
});
const data = await res.json();
```

- Example (cURL unauthenticated):
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  http://localhost:3000/api/submit-url
```

- Example (cURL with Supabase bearer token):
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -d '{"url":"https://example.com"}' \
  http://localhost:3000/api/submit-url
```

---

## 9) Pages and Metadata

### `metadata` exports
- Files:
  - `src/app/layout.tsx` (site-wide OpenGraph and Twitter metadata)
  - `src/app/verify-email/layout.tsx` (page-level metadata)
- Note: These are consumed by Next.js automatically; typically not imported directly.

---

## 10) Environment Variables

Required for Supabase clients:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Make sure these are set in your environment (e.g., `.env.local`) before running server routes that require database access.

---

## 11) Integration Notes

- Wrap the app in `AuthProvider` and `ThemeProvider` at the root (`src/app/layout.tsx` already demonstrates this).
- `Hero` submits to `/api/submit-url` and will include auth header if a user session exists.
- `DashboardContent` expects a `submissions` table in Supabase with columns: `id`, `url`, `status`, `created_at`, `updated_at?`, `user_id?`.

---

Last updated: 2025-08-08