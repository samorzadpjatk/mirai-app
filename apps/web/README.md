# Integral 2025 - Aplikacja PWA

> **UWAGA**: 
> - Docelowo na tym projekcie zostaje tylko backend na bazie NextJS!
> - Frontend zostanie przeniesiony do projektu aplikacji natywnej
> - definicja API oraz bazy danych na bazie Prisma i tRPC zostanie uwspólniona we wspólnych pakietach

Progressive Web App zbudowana na bazie T3 Stack z obsługą powiadomień push i instalacji na urządzeniach mobilnych.

## Stos Technologiczny

- **[Next.js](https://nextjs.org)** - Framework React z App Router
- **[NextAuth.js](https://next-auth.js.org)** - Uwierzytelnianie z Authentik OIDC
- **[Prisma](https://prisma.io)** - ORM bazy danych z PostgreSQL
- **[tRPC](https://trpc.io)** - Warstwa API z typowaniem
- **[Tailwind CSS](https://tailwindcss.com)** + **[Radix UI](https://www.radix-ui.com/)** - Komponenty UI
- **[Serwist](https://serwist.pages.dev/)** - Service Worker z inteligentnym cachem
- **TypeScript** - Bezpieczeństwo typów w całym stosie

## Szybki Start

Najpierw upewnij się, że ukończyłeś wszystkie kroki z inicjalizacji [środowiska deweloperskiego](../../environment/dev/README.md)

```bash
# Uruchom serwer deweloperski
pnpm dev:web
```

Aplikacja będzie dostępna pod adresem: `http://localhost:11000`

## Konfiguracja

### Zmienne Środowiskowe

Skopiuj `.env.example` do `.env` i uzupełnij:

```bash
# Auth secret (wygeneruj: npx auth secret)
AUTH_SECRET="..."

# Database
DATABASE_URL="postgresql://..."

# Authentik OIDC
AUTH_SECRET="..."
AUTH_AUTHENTIK_ID="..."
AUTH_AUTHENTIK_SECRET="..."
AUTH_AUTHENTIK_ISSUER="..."

# VAPID dla powiadomień push (wygeneruj: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_EMAIL="your-email@example.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..." # musi być taki sam jak VAPID_PUBLIC_KEY

# Supabase
SUPABASE_PROJECT_KEY="..."
SUPABASE_PROJECT_URL="..."
```

### Ikony PWA

Umieść w katalogu `/public/`:
- `icon-192x192.png`
- `icon-256x256.png`
- `icon-384x384.png`
- `icon-512x512.png`

## Testowanie PWA

1. **Service Worker**: Chrome DevTools → Application → Service Workers
2. **Manifest**: Chrome DevTools → Application → Manifest
3. **Instalacja**: Kliknij ikonę instalacji w pasku adresu
4. **Powiadomienia**: Admin Dashboard → PWA & Powiadomienia
5. **Offline**: Network tab → zaznacz "Offline" i odśwież stronę

## Skrypty

```bash
# Develompent
pnpm --filter @integral-2025-app/web dev                # Uruchom serwer deweloperski (port 11000)
pnpm --filter @integral-2025-app/web build              # Zbuduj aplikację produkcyjną
pnpm --filter @integral-2025-app/web start              # Uruchom serwer produkcyjny (port 11001)

# Database (teraz w @integral-2025-app/db)
pnpm --filter @integral-2025-app/db db:generate        # Uruchom migracje Prisma
pnpm --filter @integral-2025-app/db db:studio          # Otwórz Prisma Studio
pnpm --filter @integral-2025-app/db db:seed            # Załaduj przykładowe dane
pnpm --filter @integral-2025-app/db db:reset           # Resetuj bazę danych

# 📖 Pełna dokumentacja komend bazodanowych: packages/db/README.md

# Quality
pnpm --filter @integral-2025-app/web lint               # Sprawdź kod (ESLint)
pnpm --filter @integral-2025-app/web typecheck          # Sprawdź typy (TypeScript)
pnpm --filter @integral-2025-app/web test               # Uruchom testy (Vitest)
pnpm --filter @integral-2025-app/web format:check       # Sprawdź formatowanie (Prettier)
pnpm --filter @integral-2025-app/web format:write       # Napraw formatowanie
```

## Struktura Projektu

```
apps/web/
├── prisma/              # Schema i migracje bazy danych
├── public/              # Statyczne pliki (manifest.json, ikony)
├── src/
│   ├── app/            # Next.js App Router (strony)
│   ├── components/     # Komponenty React
│   ├── server/         # Backend (tRPC, auth, db)
│   ├── trpc/           # Klient tRPC
│   └── utils/          # Narzędzia pomocnicze
└── sw.ts               # Service Worker (Serwist)
```

## Więcej Informacji

- [Szczegółowa dokumentacja PWA](../../docs/PWA_README.md)
- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)