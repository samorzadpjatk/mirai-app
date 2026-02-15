# Aplikacja mobilna Expo React Native

Natywna aplikacja mobilna Samorządu Studenckiego PJATK zbudowana z użyciem Expo i React Native.

## Technologie

- **Expo SDK 54** z nową architekturą
- **React 19** & **React Native 0.81**
- **Expo Router 6** - routing oparty na systemie plików
- **Supabase** - backend i autentykacja
- **TypeScript** - statyczne typowanie
- **Jest** & **React Native Testing Library** - testy

## Wymagania

- Bun (https://bun.sh) installed
- iOS Simulator (macOS) lub Android Studio (dla emulatora Android)
- Expo Go na urządzeniu fizycznym (opcjonalnie)

## Instalacja

Z katalogu głównego projektu:

```bash
bun install
```

## Dostępne komendy

| Komenda | Opis |
|---------|------|
| `cd apps/native && bun run dev` | Uruchamia serwer deweloperski Expo |
| `cd apps/native && bun run android` | Uruchamia aplikację na emulatorze/urządzeniu Android |
| `cd apps/native && bun run ios` | Uruchamia aplikację na symulatorze/urządzeniu iOS |
| `cd apps/native && bun run web` | Uruchamia aplikację w przeglądarce |
| `cd apps/native && bun run build` | Buduje aplikację do produkcji |
| `cd apps/native && bun run lint` | Sprawdza kod pod kątem błędów ESLint |
| `cd apps/native && bun run lint:fix` | Naprawia automatycznie błędy ESLint |
| `cd apps/native && bun run typecheck` | Sprawdza typy TypeScript |
| `cd apps/native && bun run test` | Uruchamia testy z pokryciem |
| `cd apps/native && bun run format:check` | Sprawdza formatowanie kodu |
| `cd apps/native && bun run format:write` | Formatuje kod |

## Struktura projektu

```
apps/native/
├── src/
│   ├── app/          # Routing Expo Router
│   ├── components/   # Komponenty React
│   └── hooks/        # Custom React hooks
├── assets/           # Obrazy, ikony, czcionki
├── app.json          # Konfiguracja Expo
└── package.json
```

## Uruchomienie z monorepo

Z katalogu głównego projektu:

```bash
# Uruch serwer deweloperski
cd apps/native && bun run dev

# Uruchom na platformie
cd apps/native && bun run android
cd apps/native && bun run ios
```

## Rozwój

1. Uruchom serwer deweloperski: `bun run dev`
2. Zeskanuj kod QR w aplikacji Expo Go lub wybierz platformę (a/i/w)
3. Kod przeładowuje się automatycznie po zapisaniu zmian

## Supabase Storage (MinIO)

Storage działa przez Kong pod adresem `http://localhost:8000/storage/v1` i używa MinIO jako backendu S3.

1. Uruchom środowisko Supabase (docker compose w katalogu `environment`).
2. Wejdź do Supabase Studio (`http://localhost:3000`) i utwórz bucket.
3. Skonfiguruj polityki RLS dla `storage.objects` zgodnie z potrzebami aplikacji.

Aplikacja używa tego samego `EXPO_PUBLIC_SUPABASE_URL` jak dla Auth i Realtime.

## Routing

Aplikacja używa [Expo Router](https://docs.expo.dev/router/introduction/) - routing oparty na systemie plików. Pliki w `src/app/` automatycznie stają się ekranami.

### Struktura nawigacji

```
src/app/
├── _layout.tsx           # Główny layout z konfiguracją Stack Navigation
├── index.tsx             # Ekran główny (po zalogowaniu)
├── auth/
│   ├── login.tsx        # Ekran logowania
│   └── signup.tsx       # Ekran rejestracji
├── users/
│   └── index.tsx        # Lista użytkowników (admin)
├── groups/
│   └── index.tsx        # Lista gildii (admin)
├── coins/
│   └── index.tsx        # Operacje na monetach (admin)
├── transactions/
│   └── index.tsx        # Historia transakcji (admin)
└── notifications/
    └── index.tsx         # Zarządzanie powiadomieniami (admin)
```

### Nawigacja między ekranami

Expo Router zapewnia funkcję `useRouter()` do nawigacji programatycznej:

```tsx
import { useRouter } from "expo-router";

function MyComponent() {
  const router = useRouter();
  
  // Nawigacja do ekranu
  router.push("/users");
  
  // Zamień aktualny ekran (np. po zalogowaniu)
  router.replace("/");
  
  // Powrót
  router.back();
}
```

### Konfiguracja ekranów

W pliku `_layout.tsx` każdy ekran jest skonfigurowany z własnymi opcjami:

- **Auth screens** (`/auth/login`, `/auth/signup`) - bez nagłówka, animacja fade
- **Admin screens** (`/users`, `/groups`, etc.) - z nagłówkiem i tytułem
- **Home screen** (`/`) - bez nagłówka

### Zabezpieczenia dostępu

Każdy ekran administracyjny sprawdza uprawnienia użytkownika i automatycznie przekierowuje na ekran główny, jeśli użytkownik nie ma dostępu (nie jest Admin, Moderator lub Service Account).

## Testowanie

```bash
# Uruchom wszystkie testy
cd apps/native && bun run test

# Testy bez pokrycia (dla CI)
cd apps/native && bun run test:ci
```

## Więcej informacji

- [Dokumentacja Expo](https://docs.expo.dev/)
- [Dokumentacja React Native](https://reactnative.dev/)
- [Dokumentacja Expo Router](https://docs.expo.dev/router/introduction/)
- [Główne README projektu](../../README.md)
