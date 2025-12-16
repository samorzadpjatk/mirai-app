# 🔧 Fix dla Windows

## Problem
Docker Compose nie działa? Błąd `supabase-db-restore`? 

To problem z końcami linii w plikach `.sh` (CRLF zamiast LF).

## Rozwiązanie

**Uruchom w Git Bash** (nie PowerShell):

```bash
./change-unicode.sh
```

Skrypt automatycznie znajdzie i naprawi **wszystkie** pliki `.sh` w całym projekcie.

## Co dalej?

```bash
cd environment/dev
docker compose up -d
```

---

**Wskazówka:** Uruchom `./change-unicode.sh` **przed pierwszym** `docker compose up -d` jeśli klonujesz repo na Windows.
