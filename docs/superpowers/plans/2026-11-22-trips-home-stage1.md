# Trips + Home (Stage 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users can create, edit and delete trips (with a cover color or image), and Home shows every trip they belong to: a hero card, "My trips" / "Shared with me" tabs, Now / Upcoming / Past groups, a "+" button and an empty state.

**Architecture:** A new `trips` server module that follows `auth` (repository → service → controller → routes). Membership lives in `TripMember`, and the creator gets a row with role OWNER. Every permission check goes through one service helper. The client adds a `features/trips` feature (api, react-query hooks, components, a details page) and rebuilds `HomePage` from it. Dates travel as `YYYY-MM-DD` strings end to end so time zones can't shift them.

**Tech Stack:** Express 5, Prisma 7 (Postgres), zod 4, multer (new), vitest (new on the server); React 19, react-query 5, react-hook-form + zod, radix-ui, Tailwind v4, i18next.

**Spec:** `docs/superpowers/specs/2026-11-22-trips-home-design.md` (Stage 1)

## Global Constraints

- Ports: server 4000, client 5174. The client proxies only `/api`, so uploaded files are served under `/api/uploads`.
- Mobile-first: the drawer is used under `md`, the rail from `md` to `lg`, the full sidebar at `lg` and up (existing `AppLayout`). Every new screen must work at 360px width.
- Hebrew RTL is the default: use logical utilities (`ms-/me-/ps-/pe-/start-/end-`) and never `ml-/mr-/left-/right-`. All user-facing text goes through i18n with both `he` and `en` keys.
- Roles: OWNER and EDITOR may edit trip fields and the cover. Only OWNER may delete. A non-member gets **404**, never 403. A member without permission gets **403**.
- Cover upload: field `cover`, jpg/png/webp only, max 5 MB, stored in `server/uploads/covers/`.
- Cover color keys (server enum and client palette, default `sky`): `sky, teal, emerald, amber, orange, rose, violet, slate`.
- Field limits: title 1–100 chars, destination 1–100 chars, `endDate` optional and ≥ `startDate`.
- **Before Task 1:** the working tree holds uncommitted user changes (sidebar, settings, theme). Ask the user to commit them first. Then create the branch `feat/trips-home`. Each task commits only its own files.

## Review Focus

1. **A date that slips by a day**: a trip that starts today must show as Now, in both Israel (UTC+2/3) and UTC. Pinned by `tripStatus` tests (Task 5) and by the date round-trip test in the service (Task 2).
2. **A trip with no end date**: it's Now only on its start day and Past from the next day. Pinned in Task 5.
3. **End date before start date**: 400 on create and on update. A PATCH that changes only `startDate` past the existing `endDate` is also caught. Pinned in Task 2.
4. **Bad uploads**: a PDF or a 6 MB image → 400 with a readable message, and the existing cover stays. Replacing or deleting a cover, or deleting the trip, removes the old file from disk. Pinned in Task 4.
5. **Someone else's trip id, or a non-numeric id**: the API returns 404, and `/trips/:id` shows the not-found state, not a crash or a blank page. Pinned in Task 2 (service) and Task 8 (page).

---

### Task 1: Prisma schema and migration

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_trips/` (generated)

**Interfaces:**
- Produces: Prisma models `Trip`, `TripMember`, and enum `TripRole`, as below.

- [ ] **Step 1: Add to the schema**

```prisma
enum TripRole {
  OWNER
  EDITOR
  VIEWER
}

model Trip {
  id            Int      @id @default(autoincrement())
  title         String
  destination   String
  startDate     DateTime @db.Date
  endDate       DateTime? @db.Date
  coverColor    String   @default("sky")
  coverImageUrl String?
  members       TripMember[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model TripMember {
  id       Int      @id @default(autoincrement())
  tripId   Int
  userId   Int
  role     TripRole
  pinned   Boolean  @default(false)
  joinedAt DateTime @default(now())
  trip     Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tripId, userId])
  @@index([userId])
}
```
Add `tripMemberships TripMember[]` to `User`. (`JoinRequestStatus` waits for Stage 2, where it is first used. This is my call; the spec listed it under Stage 1.)

- [ ] **Step 2: Migrate and generate**

Run: `cd server && npm run db:migrate -- --name trips && npm run db:generate`
Expected: "Your database is now in sync with your schema." with no errors.

- [ ] **Step 3: Commit** `server/prisma/schema.prisma server/prisma/migrations` with the message `feat(db): add Trip and TripMember`.

---

### Task 2: Trips service with permission rules (TDD)

**Files:**
- Create: `server/src/modules/trips/trips.types.ts`, `trips.schema.ts`, `trips.service.ts`, `trips.service.spec.ts`
- Create: `server/vitest.config.ts`
- Modify: `server/package.json` (add `vitest` as a dev dependency, plus a `"test": "vitest run"` script), `server/tsconfig.json` (`"exclude"` add `"src/**/*.spec.ts"`)

**Interfaces:**
- Produces (`trips.types.ts`):
  ```ts
  type TripRole = 'OWNER' | 'EDITOR' | 'VIEWER'
  interface TripMemberShape { userId: number; name: string | null; email: string; role: TripRole }
  interface TripShape {
    id: number; title: string; destination: string
    startDate: string; endDate: string | null   // 'YYYY-MM-DD'
    coverColor: string; coverImageUrl: string | null
    myRole: TripRole; members: TripMemberShape[]  // owner first
  }
  interface TripRecord {   // what the repository returns
    id: number; title: string; destination: string; startDate: Date; endDate: Date | null
    coverColor: string; coverImageUrl: string | null
    members: { userId: number; role: TripRole; user: { name: string | null; email: string } }[]
  }
  interface ITripsRepository {
    listForUser(userId: number): Promise<TripRecord[]>
    findById(tripId: number): Promise<TripRecord | null>
    createWithOwner(userId: number, data: TripWriteData): Promise<TripRecord>
    update(tripId: number, data: Partial<TripWriteData>): Promise<TripRecord>
    delete(tripId: number): Promise<void>
  }
  interface TripWriteData { title: string; destination: string; startDate: Date; endDate: Date | null; coverColor: string; coverImageUrl?: string | null }
  ```
- Produces (`trips.schema.ts`): `COVER_COLORS` (the 8 keys), `createTripSchema`, `updateTripSchema` (all fields optional, and `endDate` may be `null`), `CreateTripDto`, `UpdateTripDto`. Dates are validated as `YYYY-MM-DD` strings (`z.iso.date()`). `createTripSchema` refines `endDate >= startDate`.
- Produces (`trips.service.ts`): `class TripsService(repo: ITripsRepository)` with
  `list(userId): Promise<TripShape[]>` (sorted by startDate ascending), `get(userId, tripId)`, `create(userId, dto)`, `update(userId, tripId, dto)`, `remove(userId, tripId): Promise<{ coverImageUrl: string | null }>`, `setCoverImage(userId, tripId, url: string | null): Promise<{ trip: TripShape; previousUrl: string | null }>`, and a private `requireRole(userId, tripId, allowed: TripRole[]): Promise<TripRecord>`. It throws `AppError('Trip not found', 404)` when there's no record or the user isn't a member, and `AppError('Forbidden', 403)` when the role isn't allowed.
- Date conversion: `'YYYY-MM-DD'` → `new Date(str + 'T00:00:00Z')`, and back with `date.toISOString().slice(0, 10)`.

- [ ] **Step 1: Write failing tests** in `trips.service.spec.ts` against an in-memory fake `ITripsRepository` (users 1 = owner, 2 = editor, 3 = viewer, 4 = outsider):
  - `create makes the creator OWNER and defaults coverColor to sky` → `trip.myRole === 'OWNER'`, `trip.coverColor === 'sky'`
  - `dates round-trip unchanged` → create with `startDate: '2026-03-01'` → `trip.startDate === '2026-03-01'`
  - `list returns only trips the user belongs to, sorted by startDate`
  - `get by outsider throws 404`; `get unknown id throws 404`
  - `viewer update throws 403`; `editor update succeeds`
  - `update that moves startDate after existing endDate throws 400`
  - `update with endDate: null clears it`
  - `editor remove throws 403`; `owner remove returns the coverImageUrl`
  - `setCoverImage returns previousUrl`
  - `members lists owner first with myRole per caller` → for user 2, `myRole === 'EDITOR'`

- [ ] **Step 2: Run** `cd server && npm i -D vitest && npx vitest run src/modules/trips`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the types, schema and service as specified above. The merged start/end check in `update` must use the stored values for any fields that weren't sent.
- [ ] **Step 4: Run** `npm test`. Expected: all PASS. `npm run build` passes with no errors.
- [ ] **Step 5: Commit** with the message `feat(trips): service with role rules`.

---

### Task 3: Repository, controller, routes and wiring

**Files:**
- Create: `server/src/modules/trips/trips.repository.ts`, `trips.controller.ts`, `trips.routes.ts`
- Create: `server/src/shared/middlewares/parseIdParam.ts`
- Modify: `server/src/index.ts`

**Interfaces:**
- Consumes: `ITripsRepository`, `TripsService`, the schemas from Task 2.
- Produces: `TripsRepository implements ITripsRepository` (Prisma: `include: { members: { include: { user: { select: { name, email } } }, orderBy: { joinedAt: 'asc' } } }`; `createWithOwner` uses a nested `members: { create: { userId, role: 'OWNER' } }`). Also `parseIdParam(name = 'id')`: it calls `next(new AppError('Trip not found', 404))` unless the param is a positive integer, and otherwise sets `res.locals.id`.
- HTTP (all behind `authenticate`, mounted at `/api/trips`):
  | Method | Path | Body | Response |
  |---|---|---|---|
  | GET | `/` | – | `200 { trips: TripShape[] }` |
  | POST | `/` | `CreateTripDto` | `201 { trip }` |
  | GET | `/:id` | – | `200 { trip }` |
  | PATCH | `/:id` | `UpdateTripDto` | `200 { trip }` |
  | DELETE | `/:id` | – | `204` (also deletes the cover file; see Task 4's `deleteCoverFile`) |

- [ ] **Step 1: Implement** the repository, controller (same `createXController(service)` + try/next style as `auth.controller.ts`) and routes, and mount them with `app.use('/api/trips', tripsRouter)`.
- [ ] **Step 2: Smoke test** with the server running (`npm run dev`), as two users, using cookie jars:
  ```bash
  curl -s -c a.txt -H 'Content-Type: application/json' -d '{"email":"admin@tripit.local","password":"Admin1234!"}' localhost:4000/api/auth/login
  curl -s -b a.txt -H 'Content-Type: application/json' -d '{"title":"Rome","destination":"Italy","startDate":"2026-12-01","endDate":"2026-12-07"}' localhost:4000/api/trips
  curl -s -b a.txt localhost:4000/api/trips          # → 1 trip, myRole OWNER
  curl -s -o /dev/null -w '%{http_code}' -b a.txt localhost:4000/api/trips/abc   # → 404
  ```
  Register a second user into `b.txt`: `GET /api/trips/<id>` → 404, `DELETE` → 404.
- [ ] **Step 3: Commit** with the message `feat(trips): REST endpoints`.

---

### Task 4: Cover image upload

**Files:**
- Create: `server/src/modules/trips/trips.upload.ts`
- Modify: `trips.routes.ts`, `trips.controller.ts`, `server/src/index.ts`, `server/package.json` (add `multer` and `@types/multer`), `server/.gitignore` (add `uploads/`)

**Interfaces:**
- Produces (`trips.upload.ts`): `coverUpload` (multer disk storage at `uploads/covers`, filename `${tripId}-${crypto.randomUUID()}.${ext}`, `limits.fileSize = 5 * 1024 * 1024`, a fileFilter for `image/jpeg|png|webp`), `handleCoverUpload` (a middleware that wraps `coverUpload.single('cover')` and turns `LIMIT_FILE_SIZE` and type rejections into `AppError(…, 400)`), and `deleteCoverFile(url: string | null): Promise<void>` (unlinks it when the url starts with `/api/uploads/covers/` and ignores ENOENT).
- HTTP: `POST /api/trips/:id/cover` (multipart, field `cover`) → `200 { trip }`; `DELETE /api/trips/:id/cover` → `200 { trip }`. Both require OWNER or EDITOR. The stored url is `/api/uploads/covers/<filename>`.
- `index.ts`: `app.use('/api/uploads', express.static(path.join(__dirname, '../uploads'), { fallthrough: false }))`. Set helmet `crossOriginResourcePolicy: { policy: 'same-site' }`.

- [ ] **Step 1: Implement** this. The controller checks the role **before** keeping the file: if `setCoverImage` throws, delete `req.file` from disk. On success, call `deleteCoverFile(previousUrl)`. Trip DELETE calls `deleteCoverFile` with the url that `remove` returns.
- [ ] **Step 2: Smoke test:**
  - Upload a small png → 200, the `coverImageUrl` is set, and `curl localhost:4000<url>` returns 200 with an image content type.
  - Upload a second png → the first file is gone from `server/uploads/covers`.
  - Upload a `.pdf` → 400 "Only JPG, PNG or WebP images are allowed". Upload a 6 MB file → 400 "Image must be 5 MB or smaller". After both, the cover is unchanged.
  - As a viewer or outsider → 403/404, and no new file is left on disk.
  - DELETE the trip → its cover file is removed.
- [ ] **Step 3: Commit** with the message `feat(trips): cover image upload`.

---

### Task 5: Client trips data layer and date helpers (TDD)

**Files:**
- Create in `client/src/features/trips/`: `types/trip.types.ts`, `api/trips.api.ts`, `hooks/useTrips.ts`, `lib/tripDates.ts`, `lib/tripDates.test.ts`, `lib/coverColors.ts`, `schemas/trip.schema.ts`, `index.ts`

**Interfaces:**
- Produces:
  - `trip.types.ts`: `TripRole`, `TripMember`, `Trip` (the same fields as the server's `TripShape`), and `TripStatus = 'now' | 'upcoming' | 'past'`.
  - `trips.api.ts`: `listTrips(signal?)`, `getTrip(id, signal?)`, `createTrip(data)`, `updateTrip(id, data)`, `deleteTrip(id)`, `uploadTripCover(id, file: File)` (FormData; override `Content-Type: multipart/form-data`), `removeTripCover(id)`. All return `Trip` or `Trip[]`, except delete.
  - `useTrips.ts`: the query key factory `tripKeys = { all: ['trips'], detail: (id) => ['trips', id] }`, plus `useTripsQuery()`, `useTripQuery(id)`, `useCreateTrip()`, `useUpdateTrip(id)`, `useDeleteTrip()`, `useUploadTripCover(id)`, `useRemoveTripCover(id)`. Mutations invalidate `tripKeys.all`.
  - `tripDates.ts`: `todayISO(now = new Date()): string` (**local** date as `YYYY-MM-DD`), `tripStatus(trip, today): TripStatus`, `groupTrips(trips, today): Record<TripStatus, Trip[]>` (now and upcoming sorted by startDate ascending, past by startDate descending), `pickHeroTrip(trips, today): Trip | null` (the first "now" trip, otherwise the soonest upcoming one), `daysUntil(startDate, today): number`, `tripDayProgress(trip, today): { day: number; total: number } | null` (null when there's no endDate), and `formatTripDates(trip, locale): string` (`Intl.DateTimeFormat`, building dates from parts so no UTC parsing happens).
  - `coverColors.ts`: `COVER_COLORS` (the 8 keys) and `coverClass(color): string` (Tailwind gradient classes per key, falling back to `sky`).
  - `trip.schema.ts`: `tripFormSchema` (zod, with the same limits and endDate refinement as the server; the error messages are i18n keys) and `TripFormData`.

- [ ] **Step 1: Write failing tests** in `tripDates.test.ts`:
  - `todayISO uses local date` → `todayISO(new Date(2026, 2, 1, 23, 30)) === '2026-03-01'`
  - `trip starting today is now`; `trip ending today is now`; `trip ended yesterday is past`
  - `no end date: now on start day, past the day after`
  - `groupTrips sorts upcoming asc and past desc`
  - `pickHeroTrip prefers now over upcoming, null when only past`
  - `daysUntil('2026-03-13', '2026-03-01') === 12`, and it stays correct across the DST change (`'2026-03-30'` from `'2026-03-20'` → 10)
  - `tripDayProgress → { day: 3, total: 7 }` for 1–7 Mar on 3 Mar
- [ ] **Step 2: Run** `cd client && npx vitest run src/features/trips`. Expected: FAIL.
- [ ] **Step 3: Implement** everything above. Compute day differences in UTC from the `YYYY-MM-DD` parts (`Date.UTC`) so DST can't change them.
- [ ] **Step 4: Run** `npx vitest run` → PASS, and `npm run build` → passes with no errors.
- [ ] **Step 5: Commit** with the message `feat(trips): client data layer and date helpers`.

---

### Task 6: Trip card and create/edit form

**Files:**
- Create: `client/src/components/ui/dialog.tsx` (via `npx shadcn@latest add dialog`; keep the logical-direction classes)
- Create in `client/src/features/trips/components/`: `TripCover.tsx`, `TripCard.tsx`, `MemberAvatars.tsx`, `TripFormDialog.tsx`, `CoverPicker.tsx`
- Create: `client/src/locales/{en,he}/trips.json`. Modify `client/src/lib/i18n.ts` (register the `trips` namespace).

**Interfaces:**
- Consumes: Task 5 hooks and helpers.
- Produces:
  - `<TripCover trip className? />`: the image if there is one, otherwise the `coverClass` gradient.
  - `<TripCard trip today />`: a link to `/trips/:id` showing the cover strip, title (truncated), destination, `formatTripDates`, a countdown ("in 12 days" via `Intl.RelativeTimeFormat` / "Day 3 of 7" / nothing for past), `MemberAvatars`, and a role badge when `myRole !== 'OWNER'`.
  - `<MemberAvatars members max={3} />`: initials circles plus "+N".
  - `<TripFormDialog open onOpenChange trip? />`: create mode when `trip` is undefined, edit mode otherwise. Fields: title, destination, start and end (native `<input type="date">`), and `CoverPicker` (a color swatch grid plus "Upload image" / "Remove image"). It's a full-width bottom sheet under `sm` and a centered dialog from `sm` up. On create it uploads the picked image after the trip exists, then navigates to `/trips/:id`. Server errors show via `sonner` toast.

- [ ] **Step 1: Implement.** Use `react-hook-form` + `zodResolver(tripFormSchema)`, and reuse `Input`, `Label`, `LoadingButton`. Image preview uses `URL.createObjectURL`, revoked on cleanup. Validate type and size client-side with the same limits and messages as the server.
- [ ] **Step 2: Verify** with `npm run build && npm run lint` (no errors). Manual checks come in Task 7, once there's a screen to mount this on.
- [ ] **Step 3: Commit** with the message `feat(trips): trip card and form dialog`.

---

### Task 7: Home page rebuild

**Files:**
- Modify: `client/src/features/home/pages/HomePage.tsx`, `client/src/locales/{en,he}/home.json`
- Create in `client/src/features/home/components/`: `HeroTrip.tsx`, `TripTabs.tsx`, `TripGroups.tsx`, `EmptyTrips.tsx`, `CreateTripFab.tsx`

**Interfaces:**
- Consumes: `useTripsQuery`, `groupTrips`, `pickHeroTrip`, `todayISO`, `TripCard`, `TripFormDialog`.
- Layout (top to bottom): a greeting with a "New trip" button (`hidden md:inline-flex`); `HeroTrip` (when `pickHeroTrip` isn't null, computed from **all** of the user's trips); `TripTabs` "My trips" (`myRole === 'OWNER'`) / "Shared with me" (others), a segmented control whose state lives in `?tab=mine|shared` (default `mine`); `TripGroups` with "Now", "Upcoming" and a collapsible "Past (N)" that starts closed; and `CreateTripFab`, a fixed round "+" at `bottom-[calc(1rem+env(safe-area-inset-bottom))] end-4`, `md:hidden`.
- States: loading → card skeletons. Error → a message plus a "Retry" button. No trips at all → `EmptyTrips` (an icon, text, and "Create your first trip"). The "Shared with me" tab with no trips → its own message, with no call to action.
- Pinned trips are Stage 3. Don't render a pinned section.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Manual check** with server and client running, at 360px, 768px and 1280px, in Hebrew and English:
  - A new user sees the empty state; create a trip through it → you land on the trip, go back → it's listed.
  - Create a past trip, a trip running today and a future trip → the hero shows today's trip as "Day X of Y", the groups are correct, and "Past" is collapsed.
  - Delete today's trip → the hero switches to the future trip with "in N days".
  - Use psql to insert a VIEWER `TripMember` for a second user → that user sees the trip only under "Shared with me", with a "Viewer" badge.
  - In RTL the FAB sits at the bottom-left, the card text is right-aligned, and the countdown is in Hebrew.
- [ ] **Step 3:** `npm run build && npm run lint` → passes with no errors. **Commit** with the message `feat(home): trips home screen`.

---

### Task 8: Trip details page

**Files:**
- Create: `client/src/features/trips/pages/TripDetailsPage.tsx`
- Modify: `client/src/app/router.tsx` (`{ path: '/trips/:id', element: <TripDetailsPage /> }` inside `AppLayout`), `client/src/features/trips/index.ts`, `trips.json`

**Interfaces:**
- Consumes: `useTripQuery`, `useDeleteTrip`, `TripFormDialog`, `TripCover`, `MemberAvatars`, the existing `alert-dialog`, `NotFoundPage`.
- Page: a large cover, title, destination, dates, a countdown, a members list (name plus role), and a back link to `/home`. "Edit" shows for OWNER and EDITOR. "Delete" shows for OWNER only and asks for confirmation through an `AlertDialog`; on success it toasts and navigates to `/home`. The space for trip content says "Trip details coming soon".
- A 404 from the API, or a non-numeric `:id` → render `NotFoundPage`. Other errors → a message plus "Retry".

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Manual check:**
  - The owner sees both Edit and Delete. A viewer (seeded via psql as in Task 7) sees neither.
  - Open `/trips/999999` and `/trips/abc` → the not-found page.
  - Edit the dates so the trip moves from Upcoming to Now → Home reflects it after navigating back (the cache was invalidated).
- [ ] **Step 3:** `npm run build && npm run lint && npx vitest run` (client) and `npm test && npm run build` (server) → all pass. **Commit** with the message `feat(trips): trip details page`.
