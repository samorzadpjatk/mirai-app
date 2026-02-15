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

## Run
```bash
bun install
bun run seed
```
