# @mirai-app/seed

Application-level seeding for Supabase Storage + Drizzle data.

## What it does
- Creates required Supabase Storage buckets (files-public/image/video)
- Uploads files from environment-specific asset directories
- Reads YAML trip configs from `assets/{env}/config/**.yaml`
- Reads CSV user lists per trip from `assets/{env}/users/**.csv`
- Creates trips + participants, upserting users in chronological trip order
- Seeds sponsors, rewards, and trip info per trip
- Writes per-trip manifests to storage

## Folder structure
```
apps/seed/assets/
  dev/                    # Development environment assets
    config/
      example-trip.yaml   # Trip configuration
    images/
      trips/              # Trip-specific images
      sponsors/           # Sponsor logos
    info/
      example-info.yaml   # Trip info configuration
    public/               # Public bucket files
    rewards/
      example-rewards.yaml # Rewards configuration
      *.jpg              # Reward images
    sponsors/
      example-sponsors.yaml # Sponsor configurations
    users/
      example-trip-members.csv # User lists
  prod/                   # Production environment assets (same structure)
```

## Trip YAML schema
Minimal fields required:
```yaml
key: example-trip
name: Example Trip
description: Example trip description
startDate: 2026-02-20
endDate: 2026-03-01
users: users/example-trip-members.csv
background: images/trips/example-trip/background.png
sponsors: sponsors/example-trip-sponsors.yaml
rewards: rewards/example-trip-rewards.yaml
info: info/example-trip-info.yaml
```

Asset references must start with:
- `images/` (uploaded to image bucket)
- `public/` (uploaded to public bucket)

## Users CSV schema
Headers supported:
```
email,firstName,lastName,role,password,ghost,wristNumber,houseNumber
```
- `role` defaults to `USER`
- `ghost` accepts `true/false`

## Additional configuration files

### Sponsors YAML schema
```yaml
- id: partner-1
  name: Example Sponsor
  description: |
    First paragraph

    Second paragraph
  logoPath: images/sponsors/example-sponsor.png
  height: 18
  offsetX: 0
  offsetY: 0
```
- The file is only read when the trip YAML points at it with a `sponsors:` key.
- `description` is split into paragraphs on blank lines by the partner detail screen.
- `height`, `offsetX` and `offsetY` are per-trip and are stored in `trip_sponsor_display`,
  not on the sponsor itself. They default to `0`, which means "use the default tile size".

### Rewards YAML schema
```yaml
- name: "Pizza na wieczór"
  description: "Zamówienie pizzy dla całej grupy na wieczorny relaks"
  availableQuantity: 3
  coinCost: 50
  image: "pizza.jpg"
```

### Trip Info YAML schema
```yaml
resources:
  - type: hero_image
    label: "Example Trip"
    storagePath: "images/trips/example-trip/hero-bg.jpg"
    sortOrder: 0
  - type: map_bg_image
    label: "Ski Map Background"
    storagePath: "images/trips/example-trip/map-bg.jpg"
    sortOrder: 1
  - type: interactive_map
    label: "Interactive Map"
    url: "https://example.com/map"
    iconName: "map"
    sortOrder: 2
  - type: pdf_map
    label: "PDF Map"
    storagePath: "public/maps/example-map.pdf"
    fileName: "example-map"
    iconName: "document-text"
    sortOrder: 3
  - type: infopack
    label: "Infopack"
    storagePath: "public/infopack/example-infopack.pdf"
    fileName: "example-infopack"
    iconName: "document-text"
    sortOrder: 4
  - type: whatsapp
    label: "WhatsApp"
    url: "https://example.com/whatsapp"
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
  phoneNumber: "+48123456789"
  phoneDisplay: "+48 123 456 789"
  policyNumber: "EXAMPLE123"
  contractNumber: "EXAMPLE456"
  providerName: "Example Provider"
  hospitalName: "Example Hospital"
  hospitalAddress: "Example Address"
  hospitalDistance: "ok. 30km od Example Location"
  steps:
    - stepNumber: 1
      title: "Krok 1"
      text: "Poproście o pomoc osobę z obsługi stoku lub ratowników. W razie poważnych obrażeń wezwijcie helikopter (numer ratunkowy na stokach: 112)."
    - stepNumber: 2
      title: "Krok 2"
      text: "Skontaktujcie się z ubezpieczycielem Example Provider pod numerem +48 123 456 789. Podajcie:"
      requiredInfo:
        - "imienia i nazwiska"
        - "daty urodzenia"
        - "numeru polisy: EXAMPLE123"
        - "numeru umowy generalnej: EXAMPLE456"
      exampleCall: "Jestem na wyjeździe w Example Location, doznałem kontuzji, ratownicy zwożą mnie na dół."
    - stepNumber: 3
      title: "Krok 3"
      text: "Poinformujcie pilota lub członka naszej kadry o sytuacji. Zadzwońcie na podany numer kontaktowy."
```

## Example files
The seed app includes example configuration files in `assets/dev/`:
- `config/example-trip.yaml` - Example trip configuration
- `rewards/example-rewards.yaml` - Example rewards with images
- `sponsors/example-sponsors.yaml` - Example sponsor configurations  
- `info/example-info.yaml` - Example trip info with resources and insurance
- `users/example-trip-members.csv` - Example user list (create as needed)

## Environment Setup

### Development
Copy `.env.example` to `.env.dev` and configure with your development Supabase and database credentials:
```bash
cp .env.example .env.dev
# Edit .env.dev with your development values
```

### Production
Copy `.env.example` to `.env.prod` and configure with your production Supabase and database credentials:
```bash
cp .env.example .env.prod
# Edit .env.prod with your production values
```

## Environment variables
Required:
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (or `SERVICE_ROLE_KEY`)
- `DATABASE_URL`

Optional:
- `SUPABASE_STORAGE_IMAGE_BUCKET` (default: `image`)
- `SUPABASE_STORAGE_VIDEO_BUCKET` (default: `video`)
- `SUPABASE_STORAGE_PUBLIC_BUCKET` (default: `files-public`)
- `SEED_GHOST_PASSWORD`

If you change the ghost email/password, update `EXPO_PUBLIC_GHOST_LOGIN_EMAIL`
in `apps/native/.env` so the app exposes the password login for the reviewer account.

## Available Scripts

### Seeding
- `bun run dev` - Run seed with development environment
- `bun run prod` - Run seed with production environment  
- `bun run db:seed:dev` - Run seed with development environment (alias)
- `bun run db:seed:prod` - Run seed with production environment (alias)

### Drizzle Operations
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Run Drizzle migrations (no environment)
- `bun run db:migrate:deploy` - Deploy migrations to production
- `bun run db:migrate:dev` - Run migrations in development environment
- `bun run db:migrate:prod` - Run migrations in production environment
- `bun run db:reset` - Reset database (no environment)
- `bun run db:reset:dev` - Reset database in development environment
- `bun run db:reset:prod` - Reset database in production environment
- `bun run db:push:dev` - Push schema to development database
- `bun run db:push:prod` - Push schema to production database
- `bun run db:studio:dev` - Open Drizzle Studio with development database
- `bun run db:studio:prod` - Open Drizzle Studio with production database
- `bun run db:format` - Format Drizzle schema

## Run
```bash
# Install dependencies
bun install

# Development seeding
bun run dev
# Production seeding
bun run prod

# Or use the explicit aliases
bun run db:seed:dev
bun run db:seed:prod
```

## Testing

This package uses [Vitest](https://vitest.dev/) for testing. See [root TESTING.md](../../TESTING.md) for repo-wide testing conventions and best practices.

### Test Commands

```bash
# Run tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage report
bun run test:coverage
```

### Testing Scope

Tests cover the following areas:

- **Seed logic validation** - Core seeding orchestration and flow control
- **Configuration parsing** - YAML and CSV file parsing and validation
- **File upload handling** - Supabase Storage bucket operations and file uploads
- **User/trip creation logic** - Database operations for creating trips, users, and participant relationships
- **Integration tests** - End-to-end workflows with Supabase Storage and Drizzle

Tests use mocked external dependencies (Supabase, Drizzle) to run without requiring live services.
