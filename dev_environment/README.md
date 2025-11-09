# Środowisko deweloperskie PJApp 

## Jak uruchomić?

Wykonaj następujące komendy w tym folderze:
1. Ta komenda przygotowuje zmienne środowiskowe:
```bash
cp .env.example .env
```
2. Ta komenda uruchamia bazę danych PostgreSQL z Supabase:
```bash
docker compose up -d
```
3. Te komendy tworzą schemat i wypełniają bazę danych danymi początkowymi:
```bash
pnpm --filter @integral-2025-app/web run db:generate
pnpm --filter @integral-2025-app/web run db:seed
```

## Jak zresetować?
```bash
bash ./reset.sh
```

## Przydatne komendy

- `pnpm --filter @integral-2025-app/web run db:push` - Wypchnij zmiany schematu do bazy danych
- `pnpm --filter @integral-2025-app/web run db:studio` - Otwórz Prisma Studio
- `pnpm --filter @integral-2025-app/web run db:generate` - Wygeneruj i uruchom migracje
