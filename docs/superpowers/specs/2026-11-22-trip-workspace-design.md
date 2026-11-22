# Trip workspace: trip-scoped sidebar and sections

## Context

Today a trip is a single page (`/trips/:id`) with cover, dates, members and a "coming soon" placeholder, and the sidebar is a fixed list (Home, Settings). The user wants entering a trip to turn the sidebar into that trip's menu, with a page per section: trip Home, Flights, Stays, Budget, Attractions, Restaurants, Transport, plus sections they add themselves per trip (e.g. "Coffee shops" in Amsterdam).

Decisions made with the user:

- **Custom sections are place lists.** Attractions, Restaurants and every custom section share one engine and one set of fields. A custom section only needs a name and an icon.
- **Budget = planned total + auto sum.** Every flight, stay, place and transport item has an optional price. Budget sums them by section against a trip budget, plus manual extra expenses.
- **Currency = own rates.** Trip has a main currency; each price can be in any currency; the user types one rate per foreign currency. No outside rates service.
- **Trip Home = overview cards.** Cover/dates/members, a "next up" line, then one card per section (count + key fact), Budget card with a progress bar.

My calls (not asked): viewers read, owners/editors write (existing trip roles); Settings and Logout stay in the sidebar inside a trip; no reordering of sections, no day-by-day timeline, no cost splitting, no file attachments in this work.

## Approach

One nested route tree under `/trips/:id` with a `TripLayout`, a sidebar that swaps its item list when the URL is inside a trip, and four new server modules mounted under the trips router. Alternatives rejected: a second sidebar/tab bar inside the trip page (the user asked for the main sidebar to change, and it would not fit the rail/drawer pattern); one generic "item" table with JSON fields for everything (flights and stays have real structure that zod/Prisma should enforce, and Budget needs typed price columns).

### Routes (client)

`client/src/app/router.tsx`: replace the flat `/trips/:id` with

```
/trips/:id            TripLayout (parses id, loads trip, NotFound on bad id/404, <Outlet context={trip}>)
  index               TripHomePage
  flights             FlightsPage
  stays               StaysPage
  budget              BudgetPage
  attractions         PlacesPage (built-in section, kind ATTRACTIONS)
  restaurants         PlacesPage (kind RESTAURANTS)
  transport           TransportPage
  sections/:sectionId PlacesPage (custom)
```

`parseTripId` and the 404 handling move from `TripDetailsPage.tsx` into `TripLayout`; `TripDetailsPage` becomes `TripHomePage` (keeps cover, Edit/Delete, members; drops the placeholder and back link).

### Sidebar

- `components/layout/navItems.ts`: extend `NavItem` with optional `title` (literal text for custom sections, wrapped in `<bdi>`), `end` (exact match for trip Home), and keep `titleKey`.
- New `features/trips/hooks/useTripNavItems.ts`: builds the trip list: All trips (`/home`), trip Home, Flights, Stays, Budget, Attractions, Restaurants, Transport, custom sections (from the sections query), then Settings.
- `AppLayout.tsx`: `useMatch('/trips/:id/*')` picks global `navItems` or trip items, passes `items` down to `AppSidebar` / `MobileSidebar` / `SidebarContent`, and derives the header title from the active item (longest matching url). In trip mode the sidebar shows the trip title under the brand and an "Add section" button after the custom sections (owner/editor only; plus icon in rail mode).
- Works in all three existing modes (drawer < md, rail md–lg, full lg+) by reusing `Compact`, `labelClass`, `itemLayoutClass` in `AppSidebar.tsx`.

### Data model (`server/prisma/schema.prisma`)

All money: `priceAmount Decimal(12,2)?` + `priceCurrency String?` (ISO code), serialized as number. Dates as `YYYY-MM-DD` strings, times as `HH:mm` strings (local, no timezone), matching the existing date convention.

- `Trip` += `currency String @default("ILS")`, `budgetAmount Decimal?`
- `TripSection { id, tripId, kind ATTRACTIONS|RESTAURANTS|CUSTOM, name?, icon?, createdAt }`. ATTRACTIONS and RESTAURANTS rows are created with the trip (`createWithOwner`) and backfilled for existing trips in the migration SQL; unique per trip for the two built-in kinds.
- `Place { id, sectionId, name, address?, mapUrl?, date?, time?, website?, notes?, done, price }`
- `Flight { id, tripId, airline?, flightNumber, fromAirport, toAirport, departDate, departTime?, arriveDate?, arriveTime?, terminal?, confirmation?, seat?, notes?, price }`
- `Stay { id, tripId, type HOTEL|APARTMENT|OTHER, name, address?, mapUrl?, checkInDate, checkInTime?, checkOutDate, checkOutTime?, confirmation?, website?, phone?, notes?, price }`
- `Transport { id, tripId, type TRAIN|BUS|CAR_RENTAL|TAXI|FERRY|TRANSFER|OTHER, title, fromPlace?, toPlace?, date, time?, endDate?, endTime?, provider?, confirmation?, notes?, price }`
- `Expense { id, tripId, title, amount, currency, date?, notes? }`
- `TripCurrencyRate { tripId, currency, rate Decimal }`, unique `(tripId, currency)`; rate = main-currency units per 1 foreign unit.

All cascade on trip delete.

### Server

Follow the existing module pattern (`routes / controller / service / repository / schema / types`, fake-repo service specs) from `server/src/modules/trips/`. New modules `flights`, `stays`, `transport`, `sections` (sections + places), `budget` (settings, rates, expenses, summary), each a `Router({ mergeParams: true })` mounted from `trips.routes.ts` under `/:id/...`.

- Reuse: `authenticate`, `validateRequest`, `AppError`, `errorHandler`.
- `shared/middlewares/parseIdParam.ts`: add options for param name, `res.locals` key and not-found message (currently hard-coded to `id` / "Trip not found").
- Trip access: make `TripsService.requireRole` public as `requireRole(userId, tripId, allowed)` and inject `TripsService` into the new services, so the 404-for-non-member / 403-for-insufficient-role rule stays in one place. Child lookups always scope by `tripId` (a flight id from another trip is 404).
- Endpoints: standard list/create/patch/delete per resource, e.g. `GET|POST /api/trips/:id/flights`, `PATCH|DELETE /api/trips/:id/flights/:flightId`; `/sections` (list; create/patch/delete only for CUSTOM), `/sections/:sectionId/places`; `GET /api/trips/:id/budget` (budget, currency, rates, expenses, totals per section in main currency, list of currencies missing a rate), `PATCH /budget`, `PUT /budget/rates/:currency`, `/budget/expenses`; `GET /api/trips/:id/overview` (count + key fact per section, next-up item, budget totals) built on the same services.
- Budget math lives in one pure function (items + rates → totals, missing-rate currencies), test-first.

### Client

New feature folders mirroring `features/trips/` (`api / hooks / components / pages / schemas / types`): `flights`, `stays`, `transport`, `places`, `budget`. Reuse `apiClient`, react-query key style from `hooks/useTrips.ts` (`['trips', id, 'flights']` so existing `['trips']` invalidation still covers them), `TripFormDialog.tsx` as the form-dialog pattern (react-hook-form + zod, i18n error keys), `useToday`, `tripDates.ts`, `TripCover`, `MemberAvatars`, `NotFoundPage`, shadcn `ui/*`.

- Shared pieces: `PriceField` (amount + currency select, defaults to trip currency), `SectionPage` shell (title, add button/FAB like `CreateTripFab`, empty state), delete-confirm dialog.
- Each section page: card list sorted by date/time, add/edit in a dialog, delete with confirm; write controls hidden for viewers (`trip.myRole`).
- `PlacesPage` resolves its section from the sections query (by kind for attractions/restaurants, by id for custom) and offers rename/delete for custom sections; `AddSectionDialog` = name + icon from a fixed lucide set (coffee, shopping bag, beer, music, landmark, tree, star, map pin, …).
- `BudgetPage`: budget + main currency, progress bar, totals per section, rates editor (prompts for any currency missing a rate), extra expenses list.
- `TripHomePage`: cards from `/overview`, each linking to its section.
- i18n: new namespaces in both `he` and `en`, registered in `lib/i18n.ts`; logical CSS utilities only; `<bdi>` around user text; everything usable at 360px.

## Build order

Work on a new branch `feat/trip-workspace`, one commit per task. First step: save this design to `docs/superpowers/specs/2026-11-22-trip-workspace-design.md`.

1. **Shell** (client only): nested routes, `TripLayout`, dynamic sidebar, `TripHomePage` with empty cards, empty-state section pages.
2. **Places**: `Trip.currency`, `TripSection`, `Place`; sections module; Attractions, Restaurants, custom sections, Add section.
3. **Flights, Stays, Transport**: three modules + pages.
4. **Budget + Home data**: budget module, rates, expenses, `/overview`, live Home cards.

Each stage is usable on its own.

## Verification

Per task: client `npm run build && npm run lint && npx vitest run`; server `npm test && npm run build`. After schema changes: `npm run db:migrate -- --name <x>` then `npm run db:generate`, and check that existing trips got their two built-in sections.

End to end in the running app (server 4000, client 5174), in Hebrew and English, at 360px, tablet and desktop widths:

- Open a trip: sidebar switches to trip items in drawer, rail and full modes; "All trips" returns and the sidebar switches back; header title follows the section; refresh on a deep link (`/trips/1/flights`) works; bad or foreign trip id shows Not Found.
- Add/edit/delete a flight, stay, transport item, attraction, restaurant; add a "Coffee shops" section, add places, rename and delete it.
- Set a budget in ₪, add a € price: Budget asks for a rate, then totals and remaining are correct; Home cards show counts, next-up and the budget bar.
- With a VIEWER membership (set in `db:studio`): pages are readable, write controls are hidden, write API calls return 403; a non-member gets 404.
