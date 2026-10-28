# Global Rules — OpsDesk Client

Next.js frontend for **OpsDesk** — asset management and maintenance ticketing.
Staff register assets, open tickets against them, assign work, discuss it in
comments, and track it to Done.

- **Backend:** `../ops-desk-server` (NestJS + Mongoose, every route under `/api`).
- **Mobile:** `../ops-desk-mobile-app` (Expo) talks to the same API — server
  changes must stay backward compatible with it.

This file is always loaded. The two files it pulls in below are reusable across
projects — see `docs/rules/README.md` for how the set is organised.

@docs/rules/source-code-rule.md
@docs/rules/complex-component-rule.md

Older product / structure notes: `.kiro/steering/product.md`, `structure.md`,
`tech.md` — partly outdated (they mention `src/pages/` and `lib/api.ts`, which
no longer exist). When they disagree with the code, the code wins.

---

## Language & Communication

- Respond in **Vietnamese** by default unless the user writes in another language.
- Keep explanations concise. Prefer code over prose.
- Report what changed, what did not, and follow-ups. Say when something is
  unverified rather than implying it works.
- **UI text and data are English** (labels, placeholders, toasts, seed data).

---

## Tech Stack

| | |
| --- | --- |
| Framework | **Next.js 16** — App Router, Turbopack, dev on port **3004** |
| Language | TypeScript 5.8 |
| UI | React 19 |
| Styling | **Tailwind CSS v4** — CSS-first config in `src/app/globals.css`, `tw-animate-css` |
| Components | **shadcn/ui on `@base-ui/react`** (`src/components/ui/`), some older Radix packages still installed, `lucide-react` icons |
| Server state | `@tanstack/react-query` (`components/providers/QueryProvider.tsx`) |
| HTTP | **axios** `httpClient` (`@/lib/httpClient`) — the only way to call the API |
| Tables | `@tanstack/react-table` through `ui/data-table.tsx` |
| Forms & validation | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Dates | `date-fns`, `react-day-picker`; display via `@/lib/formatDate` |
| Animation | `motion` |
| Package manager | **npm** (a `pnpm-lock.yaml` also exists — do not mix installs in one change) |
| Tests | none configured — do not invent a test command |

`@google/genai` is installed but unused; AI goes through the server with the
Claude API (see `../docs/ai-integration-plan.md`). Do not call any LLM from the
browser.

---

## Source Code Rules

Coding conventions live in their own files. Read them before writing code:

| File | Covers | Load |
| --- | --- | --- |
| `docs/rules/source-code-rule.md` | TypeScript, style, naming, components, hooks, reuse, styling | always (imported above) |
| `docs/rules/complex-component-rule.md` | the `index.tsx` / `hook.ts` / `type.ts` split | always (imported above) |
| `.claude/rules/ui-popover.md` | dropdowns / comboboxes / floating panels use shadcn `Popover` | `src/**/*.tsx` |
| `.claude/rules/select-async.md` | entity selects (`UserSelect`, …): 20 per page, lazy + infinite load, server search | select / combobox files |
| `.claude/rules/image.md` | every content image opens the viewer (`Image`, `ImageGroup`) | `src/**/*.tsx` |
| `.claude/rules/form-layout.md` | normal forms use `FieldSet` / `FieldGroup` / `Field` + `Controller` (preferred, not absolute) | form files |
| `.claude/skills/dialog-form/` | forms inside a dialog | skill (on demand) |

Those are project-independent (except §9 of `select-async.md`). **This file is
the project-specific half**: domain, stack, structure, API, theme, legacy
exceptions, verification.

API query/response conventions are owned by the server:
`../ops-desk-server/.claude/rules/api-conventions.md`.

---

## Domain

| Entity | Notes |
| --- | --- |
| **Asset** | Tracked thing (device, appliance, furniture, IT, facility). Has many **asset items** (physical units). |
| **Ticket** | Work order: `type` Repair / Maintenance / Request / Incident; `priority` Low → Urgent; `status` New → Assigned → Doing → Waiting → Done / Cancelled. Has `assigneeId`, `dueAt`, `imageUrls`, linked asset items. |
| **Ticket comment** | Discussion + images on a ticket. |
| **User** | `role` admin / manager / user, `status` active / blocked. Blocked users cannot be assigned. |
| **Department, Location** | Lookup data grouping users and assets. |

- Enums live in `src/types/*.ts` (`TicketPriority`, `TicketStatus`, …) and must
  match the server schema values exactly.
- **Every status / priority has one colour**, in `@/constants/tones.ts`
  (`TICKET_STATUS_TONE`, `TICKET_PRIORITY_TONE`, `ITEM_STATUS_TONE`,
  `USER_ROLE_TONE`, …), shown through `StatusPill`. Never pick a colour for a
  status anywhere else.
- Priority and status sort by business rank on the server (Urgent first), not
  alphabetically — pass `sortBy=priority|status`, do not sort client-side.

---

## API, Auth & Data

- **One HTTP client:** `httpClient` from `@/lib/httpClient`. Base URL is
  `localStorage[OPS_DESK_API_BASE_URL]` → `NEXT_PUBLIC_API_BASE_URL` → `/api`.
  It serialises arrays as repeated keys (`populations=a&populations=b`) and
  drops `undefined`/`null` params — pass `undefined` instead of `""` to omit a
  filter. Never call `fetch` / a second axios instance.
- **Auth:** JWT in `localStorage[OPS_DESK_TOKEN]`, attached by the request
  interceptor; the current user is `OPS_DESK_USER`. Keys are declared in
  `@/constants/local.ts` (`LOCAL_KEYS`) — never use a bare string.
  `(main)/layout.tsx` provides `AppContext`; the UI hiding pages is not the
  lock — the server guards every route (`/user` is admin-only).
- **Lists** use the server envelope `{ items, total, page, pageSize, totalPage }`.
  Some old endpoints still return a plain array — normalise with
  `Array.isArray(data) ? data : data.items`. `GET /user` returns an array
  without `page`, the envelope with it (mobile depends on the array form).
- **Populate** related docs with `populations: [...]` (e.g. tickets:
  `assigneeId`, `createdBy`, `updatedBy`). A populated field is typed
  `string | Model | null` — narrow with `typeof x === "object"`.
- **Date filters** are `startXxxAt` / `endXxxAt` ISO strings; build day bounds
  locally (start-of-day / end-of-day) before converting.
- **Uploads** are `multipart/form-data` with field `images`. Image paths from
  the server are relative — render with `fileUrl()` (`@/lib/fileUrl`,
  `NEXT_PUBLIC_FILE_DOMAIN`).
- **Query keys:** `["tickets", …filters]` for lists, `["ticket", id]` for a
  detail, `["ticket-comments", ticketId]`, `["users", status, …]` for selects.
  Invalidate both list and detail after a write.

### Environment

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | API base (default `/api`) |
| `NEXT_PUBLIC_FILE_DOMAIN` | prefix for uploaded image paths |
| `APP_PORT`, `APP_URL` | dev server |

Never commit `.env*`. Claude may read only `.env.example`; real env files are
blocked by `permissions.deny` in `.claude/settings.json`.

---

## UI Library in This Repo

What is installed and where — the reuse rules are in `source-code-rule.md`:

| Path | Contains |
| --- | --- |
| `src/components/ui/` | shadcn primitives (`button`, `dialog`, `popover`, `select`, `sheet`, …) plus project-wide pieces: `data-table`, `filter-bar` (`FilterBar`, `FilterPopover`, `FilterSelect`, `FilterLabel`, `DateRangeFilter`, `DebouncedInput`), `status-pill`, `user-cell`, `image-upload`, `image-manager`, `popup-confirm`, `table-pagination` |
| `src/components/selects/` | `EntitySelect` engine + entity selects (`UserSelect`) — see `select-async.md` |
| `src/components/layout/` | `MainLayout`, `Header`, `Sidebar`, `Breadcrumb`, `PageHeader` |
| `src/components/<feature>/` | feature UI: `tickets/`, `assets/`, `users/`, `departments/`, `locations/` |
| `src/components/providers/`, `contexts/` | React Query provider, `AppContext` |

- `ui/` primitives are built on **`@base-ui/react`**, not Radix: props are
  `open` / `onOpenChange`, `render` instead of `asChild`, `SelectValue`
  children may be a function `(value) => ReactNode`. Check the local file
  before copying a Radix example.
- List pages put every filter in `FilterBar`; more than ~3 filters go into
  `FilterPopover`. Code / title search stays inline.
- Detail pages (e.g. `tickets/TicketForm.tsx`) are one page, no tabs: info card
  with its own **Save**, then images, then comments.

---

## Theme & Tailwind in This Repo

- Theme lives in `src/app/globals.css` under `@theme` and `:root` / `.dark`.
  Radii run `--radius-sm` … `--radius-3xl`; shadows `shadow-soft`,
  `shadow-float`; easing `ease-apple`.
- `dark:` follows the `.dark` class on `<html>`
  (`@custom-variant dark (&:where(.dark, .dark *))`), set by
  `useTheme()` (`src/hooks/use-theme.ts`, `light` / `dark` / `system`, stored
  in `localStorage.theme`) — not the OS media query directly.
- Visual language is Apple-like: glassy header (`glass`), soft cards, pill
  badges. Match neighbouring components instead of inventing a new look.
- Check light **and** dark before calling UI work done.

---

## Folder Structure

```
src/
  app/
    layout.tsx            # root: fonts, providers
    login/                # public
    (main)/               # signed-in shell (MainLayout + AppContext)
      page.tsx            # dashboard
      tickets/            # list, new, [id] (detail/edit)
      assets/             # list, new, [id], asset-item
      users/ departments/ locations/ settings/
  components/             # see "UI Library in This Repo"
  constants/              # tones.ts, local.ts, data.ts
  hooks/                  # shared hooks
  lib/                    # httpClient, fileUrl, formatDate, utils (cn)
  types/                  # models + enums, re-exported from index.ts
docs/rules/               # reusable conventions (imported above)
.claude/rules/            # path-scoped rules
.claude/skills/           # on-demand skills
```

---

## Legacy Exceptions

Code that predates a convention and is **not** being renamed wholesale:

- **PascalCase component files** in feature folders (`TicketForm.tsx`,
  `AssetForm.tsx`, `layout/Header.tsx`) — new files follow kebab-case unless
  they sit next to PascalCase siblings in the same folder; then match the folder.
- **`interface` props** in some `ui/` files (`ImageManagerProps`) — use `type`
  for anything new.
- **`function` component declarations** in older feature files — new authored
  components use arrow functions.
- **`ui/asset-combobox.tsx`** hand-rolls its dropdown and loads assets itself —
  migrate to an `AssetSelect` on `EntitySelect` when touched.
- **Hooks named `use-theme.ts`** (kebab) — new hooks are named like the export.

---

## Verification

Run before claiming a task is done:

```bash
npx tsc --noEmit
npm run build
```

There is no working ESLint config in this package (`next lint` is not set up)
— do not report lint as passing.

For anything visible, verify in the browser preview (client 3004, server 3003)
and say what you observed. Pages under `(main)` need a signed-in session; if
you cannot sign in, say the UI is unverified rather than guessing. Server
changes: hit the endpoint with `curl http://localhost:3003/api/...`.

---

## What to Avoid

- Calling the API without `httpClient`, or hard-coding `localStorage` keys.
- Hand-rolled dropdowns / click-outside handlers — use `Popover` (see rule).
- Selects that load a whole collection (`pageSize: 100`) and filter in JS.
- Picking a status / priority colour outside `constants/tones.ts`.
- Sorting or filtering ticket lists client-side when the API supports it.
- Rendering a populated field without narrowing (`string | Model`).
- Breaking an API response shape the mobile app relies on.
- Vietnamese UI strings or seed data.
- Calling an LLM or putting an API key in the client.
- Committing `.env*`.

---

## Agent Behaviour

- For work spanning more than one file, outline the plan before editing.
- Ask at most one clarifying question; infer the rest from the codebase.
- When fixing a bug, state the root cause in one sentence before the fix.
- Prefer the smallest change that solves the problem; do not refactor adjacent
  code unasked.
- When the user's request is ambiguous about *where* (e.g. "images" on the
  ticket vs. in comments), confirm the target before changing shared components.
