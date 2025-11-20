# Projekt `PJApp`

Aplikacja mobilna Samorządu Studenckiego PJATK

Obecnie aplikacja wyjazdowa przygotowana dla INTEGRAL 2025, rozbudowywana dla WINTEGRAL 2026, aby docelowo stać się ogólną aplikacją Samorządu dla wszystkich studentów

## Chcesz dołączyć?

Spójrz na [zasady współpracy wewnątrz repo](CONTRIBUTING.md)!

## Struktura projektu

Obecnie repozytorium pełni funkcję monorepo zaimplementowanego z użyciem **Turborepo** dla orchiestracji budowy kodu oraz **pnpm workspaces** dla zarządzania pakietami.

Sprawdź szczegóły ich konfiguracji wewnątrz plików [`turbo.json`](../turbo.json) oraz [`pnpm-workspace.yaml`](../pnpm-workspace.yaml)

Znajduje się w nim:

- **Aplikacja natywna** (Expo) → [`@integral-2025-app/native`](../apps/native/)
- **Strona internetowa PWA** (Next.js) → [`@integral-2025-app/web`](../apps/web/)
- **Współdzielone biblioteki** → [`packages`](../packages/)

Wszystkie skrypty mogą zostać wywoałenie z katalogu głównego projektu za pomocą `pnpm <script>`.

Aby uruchomić skrypt przypisany danemu komponentowi używamy `pnpm --filter`:
```bash
pnpm --filter @integral-2025-app/web db:push
```

## Wymagania techniczne

Upewnij się, że masz zainstalowane:

- **Node.js** (version 18 lub wyższa)
- **pnpm** (`npm install -g pnpm`)
- **Docker** (dla Supabase)

## Jak zacząć?

### 1. Sklonuj repozytorium

```bash
git clone <repository-url>
cd integral-app
```

### 2. Zainstaluj zależności

```bash
pnpm install
```

### 3. Uruchomienie środowiska deweloperskiego

Spójrz na jego [dokumentację](dev_environment/README.md)

### 4. Przygotowuj schemat bazy danych

```bash
# Generate Prisma client
pnpm --filter @integral-2025-app/db postinstall

# Push the schema to the database
pnpm --filter @integral-2025-app/db db:push

# Optional: Open Prisma Studio to view the database
pnpm --filter @integral-2025-app/db db:studio
```

> 📖 **Więcej informacji o komendach bazodanowych**: Zobacz [packages/db/README.md](packages/db/README.md)

### 5. Uruchom wybraną aplikację

Przed uruchomieniem: 
- spójrz na dokumentację [aplikacji natywnej](apps/native/README.md) lub [aplikacji webowej](apps/web/README.md)
- wywołaj testy za pomocą `pnpm test`
- sprawdź, czy monorepo buduje aplikację za pomocą `pnpm build`

#### `pnpm dev`

Uruchamia wszystkie aplikacje w trybie developerskim jednocześnie:

- Web app on `http://localhost:11000`
- Native app (Expo dev server)

#### `pnpm dev:web`

Uruchamia tylko stronę internetową PWA w trybie deweloperskim (port 11000).

#### `pnpm dev:native`

Uruchamia tylko aplikacje natywną (Expo dev server).