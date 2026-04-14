# Migrate Trip Info from Hardcoded to Dynamic DB Data

Move all hardcoded trip-specific values from `apps/native/src/app/(tabs)/trips/info.tsx` into new fully-relational DB tables (`TripResource`, `TripInsurance`, `TripInsuranceStep`), expose them via a dedicated tRPC query, seed them from YAML, define shared types in `packages/shared`, and consume them dynamically in the native app.

## Hardcoded values to migrate

In `apps/native/src/app/(tabs)/trips/info.tsx`:

| Data | Current value |
|---|---|
| Location name | `"Verbier-La Tzoumaz"` |
| Hero image | hardcoded Google image URL |
| Interactive map URL | `infosnow.ch/...` |
| PDF map | URL + filename |
| Infopack PDF | URL + filename |
| WhatsApp link | `sspj.online/wintegral-whatsapp` |
| SOS number | `112` |
| Insurance phone | `+48 22 564 06 25` |
| Insurance policy/contract | `COR700416` / `500008713` |
| Insurance steps | 3-step Polish text with hospital info |
| Ski map BG image | hardcoded Google image URL |

---

## Plan

### 1. DB schema — three new models (`packages/db`)

No JSON fields — everything is fully relational.

**`TripResource`** — generic resources (links, PDFs, images, SOS):

```prisma
model TripResource {
  id          String   @id @default(cuid())
  tripId      String
  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  type        String   // "interactive_map", "pdf_map", "infopack", "whatsapp", "sos", "hero_image", "map_bg_image"
  label       String   // Display name
  description String?  // Subtitle or message text (e.g. SOS alert message)
  url         String?  // External URL (only for interactive_map, whatsapp)
  storagePath String?  // Supabase Storage path (for PDFs, images)
  fileName    String?  // For downloadable PDF files (display name)
  iconName    String?  // Ionicons icon name
  value       String?  // Simple text value (e.g. emergency number "112")
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tripId, type])
}
```

**`TripInsurance`** — insurance config per trip (one-to-one):

```prisma
model TripInsurance {
  id               String   @id @default(cuid())
  tripId           String   @unique
  trip             Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  label            String   // e.g. "Ubezpieczenie / Kontakt"
  phoneNumber      String   // e.g. "+48225640625"
  phoneDisplay     String   // e.g. "+48 22 564 06 25"
  policyNumber     String
  contractNumber   String
  providerName     String   // e.g. "WIENER"
  hospitalName     String?
  hospitalAddress  String?
  hospitalDistance String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  steps TripInsuranceStep[]
}
```

**`TripInsuranceStep`** — ordered steps with optional list items:

```prisma
model TripInsuranceStep {
  id             String        @id @default(cuid())
  insuranceId    String
  insurance      TripInsurance @relation(fields: [insuranceId], references: [id], onDelete: Cascade)
  stepNumber     Int
  title          String        // "Krok 1"
  text           String        // Main instruction text
  requiredInfo   String[]      @default([])  // e.g. ["imienia i nazwiska", ...]
  exampleCall    String?       // Quote text
  additionalText String?       // Extra paragraph (e.g. hospital directions)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([insuranceId, stepNumber])
}
```

Add relations to `Trip`:
```prisma
tripResources TripResource[]
tripInsurance TripInsurance?
```

### 2. Shared types (`packages/shared`)

New file `packages/shared/src/tripInfo/types.ts` — exported from the package index:

```ts
// Resource type constants
export const TRIP_RESOURCE_TYPES = {
  HERO_IMAGE: "hero_image",
  MAP_BG_IMAGE: "map_bg_image",
  INTERACTIVE_MAP: "interactive_map",
  PDF_MAP: "pdf_map",
  INFOPACK: "infopack",
  WHATSAPP: "whatsapp",
  SOS: "sos",
} as const;

export type TripResourceType = (typeof TRIP_RESOURCE_TYPES)[keyof typeof TRIP_RESOURCE_TYPES];
```

Used by seed (for validation) and native (for type-safe resource lookup).

### 3. Backend — dedicated `trip.getResources` query (`packages/trpc`)

New `trip.getResources` procedure (separate from `getById` — lighter payload):

```ts
getResources: protectedProcedure
  .input(z.object({ tripId: z.string() }))
  .query(async ({ ctx, input }) => {
    // verify participant access
    const resources = await ctx.db.tripResource.findMany({
      where: { tripId: input.tripId },
      orderBy: { sortOrder: "asc" },
    });
    const insurance = await ctx.db.tripInsurance.findUnique({
      where: { tripId: input.tripId },
      include: { steps: { orderBy: { stepNumber: "asc" } } },
    });
    return { resources, insurance };
  });
```

### 4. Seed — info YAML + seeding logic (`apps/seed`)

**a) Extend types** (`apps/seed/src/types.ts`):

```ts
export type TripConfig = {
  // ...existing fields
  info?: string; // path to info YAML, e.g. "info/wintegral-2026-info.yaml"
};

export type TripResourceConfig = {
  type: string;
  label: string;
  description?: string;
  url?: string; // External URL (only for interactive_map, whatsapp)
  storagePath?: string; // Supabase Storage path (for PDFs, images)
  fileName?: string; // For downloadable PDF files (display name)
  iconName?: string;
  value?: string;
  sortOrder?: number;
};

export type TripInsuranceConfig = {
  label: string;
  phoneNumber: string;
  phoneDisplay: string;
  policyNumber: string;
  contractNumber: string;
  providerName: string;
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalDistance?: string;
  steps: {
    stepNumber: number;
    title: string;
    text: string;
    requiredInfo?: string[];
    exampleCall?: string;
    additionalText?: string;
  }[];
};

export type TripInfoConfig = {
  resources: TripResourceConfig[];
  insurance?: TripInsuranceConfig;
};
```

**b) Info YAML files** — one per trip:

`apps/seed/assets/dev/info/wintegral-2026-info.yaml` (full data — all resources + insurance):

```yaml
resources:
  - type: hero_image
    label: "Verbier-La Tzoumaz"
    storagePath: "images/trips/wintegral-2026/hero-bg.jpg"
    sortOrder: 0
  - type: map_bg_image
    label: "Ski Map Background"
    storagePath: "images/trips/wintegral-2026/map-bg.jpg"
    sortOrder: 1
  - type: interactive_map
    label: "Interactive Skimap"
    url: "https://infosnow.ch/~apgmontagne/?id=45&lang=en&tab=map-wi&sat=&tv="
    iconName: "map"
    sortOrder: 2
  - type: pdf_map
    label: "PDF Map"
    storagePath: "files/trips/wintegral-2026/verbier-piste-map-2024-25.pdf"
    fileName: "Verbier-Piste-Ski-Map-2024-25.pdf"
    iconName: "document-text"
    sortOrder: 3
  - type: infopack
    label: "Infopack"
    storagePath: "files/trips/wintegral-2026/wintegral-infopack-2026-02-20.pdf"
    fileName: "wintegral-infopack-20022026.pdf"
    iconName: "document-text"
    sortOrder: 4
  - type: whatsapp
    label: "WhatsApp"
    url: "https://sspj.online/wintegral-whatsapp"
    iconName: "chatbubble"
    sortOrder: 5
  - type: sos
    label: "SOS"
    description: "W razie nagłego wypadku zadzwoń na 112."
    iconName: "alert-circle"
    value: "112"
    sortOrder: 6

insurance:
  label: "Ubezpieczenie / Kontakt"
  phoneNumber: "+48225640625"
  phoneDisplay: "+48 22 564 06 25"
  policyNumber: "COR700416"
  contractNumber: "500008713"
  providerName: "WIENER"
  hospitalName: "Vigimed"
  hospitalAddress: "Rue du Léman 18 B, 1920 Martigny"
  hospitalDistance: "ok. 30km od La Tzoumaz"
  steps:
    - stepNumber: 1
      title: "Krok 1"
      text: "Poproście o pomoc osobę z obsługi stoku..."
    - stepNumber: 2
      title: "Krok 2"
      text: "Skontaktujcie się z ubezpieczycielem WIENER..."
      requiredInfo:
        - "imienia i nazwiska"
        - "daty urodzenia"
        - "numeru polisy: COR700416"
        - "numeru umowy generalnej: 500008713"
      exampleCall: "Jestem na wyjeździe w Verbier, doznałem kontuzji, ratownicy zwożą mnie na dół."
    - stepNumber: 3
      title: "Krok 3"
      text: "Poinformujcie pilota lub członka naszej kadry..."
      additionalText: "Najbliższy szpital to Vigimed, znajduje się w Rue du Léman 18 B, 1920 Martigny (ok. 30km od La Tzoumaz)."
```

`apps/seed/assets/dev/info/integral-2025-info.yaml` — stub (empty or minimal):

```yaml
resources: []
```

`apps/seed/assets/dev/info/wiatronalia-2026-info.yaml` — stub:

```yaml
resources: []
```

**c) New `seedTripInfo()` function** (`apps/seed/src/tripInfo.ts`):
- Follows the same pattern as `sponsors.ts`
- Upserts `TripResource` rows (delete stale, upsert current)
- For resources with `storagePath`, upload the local file to Supabase Storage (same pattern as trip backgrounds) and store the resulting storage path
- Upserts `TripInsurance` + `TripInsuranceStep` if insurance config is present

**d) Wire into `seed.ts`**: call `seedTripInfo()` after sponsors/rewards.

**e) Add `info:` to each trip config YAML**.

### 5. Native app — consume dynamic data (`apps/native`)

**a) Pass `tripId` to info screen**: `details.tsx` → `/trips/info?tripId=${trip.id}`

**b) New hook `useTripResources(tripId)`** — calls `trpc.trip.getResources`, returns typed resources + insurance.

**c) Rewrite `info.tsx`**:
- Read `tripId` from search params (fall back to `useTripStore`)
- Use `useTripResources` hook
- Helper: `getResource(type)` to look up a resource by type constant from shared package
- **Images**: For `hero_image` and `map_bg_image`, use `useFileDownload()` with the resource's `storagePath` to get a local URI
- **PDFs**: For `pdf_map` and `infopack`, use `useFileDownload()` with `storagePath` to download/open PDFs (supports both signed URLs and public URLs)
- **External URLs**: For `interactive_map` and `whatsapp`, use the resource's `url` directly
- **Values**: For `sos`, use the resource's `value` (emergency number)
- Replace every hardcoded constant with dynamic data
- Conditionally render tiles (hide when resource absent)
- Loading + error states

### 6. Migration & testing

- Generate and apply the Prisma migration
- Run seed to verify
- Test info screen on emulator

---

## File change summary

| Layer | Files |
|---|---|
| **DB** | `packages/db/src/prisma/schema.prisma` — add `TripResource`, `TripInsurance`, `TripInsuranceStep` + Trip relations (with `storagePath` field) |
| **Migration** | new auto-generated migration |
| **Shared** | new `packages/shared/src/tripInfo/types.ts` + re-export from index |
| **tRPC** | `packages/trpc/src/api/routers/trip.ts` — add `getResources` procedure |
| **Seed types** | `apps/seed/src/types.ts` — add `info?`, `TripResourceConfig` (with `storagePath`), `TripInsuranceConfig`, `TripInfoConfig` |
| **Seed logic** | new `apps/seed/src/tripInfo.ts` (uploads files to Supabase Storage for `storagePath` resources) |
| **Seed wiring** | `apps/seed/src/seed.ts` — call `seedTripInfo` |
| **Seed data** | new `apps/seed/assets/dev/info/wintegral-2026-info.yaml` (uses `storagePath` for images/PDFs, `url` for external links) |
| **Seed stubs** | new `apps/seed/assets/dev/info/integral-2025-info.yaml`, `wiatronalia-2026-info.yaml` |
| **Seed configs** | all 3 trip config YAMLs — add `info:` field |
| **Native nav** | `apps/native/src/app/(tabs)/trips/details.tsx` — pass `tripId` |
| **Native hook** | new `apps/native/src/hooks/trips/useTripResources.ts` |
| **Native screen** | `apps/native/src/app/(tabs)/trips/info.tsx` — rewrite to use `useFileDownload()` for images and PDFs, `url` for external links, `value` for SOS |