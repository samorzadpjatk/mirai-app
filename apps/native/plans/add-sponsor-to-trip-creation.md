# Add Sponsor Selection to Trip Creation

Build a full admin trip creation screen with an integrated sponsor picker, so admins can assign sponsors while creating a trip.

## Current State

- **Backend**: `trip.create` procedure exists (`packages/trpc/src/api/routers/trip.ts:301-321`) but accepts only `name`, `description`, `startDate`, `endDate`, `backgroundImagePath` — no `sponsorIds`.
- **Backend**: `sponsor.addToTrip` / `removeFromTrip` already exist (`packages/trpc/src/api/routers/sponsor.ts:97-162`), but aren't called from any UI.
- **Backend**: `sponsor.getAll` returns all active sponsors.
- **DB schema**: `Sponsor` ↔ `TripSponsor` ↔ `Trip` many-to-many is fully modeled (`packages/db/src/prisma/schema.prisma:653-683`).
- **Native app**: No trip creation screen exists. Trips are selected via `TripPickerModal` on the admin index, but there's no way to create one.
- **Native app**: Existing admin `new.tsx` screens (rewards, groups, challenges) follow a consistent pattern: `AdminHeader` + `ScrollView` with `FormField`/`ThemedTextInput` + `PrimaryLoadingButton`.

## Plan

### 1. Extend `trip.create` backend procedure to accept optional `sponsorIds`

**File**: `packages/trpc/src/api/routers/trip.ts`

- Add `sponsorIds: z.array(z.string()).optional()` to the `create` input schema.
- Wrap the trip creation + `TripSponsor` inserts in a Prisma `$transaction` so it's atomic.
- If `sponsorIds` is provided, create one `TripSponsor` row per sponsor ID in the same transaction.

### 2. Create the admin trip creation screen

**New file**: `apps/native/src/app/(tabs)/admin/trips/new.tsx`

Following the same pattern as `admin/rewards/new.tsx` and `admin/groups/new.tsx`:

- **Form fields**: Name (required), Description, Start Date, End Date, Background Image (optional upload).
- **Date pickers**: Use existing `DateTimePickerModal` component for start/end dates.
- **Image upload**: Reuse `useFileUpload` hook + `ImagePicker` pattern from rewards/groups.
- **Sponsor picker section**: Multi-select list of all active sponsors fetched via `useSponsors()`. Each sponsor shown as a toggleable chip/card with logo + name. Selected sponsors are highlighted.
- **Submit**: Calls `trip.create` mutation with all fields + selected `sponsorIds`. On success, invalidates trip queries and navigates back.

### 3. Add navigation entry point to admin panel

**File**: `apps/native/src/app/(tabs)/admin/index.tsx`

- Add a "Create Trip" button (e.g. FAB or a button near the trip picker) that navigates to `/admin/trips/new`.
- Alternatively, add a "Trips" tile to the admin grid that opens a trips management screen — but a simpler approach is adding a `+` button next to the existing trip picker dropdown.

### 4. Create a reusable `SponsorPicker` component

**New file**: `apps/native/src/components/admin/trips/SponsorPicker.tsx`

- Fetches all sponsors via `useSponsors()`.
- Renders a section with sponsor chips/cards showing logo thumbnail + name.
- Props: `selectedIds: string[]`, `onToggle: (id: string) => void`.
- Follows existing card/chip styling (`ThemedCard`, `FilterChip` patterns).
- This component can later be reused on a trip edit screen.

## Files to create/modify

| Action | Path |
|--------|------|
| Modify | `packages/trpc/src/api/routers/trip.ts` — add `sponsorIds` to `create` |
| Create | `apps/native/src/app/(tabs)/admin/trips/new.tsx` — trip creation screen |
| Create | `apps/native/src/components/admin/trips/SponsorPicker.tsx` — reusable sponsor multi-select |
| Modify | `apps/native/src/app/(tabs)/admin/index.tsx` — add "Create Trip" navigation entry |

## Open Questions

None — all building blocks (DB schema, backend procedures, UI primitives) are already in place.
