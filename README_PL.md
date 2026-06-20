[![English](https://img.shields.io/badge/English-Click-yellow)](README.md)
[![Polski](https://img.shields.io/badge/Polski-Click-yellow)](README_PL.md)<br>
[![AGPLv3](https://img.shields.io/badge/License-AGPLv3-blue)](LICENSE)
<img width="1440" height="565" alt="mirai_app_banner" src="https://github.com/user-attachments/assets/88e9e651-ec6d-458f-b650-4a351b1bb534" />
<div align="center">
<h1>MIRAI</h1>
<b>Aplikacja mobilna Samorządu Studenckiego PJATK</b>
<p>inaczej: Projekt <code>PJApp</code></p>
<p>Obecnie aplikacja wyjazdowa przygotowana dla wyjazdów integracyjnych<br>Docelowo stanie się ogólną aplikacją Samorządu dla wszystkich studentów</p>
</div>

<br>

> [!NOTE]
> Nasza aplikacja została [nominowana](https://projuvenes.psrp.org.pl/wp-content/uploads/2025/09/XIII-Pro-Juvenes-nominowani.pdf) w XIII edycji konkursu „Pro Juvenes” o nagrody społeczności studenckiej, organizowanego przez Samorząd Studencki Rzeczypospolitej Polskiej, w kategoriach „Samorządowy Projekt Roku” oraz „Samorządowy Debiut Roku”
> 
> Prezentacje poprzednich wersji aplikacji: https://photos.app.goo.gl/BfrERv3qWQGbxV5T8

<br>

Prezentacja aplikacji: [https://www.youtube.com/watch?v=Bs19m9Kz98c](https://www.youtube.com/watch?v=Bs19m9Kz98c)

|||||
|---|---|---|---|
|<video src="https://github.com/user-attachments/assets/e0d2a36c-f6f7-4a38-9c8f-f121197ef935" />|<img width="1080" height="2400" alt="Screenshot_1771530366" src="https://github.com/user-attachments/assets/dacca3a4-1231-4d25-aeb9-503ff4ac988a" />|<img width="1080" height="2400" alt="Screenshot_1771530348" src="https://github.com/user-attachments/assets/49bf6280-3afe-44f1-8789-4aa37a5e5923" />|<img width="1170" height="2532" alt="Simulator Screenshot - iPhone 16e - 2026-01-20 at 19 42 14" src="https://github.com/user-attachments/assets/49ba1e4e-f7bf-4ca5-b51a-588c219fd2dd" />|

## Chcesz dołączyć?

Spójrz na [zasady współpracy wewnątrz repo](CONTRIBUTING.md)!

> [!IMPORTANT]
> **Call for Maintainers**
> 
> Szukamy osób, którzy przejmą opiekę nad projektem.
> 
> Jeśli jesteś zainteresowany, prosimy o kontakt z Samorządem Studenckim PJATK.

## Struktura projektu

Obecnie repozytorium pełni funkcję monorepo zaimplementowanego z użyciem **Nx** dla orchiestracji budowy kodu oraz **Bun workspaces** (Bun jako menedżer pakietów) dla zarządzania pakietami.

Sprawdź szczegóły ich konfiguracji wewnątrz plików [`nx.json`](nx.json) oraz [`bun.lock`](bun.lock)

Znajduje się w nim:

- **Aplikacja natywna** (Expo / React Native) → [`@mirai-app/native`](apps/native/)
- **Backend serwerowy** (Hono + oRPC) → [`@mirai-app/backend-server`](apps/backend-server/)
- **Nadawca powiadomień** (Expo Push Notifications) → [`@mirai-app/notification-sender`](apps/notification-sender/)
- **Seed CLI** (Baza danych & Storage seeding) → [`@mirai-app/seed`](apps/seed/)
- **Współdzielone biblioteki** → [`packages`](packages/)
  - [`@mirai-app/auth`](packages/auth/) - Logika autoryzacji
  - [`@mirai-app/db`](packages/db/) - Klient Drizzle bazy danych
  - [`@mirai-app/orpc`](packages/orpc/) - Routery oRPC i klient
  - [`@mirai-app/common`](packages/common/) - Współdzielone utilities
  - [`@mirai-app/supabase`](packages/supabase/) - Konfiguracja klienta Supabase

📖 **Testowanie**: Zobacz [TESTING.md](TESTING.md) dla kompleksowej dokumentacji testowania. Używamy Vitest dla większości pakietów i Jest dla aplikacji natywnej.

Wszystkie skrypty mogą zostać wywołane z katalogu głównego projektu za pomocą `bun run <script>`. (Możesz też wejść do konkretnego pakietu i uruchomić `bun run <script>`).

Aby uruchomić skrypt przypisany danemu komponentowi używamy `bun run` (lub `cd <pakiet> && bun run <script>`):
```bash
cd apps/native && bun run dev
```

## Wymagania techniczne

Upewnij się, że masz zainstalowane:

- **Node.js** (wersja 24)
- **Bun** (https://bun.sh)
- **Docker** (dla środowiska deweloperskiego, w tym Supabase)

## Jak zacząć?

### 1. Sklonuj repozytorium

```bash
git clone <repository-url>
cd mirai-app
```

### 2. Zainstaluj zależności

```bash
bun install
```

### 3. Uruchomienie środowiska deweloperskiego

Spójrz na jego [dokumentację](../environment/WATCHTOWER.md)

### 4. Przygotowuj schemat bazy danych

```bash
# Generate Drizzle migrations
cd packages/db && bun run db:generate

# Push the schema to the database
cd packages/db && bun run db:push

# Optional: Open Drizzle Studio to view the database
cd packages/db && bun run db:studio
```

> 📖 **Więcej informacji o komendach bazodanowych**: Zobacz [apps/seed/README.md](apps/seed/README.md)

### 5. Uruchom testy (opcjonalnie)

Zweryfikuj swoją konfigurację uruchamiając zestaw testów:

```bash
bun run test
```

> 📖 Zobacz [TESTING.md](TESTING.md) dla więcej szczegółów o konfiguracji testów.

### 6. Uruchom wybraną aplikację

Przed uruchomieniem: 
- spójrz na dokumentację [aplikacji natywnej](apps/native/README.md) oraz [backendu](apps/backend-server/README.md)

#### `bun run dev`

Uruchamia wszystkie aplikacje w trybie developerskim jednocześnie:

- Backend server on `http://localhost:2022`
- Native app (Expo dev server)
- Notification sender service

#### `bun run dev:backend`

Uruchamia tylko serwer backendowy (Hono + oRPC) w trybie deweloperskim (domyślnie port 2022).

#### `bun run dev:native`

Uruchamia tylko aplikację natywną (Expo dev server).

#### `bun run dev:notification-sender`

Uruchamia tylko usługę nadawcy powiadomień dla powiadomień push.
