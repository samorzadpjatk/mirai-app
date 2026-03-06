# Seed App

Application-level seeding for Supabase Storage + Prisma data.

## What it does
- Creates required Supabase Storage buckets (files-public/image/video)
- Uploads files from `assets/public` to the files-public bucket
- Uploads files from `assets/trips/images` to the image bucket
- Uploads files from `assets/trips/videos` to the video bucket
- Reads YAML trip configs from `assets/trips/config/**.yaml`
- Reads CSV user lists per trip from `assets/trips/config/**.csv`
- Creates trips + participants, upserting users in chronological trip order
- Writes a per-trip `info.json` manifest to the public bucket

## Folder structure
```
apps/seed/assets/
  public/
    ...files uploaded to public bucket
  trips/
    images/
      ...files uploaded to image bucket
    videos/
      ...files uploaded to video bucket
    config/
      wintegral-2026/
        trip.yaml
        users.csv
```

## Trip YAML schema
Minimal fields required:
```yaml
key: wintegral-2026
name: Wintegral 2026
description: Verbier & La Tzoumaz winter trip
startDate: 2026-02-20
endDate: 2026-03-01
whatsappUrl: https://example.com
assets:
  background: trips/images/wintegral-2026/background.png
  infopack: public/trips/wintegral-2026/infopack.pdf
```

Asset references must start with:
- `public/` (public bucket)
- `trips/images/` (image bucket)
- `trips/videos/` (video bucket)

## Users CSV schema
Headers supported:
```
email,firstName,lastName,role,password,ghost,wristNumber,houseNumber
```
- `role` defaults to `USER`
- `ghost` accepts `true/false`

## Placeholders
```
apps/seed/assets/public/legal/Regulamin.txt
apps/seed/assets/public/legal/Polityka-Prywatnosci.txt
apps/seed/assets/trips/images/wintegral-2026/background.png
apps/seed/assets/public/trips/wintegral-2026/infopack.txt
apps/seed/assets/trips/config/wintegral-2026/trip.yaml
apps/seed/assets/trips/config/wintegral-2026/users.csv
```

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

### Prisma Operations
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run Prisma migrations (no environment)
- `bun run db:migrate:deploy` - Deploy migrations to production
- `bun run db:migrate:dev` - Run migrations in development environment
- `bun run db:migrate:prod` - Run migrations in production environment
- `bun run db:reset` - Reset database (no environment)
- `bun run db:reset:dev` - Reset database in development environment
- `bun run db:reset:prod` - Reset database in production environment
- `bun run db:push:dev` - Push schema to development database
- `bun run db:push:prod` - Push schema to production database
- `bun run db:studio:dev` - Open Prisma Studio with development database
- `bun run db:studio:prod` - Open Prisma Studio with production database
- `bun run db:format` - Format Prisma schema

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
