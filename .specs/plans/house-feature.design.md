# House Feature Design

## Overview
Allow users to view their house assignment and see who else is in their house. Admin users can view all houses and their occupants.

## Data Model
No changes needed. `houseNumber` already exists on `tripParticipants` table.

## Backend API

### New Endpoints
- `user.getMyHouseMates(tripId)` — Returns current user's house number + all housemates for that trip. Any authenticated user.
- `user.getTripHouses(tripId)` — Returns all houses in trip + occupants per house. Admin/Moderator only.

### Implementation
- `packages/orpc/src/api/routers/user/queries.ts`: Added `getMyHouseMates` and `getTripHouses` query functions.
- `packages/orpc/src/api/routers/user/index.ts`: Added router endpoints with appropriate procedures (`protectedProcedure` and `moderatorProcedure`).

## Native App

### User View — "My House"
- **Screen**: `app/(tabs)/trips/house.tsx`
- **Component**: `components/trips/house/HouseMemberList.tsx`
- **Hook**: `hooks/trips/useMyHouseMates.ts`
- **Navigation**: Added to `TripQuickAccessGrid` as "My House" tile with home icon
- **Features**:
  - Shows house number badge
  - Lists all housemates with avatar, name, wrist number
  - Highlights current user with "(You)" label and primary border
  - Expandable list (shows first 3, "View All" to expand)
  - Empty state if no house assigned

### Admin View — "Houses Directory"
- **Screen**: `app/(tabs)/admin/houses/index.tsx`
- **Hook**: `hooks/trips/useTripHouses.ts`
- **Navigation**: Added to admin panel as "Houses" tile
- **Features**:
  - Grouped list by house number (ascending)
  - Search/filter by house number
  - Shows occupant count per house
  - Lists occupants with name and wrist number
  - "Unassigned Users" section at bottom for users without house

## Testing
- Updated `TripQuickAccessGrid.test.tsx` to include new house tile
- All existing tests pass (184/184)
- Typecheck and build pass

## Files Changed

### Backend
- `packages/orpc/src/api/routers/user/queries.ts` — Added `getMyHouseMates` and `getTripHouses`
- `packages/orpc/src/api/routers/user/index.ts` — Added router endpoints

### Native App
- `apps/native/src/hooks/trips/useMyHouseMates.ts` — New hook
- `apps/native/src/hooks/trips/useTripHouses.ts` — New hook
- `apps/native/src/hooks/trips/index.ts` — Exported new hooks
- `apps/native/src/components/trips/house/HouseMemberList.tsx` — New component
- `apps/native/src/app/(tabs)/trips/house.tsx` — New screen
- `apps/native/src/app/(tabs)/trips/_layout.tsx` — Added house route
- `apps/native/src/components/trips/details/TripQuickAccessGrid.tsx` — Added house tile
- `apps/native/src/app/(tabs)/trips/details.tsx` — Added house navigation
- `apps/native/src/app/(tabs)/admin/houses/index.tsx` — New admin screen
- `apps/native/src/app/(tabs)/admin/_layout.tsx` — Added houses route
- `apps/native/src/app/(tabs)/admin/index.tsx` — Added houses tile
- `apps/native/src/components/__tests__/trips/details/TripQuickAccessGrid.test.tsx` — Updated tests
