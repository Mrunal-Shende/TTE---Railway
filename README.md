Viewed Brand.tsx:1-18
Listed directory frontend
Listed directory components
Listed directory ui
Listed directory routes
Listed directory hooks
Listed directory lib
Used tool: manage_task


Here is the complete folder structure of the **TTE Railway Companion** repository, organized by workspace component:

### 📁 Root Directory

- [package.json](file:///c:/Users/HP/Documents/railway-companion-main/package.json) — Defines scripts to manage and concurrently run both the frontend and backend servers (`npm run dev`).

---

### 📁 Backend (`backend/`)

An Express server written in TypeScript that integrates with the Firebase Admin SDK to serve as the backend API.

- [backend/package.json](file:///c:/Users/HP/Documents/railway-companion-main/backend/package.json) — Backend dependency configuration.
- **`src/`** — Backend source code:
  - `index.ts` — Server entry point initializing the Express app and routing incoming requests.
  - [src/config/firebase.ts](file:///c:/Users/HP/Documents/railway-companion-main/backend/src/config/firebase.ts) — Configures and initializes the Firebase Admin SDK.
  - [src/routes/api.ts](file:///c:/Users/HP/Documents/railway-companion-main/backend/src/routes/api.ts) — Defines REST API endpoints for user status management, complaints, and earnings entries.

---

### 📁 Frontend (`frontend/`)

A React single-page application built with Vite, Tailwind CSS, and TanStack Router.

- [frontend/package.json](file:///c:/Users/HP/Documents/railway-companion-main/frontend/package.json) & [frontend/vite.config.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/vite.config.ts) — Frontend configuration and build pipeline setup.
- **`src/`** — Frontend application codebase:
  - [src/styles.css](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/styles.css) — Custom global stylesheet declaring the Tailwind v4 theme, fonts (Inter & Plus Jakarta Sans), and Indian Railways design system tokens.
  - [src/server.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/server.ts) — Server entry point for SSR.
  - [src/start.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/start.ts) — Client-side hydration/entry point.
  - [src/router.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/router.tsx) — TanStack Router setup.
  - [src/routeTree.gen.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routeTree.gen.ts) — Automatically generated route map for type-safe routing.
  - **`components/`** — UI and Layout components:
    - [AdminLayout.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/components/AdminLayout.tsx) — Shell layout for administrative users.
    - [CollectorLayout.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/components/CollectorLayout.tsx) — Shell layout for Ticket Collectors (TCs).
    - [Brand.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/components/Brand.tsx) — Logo and title block for Indian Railways.
    - **`ui/`** — Reusable primitives (buttons, dialogs, inputs, card, tables, etc.) configured via shadcn/ui.
  - **`hooks/`** — Custom React Hooks:
    - [use-mobile.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/hooks/use-mobile.tsx) — Hook to detect active mobile viewport sizing.
  - **`lib/`** — Utility files:
    - [config.server.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/lib/config.server.ts) — Holds configuration for server-side logic.
    - [error-capture.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/lib/error-capture.ts) — Custom interceptor capturing uncaught client-side and server-side errors.
    - [error-page.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/lib/error-page.ts) — Catastrophic error fallback page renderer.
    - [format.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/lib/format.ts) — Formatting utilities for Indian Rupees (₹) and dates.
    - [utils.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/lib/utils.ts) — Utility functions such as `cn` for combining class names.
  - **`services/`** — API and Context wrappers:
    - [config.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/services/config.ts) — Initializer for the frontend Firebase SDK client with local persistent cache configuration.
    - [AuthContext.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/services/AuthContext.tsx) — React context providing authenticated user info, role state, and logout actions.
    - [useProfile.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/services/useProfile.ts) — Hook to manage fetching/creating database user profile credentials.
    - [auth.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/services/auth.ts) — Firebase Authentication service functions.
    - [entries.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/services/entries.ts) — Firestore services to fetch and create earnings entries.
    - [complaints.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/services/complaints.ts) — Firestore services to fetch and submit passenger complaints.
    - [users.ts](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/services/users.ts) — Firestore services for administrative user listing and activation.

  - **`routes/`** — TanStack Router routes (file-system routing):
    - [\_\_root.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/__root.tsx) — Top-level root layout.
    - [index.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/index.tsx) — Portal login view.
    - [home.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/home.tsx) — Home navigation hub.
    - [profile.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/profile.tsx) — User profile settings.
    - [entries.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/entries.tsx) — Ticket collector's list of earnings entries.
    - [entry.new.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/entry.new.tsx) — Ticket collector's new daily earnings form.
    - [complaints.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/complaints.tsx) — List of passenger complaints.
    - [complaint.new.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/complaint.new.tsx) — Log a new passenger complaint form.
    - [admin.index.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/admin.index.tsx) — Admin dashboard analytics.
    - [admin.users.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/admin.users.tsx) — Admin portal user management (active/disabled toggling).
    - [admin.entries.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/admin.entries.tsx) — Admin view of all collector entries.
    - [admin.complaints.tsx](file:///c:/Users/HP/Documents/railway-companion-main/frontend/src/routes/admin.complaints.tsx) — Admin portal list of all passenger complaints.
