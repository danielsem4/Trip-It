# Trips & Home Screen — Design

## Context / why
Trip It has auth, a placeholder Home page (welcome line only) and Settings. The DB has only `User`. The core idea: each user creates **Trips**. A user owns the trips they create and can share them with others as **Viewer** (read-only) or **Editor**. Home becomes the user's hub for their trips.

## Goals
- Create, edit and delete trips. Home lists every trip the user can see.
- Share trips through role links. The owner approves each person who wants to join.
- The Home screen is mobile-first: drawer under `md`, rail from `md` to `lg`, full sidebar at `lg` and up (existing layout).

## Non-goals (for now)
- What goes inside a trip (itinerary, expenses, checklists, bookings) will be defined later. Home only uses trip-level fields.
- Email notifications, realtime updates, cloud image storage.

## Decisions (user's)
- Sharing works **through links only**. Each trip has **two links**: Viewer and Editor. The owner can regenerate either one, which revokes the old link.
- Opening a link → the person sees a preview page → confirming sends a **join request** → the **owner approves or declines**.
- **Only the owner** sees the links, manages members and join requests, and deletes the trip.
- Trip fields: **title, destination, start date, optional end date, cover (color or uploaded image)**.
- Cover images are stored **on the server's disk** (`server/uploads`, multer, served by Express). Move to cloud storage before deploying.
- Home in v1 includes everything listed below, built in **3 stages**, each with its own plan.

## Approaches considered
- Cover storage: server disk (**chosen**: no setup) vs cloud bucket (production-ready but needs an account first) vs a preset image gallery (no uploads, but impersonal).
- Ownership: owner stored as a `TripMember` row with role OWNER (**chosen**: one table drives "mine/shared" and every permission check) vs an `ownerId` column on Trip plus member rows (two places to check).
- Sharing: links + owner approval (**chosen by user**) vs email invites vs links that join instantly.

## Data model (Prisma)
- `enum TripRole { OWNER EDITOR VIEWER }`, `enum JoinRequestStatus { PENDING APPROVED DECLINED }`
- `Trip`: id, title, destination, startDate, endDate?, coverColor?, coverImageUrl?, createdAt, updatedAt
- `TripMember`: tripId, userId, role, pinned (bool, default false), joinedAt. Unique (tripId, userId). Cascade on trip delete.
- `TripShareLink`: tripId, role (EDITOR|VIEWER), token (unique, random, URL-safe), createdAt. Unique (tripId, role). Regenerating replaces the token.
- `TripJoinRequest`: tripId, userId, role, status, createdAt, decidedAt?. At most one PENDING request per (trip, user).
- `TripActivity` (Stage 3): tripId, actorId, type (CREATED, UPDATED, MEMBER_JOINED, MEMBER_LEFT, ROLE_CHANGED, MEMBER_REMOVED), payload Json?, createdAt.

## Permissions
| Action | Owner | Editor | Viewer |
|---|---|---|---|
| View trip | ✓ | ✓ | ✓ |
| Edit trip fields / cover | ✓ | ✓ | – |
| Delete trip, manage links/members/requests, change roles | ✓ | – | – |
| Leave trip | – | ✓ | ✓ |
Enforced on the server through a shared `requireTripRole(...)` helper in the trips service. The client only hides controls.

## Home screen (mobile-first)
```
┌──────────────────────────────┐
│ Hi Dana              [🔍]    │
│ ┌──────────────────────────┐ │  ← Hero: ongoing trip ("Day 3 of 7")
│ │ ROME  · in 12 days       │ │     else the next upcoming trip; hidden if none
│ └──────────────────────────┘ │
│ Join requests (2)  [Review]  │  ← owner only, when pending requests exist
│ [ My trips | Shared with me ]│
│ ★ Pinned                     │
│ Now / Upcoming               │
│  [cover] Paris · 3–9 Mar 👥3 │  ← card: cover, title, destination, dates,
│  [cover] Eilat · Editor      │     countdown, member avatars, role badge
│ ▸ Past (5)                   │  ← collapsed archive
│                         (+)  │  ← FAB on mobile; header button on md+
└──────────────────────────────┘
```
- Empty state: an illustration plus a "Create your first trip" call to action. The "Shared with me" tab has its own empty message.
- Grouping uses dates: Now (start ≤ today ≤ end, or start = today if there's no end), Upcoming, Past.
- Stage 3 adds search, filter (role) and sort (date/title), pin/unpin, duplicate, and an activity section ("Recent activity" across the user's trips).

## Stages
1. **Trips + Home**: schema (Trip, TripMember, both enums), `server/src/modules/trips/` CRUD, cover upload endpoint, `client/src/features/trips/` (api, hooks with react-query, create/edit dialog using react-hook-form + zod, TripCard, a minimal TripDetailsPage at `/trips/:id`), the Home page rebuild (hero, tabs, groups, FAB, empty state). Add "Trips" to `navItems.ts` only if a separate page is needed. Home is the list.
2. **Sharing**: TripShareLink, TripJoinRequest. Endpoints: get/regenerate links (owner), `GET /api/join/:token` preview, `POST /api/join/:token` request, list/approve/decline requests, list/remove members, change role, leave. Client: a Share sheet (copy links, regenerate), a `/join/:token` page (logged-out users go to login and come back), a "Join requests" section on Home with a review sheet, and a members list.
3. **Extras**: search/filter/sort, pin (TripMember.pinned), duplicate (copies fields; the duplicator becomes owner), TripActivity logging in the services plus an activity feed on Home.

## Conventions to follow
- Server modules follow `auth`: `trips.{routes,controller,service,repository,schema}.ts`, wired as `new Repository → Service → createController`, plus `validateRequest(zodSchema)`, `authenticate`, `AppError` (`server/src/shared/`).
- Client features follow `features/auth`: `api/`, `hooks/`, `pages/`, `components/`, `schemas/`, `types/`, `index.ts`. HTTP goes through `client/src/lib/apiClient.ts` (axios), data through `@tanstack/react-query`.
- i18n: new namespaces `trips` (+ `home` updates) in `client/src/locales/{he,en}`. Hebrew RTL is the default, so use logical CSS (`ms-/me-`, `start/end`).
- Ports: server 4000, client 5174.

## Left to the builder
- Exact endpoint paths and response shapes, the token length/format, and the upload size/type limits (proposal: jpg/png/webp, 5 MB).
- The cover color palette and the default color when the user picks nothing.
- Whether an Editor link request can be approved as Viewer (proposal: the owner can pick the role on approval).

## Verification (per stage)
- `npm run db:migrate` + `db:generate`, then server `npm run build` / typecheck, client `npm run build` + lint.
- Manual run (server :4000, client :5174) with two users. Stage 1: create, edit and delete trips, upload a cover, check grouping and the hero with past/now/future dates, check mobile width and RTL. Stage 2: user B opens the Editor link → request → A approves → B sees the trip under "Shared with me" as Editor and can edit but not delete. Regenerating the link breaks the old one. A Viewer gets 403 when trying to edit.
