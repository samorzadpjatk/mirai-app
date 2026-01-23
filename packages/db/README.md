# @integral-2025-app/db

Wspólny pakiet zarządzający schematem bazy danych i migracjami Prisma dla całego monorepo.

## Struktura

```
packages/db/
├── prisma/
│   ├── schema.prisma    # Schemat bazy danych
│   ├── seed.ts          # Skrypt wypełniający bazę danymi początkowymi
│   └── migrations/      # Historia migracji
└── src/
    ├── index.ts         # Eksportowany klient Prisma
    └── env.ts           # Konfiguracja zmiennych środowiskowych
```

## Dostępne komendy

Wszystkie komendy można uruchomić z katalogu pakietu lub używając `cd`:

```bash
# Z katalogu pakietu
bun run <komenda>

# Z katalogu głównego repozytorium
cd packages/db && bun run <komenda>
```

### Podstawowe komendy

#### `db:generate`

Generuje klienta Prisma na podstawie schematu. Uruchamiane automatycznie po `bun install`.

```bash
cd packages/db && bun run db:generate
```

#### `db:push`

Wypycha zmiany schematu bezpośrednio do bazy danych bez tworzenia migracji. **Przydatne w środowisku deweloperskim**.

```bash
cd packages/db && bun run db:push
```

#### `db:studio`

Otwiera Prisma Studio - graficzny interfejs do przeglądania i edycji danych w bazie.

```bash
cd packages/db && bun run db:push
```

#### `db:seed`

Wypełnia bazę danych przykładowymi danymi z pliku `prisma/seed.ts`.

```bash
cd packages/db && bun run db:seed
```

### Komendy migracji (środowisko produkcyjne)

#### `db:migrate:dev`

Tworzy nową migrację na podstawie zmian w schemacie i aplikuje ją do bazy deweloperskiej.

```bash
cd packages/db && bun run db:migrate:dev
```

Po wywołaniu zostaniesz poproszony o nazwę migracji.

#### `db:migrate`

Aplikuje zaległe migracje do bazy danych. **Używane w środowisku produkcyjnym**.

```bash
cd packages/db && bun run db:migrate
```

#### `db:reset`

Resetuje bazę danych: usuwa wszystkie dane, ponownie aplikuje wszystkie migracje i uruchamia seed.

**⚠️ UWAGA: Usuwa wszystkie dane z bazy! Używaj tylko w środowisku deweloperskim!**

```bash
cd packages/db && bun run db:reset
```

## Workflow deweloperski

### 1. Inicjalizacja projektu

Po sklonowaniu repozytorium:

```bash
# Zainstaluj zależności (automatycznie uruchomi db:generate)
bun install

# Wypełnij bazę danymi początkowymi
cd packages/db && bun run db:seed
```

### 2. Modyfikacja schematu

Po zmianie pliku `prisma/schema.prisma`:

```bash
# W środowisku deweloperskim - szybkie prototypowanie
cd packages/db && bun run db:push

# LUB z migracjami - dla zmian, które mają trafić do produkcji
cd packages/db && bun run db:migrate:dev
```

### 3. Przeglądanie danych

```bash
cd packages/db && bun run db:studio
```

Otwiera się w przeglądarce pod adresem `http://localhost:5555`

## Konfiguracja

Pakiet wymaga zmiennej środowiskowej `DATABASE_URL` zdefiniowanej w pliku `.env` w katalogu głównym projektu:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
```

## PG Cron

pg_cron must be managed manually from supabase dashboard (superuser permissions needed).

### Available Cron Jobs

1. **NotificationSchedule Processing** - Processes scheduled notifications every minute
   - Go to supabase dashboard (http://localhost:8000) -> SQL Editor
   - Run [cron_process-notification-schedules.sql](./sql/cron_process-notification-schedules.sql)

2. **Job Details Cleanup** - Cleans up succeeded pg_cron logs daily at 2 AM (default retention period is 7 days, to change edit the parameter passed to the sp in cron sql)
   - Go to supabase dashboard (http://localhost:8000) -> SQL Editor
   - Schedule the cron from supabase dashboard: [cron_cleanup_cron_logs_succeeded.sql](./sql/cron_cleanup_cron_logs_succeeded.sql)

## Używanie w aplikacjach

```typescript
import { prisma } from "@integral-2025-app/db";

// Przykład użycia
const users = await prisma.user.findMany();
```

## Więcej informacji

- [Dokumentacja Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
