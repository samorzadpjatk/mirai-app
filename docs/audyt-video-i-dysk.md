# Audyt wideo i miejsca na dysku

**Issue:** #15 — „Czy umożliwiamy VIDEO? sprawdzić ile mamy miejsca na dysku"
**Gałąź:** `chore/video-storage-audit`
**Zakres:** wyłącznie audyt. Ten dokument nie zmienia żadnego kodu aplikacji.
**Data audytu:** wrzesień 2026
**Stan repozytorium:** `main` @ `b3a5a9ae`

---

## 1. Streszczenie kierownicze

Wideo w MIRAI **istnieje w kodzie, ale nie działa jako funkcja produktowa**.

Uczestnik może wybrać film z galerii i go wysłać. Od tego momentu film jest praktycznie
niewidoczny: uczestnik nie zobaczy nawet własnego zgłoszenia (dostanie komunikat
„Submission has no image asset."), inne grupy go nie zobaczą w feedzie społecznościowym,
a oba ekrany głosowania **cicho odrzucają** zgłoszenia wideo, mimo że formularz admina
jawnie zezwala na kombinację `VIDEO` + `PEER_VOTING`. Jedyne miejsce w całej aplikacji,
gdzie film da się odtworzyć, to ekran oceniania kadry (`admin/challenges/judgement.tsx`),
chroniony guardem `isAdmin`.

Do tego dochodzą trzy problemy infrastrukturalne, z których każdy sam w sobie
wystarczyłby, żeby wstrzymać włączenie funkcji:

1. **Brak jakiegokolwiek limitu rozmiaru i długości nagrania po stronie klienta.**
   Jedyny realny limit to globalny `FILE_SIZE_LIMIT: 52428800` (50 MiB) w Supabase Storage.
   Typowe nagranie z iPhone'a przekracza go po kilkunastu–kilkudziesięciu sekundach,
   a użytkownik dowiaduje się o tym dopiero po zakończeniu długiego uploadu, w postaci
   surowego błędu `tus` w `Alert.alert`.
2. **Walidacja `contentType` na serwerze jest jednocześnie zepsuta i martwa.**
   Regex odrzuca prawdziwe typy MIME z iPhone'a, a klient i tak nigdy nie wysyła tego pola.
3. **Nazwy bucketów w kodzie, w seedzie i w politykach RLS to trzy różne zestawy nazw.**
   Polityki RLS w `environment/volumes/db/init/data.sql` dotyczą bucketów, które w ogóle
   nie istnieją w kodzie aplikacji.

Dodatkowo: **usunięcie zgłoszenia nie usuwa pliku ze Storage**, a `docs/conventions/data-retention.md`
nie definiuje żadnej polityki dla `challenge_submissions` ani dla obiektów Storage. Zużycie
dysku rośnie więc monotonicznie i nic go nie sprząta.

**Rekomendacja skrótowo:** patrz sekcja 7. Warunkowe „tak", ale dopiero po zmierzeniu
wolnego miejsca (sekcja 6) i po wykonaniu minimum z sekcji 5.1.

---

## 2. Metoda i ograniczenia

Audyt jest oparty wyłącznie na lekturze kodu w tym repozytorium. **Nie było i nie ma
dostępu do serwera produkcyjnego** — nie nawiązywano połączenia VPN ani SSH. Wszystkie
liczby dotyczące faktycznego zużycia dysku muszą zostać zmierzone przez operatora;
gotowe komendy read-only znajdują się w sekcji 6.

Weryfikowane pliki (ścieżki względem korzenia repo):

| Obszar | Pliki |
| --- | --- |
| Wybór pliku i wysyłka | `apps/native/src/hooks/challenges/useChallengeCapture.ts`, `apps/native/src/hooks/files/useFileUpload.ts`, `apps/native/src/utils/image.ts` |
| Pobieranie i odtwarzanie | `apps/native/src/hooks/files/useFileDownload.ts`, `apps/native/src/components/judgement/SubmissionAssetPreview.tsx` |
| Ekrany | `apps/native/src/app/(tabs)/trips/challenges/[id].tsx`, `apps/native/src/app/(tabs)/trips/challenges/vote/[id].tsx`, `apps/native/src/app/(tabs)/admin/challenges/staff-vote.tsx`, `apps/native/src/app/(tabs)/admin/challenges/judgement.tsx`, `apps/native/src/app/(tabs)/admin/_layout.tsx` |
| Komponenty | `apps/native/src/components/admin/challenges/SubmissionReviewCard.tsx`, `apps/native/src/components/trips/challenges/ExistingSubmissionCard.tsx`, `apps/native/src/components/trips/challenges/ChallengeCommunitySubmissionsCard.tsx` |
| Backend / Storage | `packages/orpc/src/api/routers/storage/index.ts`, `packages/orpc/src/api/routers/storage/queries.ts`, `packages/orpc/src/api/routers/storage/utils.ts`, `packages/orpc/src/utils/storage.ts` |
| Reguły współdzielone | `packages/common/src/storage/standard.ts`, `packages/common/src/storage/resolveStorageUrl.ts`, `packages/common/src/challenges/validators.ts`, `packages/common/src/challengeSubmissions/validators.ts` |
| Baza | `packages/db/src/schema/enums.ts`, `packages/db/src/schema/challenges.ts`, `packages/orpc/src/api/routers/challengeSubmission/*` |
| Infrastruktura | `environment/docker-compose.prod.yml`, `environment/volumes/db/init/data.sql`, `environment/.env.example`, `apps/seed/src/config/env.ts`, `apps/seed/src/storage.ts`, `apps/seed/.env.example` |

---

## 3. Ścieżka wideo end-to-end — co faktycznie się dzieje

### 3.1 Wybór pliku (capture)

Jedyne wejście dla wideo to `pickVideoFromGallery` w
`apps/native/src/hooks/challenges/useChallengeCapture.ts:215`:

```ts
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: "videos",
  allowsEditing: false,
  quality: 0.8,
});
```

Uwagi:

- **Nie ma nagrywania w aplikacji.** Wyłącznie wybór gotowego pliku z galerii
  (`launchImageLibraryAsync`). Dla zdjęć istnieje osobna ścieżka kamery
  (`handleOpenChallengeCamera`), dla wideo nie.
- **`quality: 0.8` nic tu nie robi.** W `expo-image-picker` `quality` dotyczy wyłącznie
  obrazów. Za jakość wideo odpowiada osobna opcja `videoQuality` — **nie jest ustawiona**,
  więc plik trafia do uploadu w oryginalnej rozdzielczości urządzenia (na nowszych
  iPhone'ach domyślnie 4K).
- **`videoMaxDuration` nie jest ustawione.** Nie ma żadnego limitu długości nagrania.

Wywołanie: `apps/native/src/app/(tabs)/trips/challenges/[id].tsx:398`, funkcja
`handleVideoChallengeAction`, aktywna gdy `challenge.submissionType === "VIDEO"`.

### 3.2 Zapis rekordu w bazie i upload

`submitVideoAsset` (`useChallengeCapture.ts:233`) najpierw tworzy rekord zgłoszenia,
potem wysyła plik:

```ts
const extension = getFileExtension(asset);
const storagePath = buildStoragePath(challengeId, groupId, extension);
const submission = await createSubmissionMutation.mutateAsync({
  tripId, challengeId, videoId: storagePath,
});
// ...
const config = buildUploadConfig(asset, storagePath, extension);
await upload(config);
```

Ścieżka obiektu ma postać `challenge/{challengeId}/{groupId}-{timestamp}.{ext}`
(`buildStoragePath`, linia 37). Kolejność operacji (najpierw rekord, potem plik) jest
świadoma — przy błędzie uploadu jest `deleteSubmissionMutation` w bloku `catch`.

Upload realizuje `useFileUpload` (`apps/native/src/hooks/files/useFileUpload.ts`)
protokołem resumable `tus` (`chunkSize: 6 * 1024 * 1024`) bezpośrednio do Supabase Storage,
z tokenem z `storage.createUploadUrl`.

### 3.3 Rozstrzyganie bucketu

Bucket nie jest przekazywany przez klienta — jest **wnioskowany z rozszerzenia pliku**.
`packages/orpc/src/utils/storage.ts` (`inferBucketFromPath`) oraz jego bliźniacza kopia
w `packages/common/src/storage/resolveStorageUrl.ts:43`:

```ts
if (normalized.startsWith("challenge/")) {
  const extension = getFileExtension(normalized);
  const bucket = extension && VIDEO_EXTENSIONS.has(extension) ? VIDEO_BUCKET : IMAGE_BUCKET;
  return { bucket, path: normalized };
}
```

gdzie `VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "avi", "mkv"])`.

Konsekwencja: **jeśli rozszerzenie nie trafi na tę listę, film wyląduje w buckecie `images`.**
`getFileExtension` w `apps/native/src/utils/image.ts:5` ma domyślny fallback `"jpg"` — więc
plik wideo z nietypowym lub brakującym rozszerzeniem trafia do `images` z rozszerzeniem `.jpg`.

### 3.4 Odtwarzanie — gdzie jest, a gdzie go nie ma

W całym repozytorium **istnieje dokładnie jeden odtwarzacz wideo**. `expo-video`
(`VideoView`, `useVideoPlayer`) jest importowane w jednym pliku produkcyjnym:
`apps/native/src/components/judgement/SubmissionAssetPreview.tsx:2`.

Łańcuch dostępu:

```
admin/challenges/judgement.tsx   (Stack.Protected guard={isAdmin})
  └─ JudgementContent
      └─ CardStack
          └─ CurrentSubmissionCard
              └─ SubmissionAssetPreview   ← jedyny VideoView w aplikacji
```

`isAdmin` pochodzi z `hasAdminAccess(user?.role)`, czyli `ADMIN` lub `MODERATOR`
(`packages/common/src/users/hasAdminAccess.ts`). Ekran `challenges/judgement`
znajduje się wewnątrz bloku `<Stack.Protected guard={isAdmin}>`
(`apps/native/src/app/(tabs)/admin/_layout.tsx`, linie 30–213).

**Zwykły uczestnik nie ma dostępu do żadnego odtwarzacza wideo w aplikacji.**

Dodatkowo w samym `SubmissionAssetPreview` obraz ma priorytet nad wideo: gałąź
`if (hasImage)` (linia 90) zwraca wcześniej niż `if (hasVideo)` (linia 144). Zgłoszenie
zawierające i obraz, i film pokaże wyłącznie obraz.

---

## 4. Zidentyfikowane problemy

Numeracja P1–P9. Waga: **Krytyczny** = blokuje funkcję, **Wysoki** = poważny błąd
funkcjonalny lub ryzyko operacyjne, **Średni** = pogarsza jakość/koszt.

### P1 — Uczestnik nie może obejrzeć żadnego wideo. Także własnego. (Krytyczny)

Po wysłaniu filmu uczestnik trafia na `ExistingSubmissionCard`
(`apps/native/src/components/trips/challenges/ExistingSubmissionCard.tsx`), który obsługuje
wyłącznie `submission.imageIds[0]` (linia 90). `hasImage` to
`submission.imageIds.length > 0` (linia 49), więc dla zgłoszenia wideo jest `false`
i renderuje się gałąź z linii 105:

```tsx
{!hasImage && (
  <View style={styles.noImageRow}>
    <Ionicons name="information-circle-outline" ... />
    <Text style={styles.noImageText}>Submission has no image asset.</Text>
  </View>
)}
```

Czyli: użytkownik wysyła film, czeka na upload, a aplikacja odpowiada mu, że jego
zgłoszenie **nie ma treści**. To jest sprzeczny komunikat, który w praktyce wygląda
jak utrata danych.

Ten sam problem w feedzie społecznościowym —
`apps/native/src/components/trips/challenges/ChallengeCommunitySubmissionsCard.tsx:47`:

```ts
export function filterImageSubmissions(submissions: CommunitySubmission[]): CommunitySubmission[] {
  return submissions.filter(
    (submission) => submission.status === "APPROVED" && Boolean(submission.imageIds[0]),
  );
}
```

Zatwierdzone zgłoszenia wideo nie pojawiają się w feedzie w ogóle.

### P2 — Oba ekrany głosowania cicho odrzucają zgłoszenia wideo (Krytyczny)

`apps/native/src/app/(tabs)/trips/challenges/vote/[id].tsx:234-245` (głosowanie uczestników):

```ts
const votingSubmissions: VotingSubmission[] = useMemo(() => {
  const raw = submissionsData ?? [];
  return raw
    .filter((submission) => Boolean(submission.imageIds[0]))
    .filter((submission) => (ownGroupId ? submission.groupId !== ownGroupId : true))
    .map((submission) => ({
      id: submission.id,
      groupId: submission.groupId,
      groupName: submission.group.name,
      imagePath: submission.imageIds[0] ?? "",
      createdAt: submission.createdAt,
    }));
}, [submissionsData, ownGroupId]);
```

`apps/native/src/app/(tabs)/admin/challenges/staff-vote.tsx:100-110` (głosowanie kadry) —
identyczny filtr `.filter((submission) => Boolean(submission.imageIds[0]))`.

W obu przypadkach model `VotingSubmission` niesie tylko `imagePath` — nie ma pola na wideo.

Jednocześnie `packages/common/src/challenges/validators.ts:25-31` **jawnie dopuszcza**
kombinację wideo z głosowaniem:

```ts
if (
  input.scoringCategory === "PEER_VOTING" &&
  input.submissionType !== "IMAGE" &&
  input.submissionType !== "VIDEO"
) {
  errors.push("Peer voting is supported only for IMAGE or VIDEO challenges");
}
```

a formularz admina wystawia `{ label: "Video", value: "VIDEO" }` obok
`{ label: "Peer Voting", value: "PEER_VOTING" }`
(`apps/native/src/components/admin/challenges/challengeFormConstants.ts:3-17`).

Efekt: kadra może utworzyć wyzwanie wideo z głosowaniem, uczestnicy mogą wysłać filmy,
a w fazie głosowania talia jest pusta i **nikt nie dostaje punktów** — bez żadnego
komunikatu o błędzie.

> **Nie naprawiamy tego w tej gałęzi.** Pakiet prac 7 (gałąź `fix/challenges-voting`)
> zajmuje się głosowaniem. Ten dokument tylko dokumentuje stan i wskazuje, że pełne
> wsparcie wideo w głosowaniu wymaga czegoś więcej niż zdjęcia filtra: `VotingSubmission`
> musi zyskać ścieżkę wideo, a karty porównania — odtwarzacz.

### P3 — Ekran zgłoszeń admina pokazuje tylko ikonę zamiast filmu (Wysoki)

`apps/native/src/components/admin/challenges/SubmissionReviewCard.tsx:128-133`:

```tsx
{!hasImage && submission.videoId ? (
  <View style={styles.assetFallbackBox}>
    <Ionicons name="videocam-outline" size={24} color={palette.textMuted} />
    <Text style={styles.mediaFallbackText}>Video submission</Text>
  </View>
) : null}
```

Kadra na ekranie `admin/challenges/submissions.tsx` widzi placeholder, a przyciski
„Set approved" / „Set rejected" są w pełni aktywne. Czyli **moderator akceptuje lub
odrzuca treść, której nie obejrzał**. Jedyna droga do obejrzenia to przełączenie się
na osobny ekran `judgement.tsx`.

### P4 — Brak limitu rozmiaru i długości. Jedyny realny limit to 50 MiB w Storage (Krytyczny)

Nie ma limitu **nigdzie**: ani w pickerze, ani w kliencie przed uploadem, ani w routerze oRPC.

Co konkretnie stwierdzono:

1. **Picker** (`useChallengeCapture.ts:219-223`) nie ustawia `videoMaxDuration`
   ani `videoQuality`.
2. **Klient** (`useFileUpload.ts:139-150`) **odczytuje rozmiar pliku**, ale go nie sprawdza:

   ```ts
   const fileInfo = new File(input.fileUri);
   if (!fileInfo.exists) { throw new Error("File not found"); }
   // ...
   const bytesTotal = fileInfo.size ?? fileBlob.size ?? null;
   ```

   `bytesTotal` służy wyłącznie do paska postępu. Nie ma porównania z żadnym progiem.
3. **Router oRPC** (`packages/orpc/src/api/routers/storage/index.ts:39-43`) deklaruje pole
   `fileSize` z limitem 10 MiB:

   ```ts
   fileSize: z.number().int().max(10 * 1024 * 1024).optional(),
   ```

   ale to pole jest **opcjonalne**, **klient go nigdy nie wysyła**
   (`useFileUpload.ts:144-147` przesyła wyłącznie `storagePath` i `upsert`)
   i **handler nigdy go nie odczytuje** — w `createUploadUrl`
   (`packages/orpc/src/api/routers/storage/queries.ts:14-53`) `input.fileSize` nie
   występuje ani razu. To jest walidacja pozorna.
4. Z natury rzeczy serwer i tak **nie mógłby** tego wyegzekwować w obecnej architekturze:
   `createUploadUrl` zwraca podpisany URL i plik leci `tus`-em prosto do Supabase Storage,
   z pominięciem backendu.

Jedyny **działający** limit to globalna zmienna serwisu Storage,
`environment/docker-compose.prod.yml:366`:

```yaml
FILE_SIZE_LIMIT: 52428800
```

Czyli **50 MiB**. Aplikacja nigdy tej wartości nie czyta i nie komunikuje.

**Praktyczne konsekwencje.** Orientacyjne bitrate'y nagrań z telefonu:

| Tryb nagrania | Ok. rozmiar / minutę | Ile mieści się w 50 MiB |
| --- | --- | --- |
| 1080p30, HEVC („High Efficiency") | ~40–60 MB | ok. 50–75 s |
| 1080p30, H.264 („Most Compatible") | ~130–175 MB | ok. 17–23 s |
| 4K30, HEVC | ~170 MB | ok. 18 s |
| 4K60, HEVC | ~250–350 MB | ok. 9–18 s |

Ponieważ `videoQuality` nie jest ustawione, obowiązuje domyślna (najwyższa) jakość
urządzenia. Realny scenariusz jest więc taki: uczestnik wybiera 40-sekundowy film 4K
(~110 MB), aplikacja wysyła go przez sieć hotelową / komórkową, po kilku minutach
serwer odrzuca żądanie, a `catch` w `submitVideoAsset` pokazuje:

```ts
const message = error instanceof Error ? error.message : "Failed to submit challenge";
Alert.alert("Upload Failed", message);
```

czyli surowy komunikat biblioteki `tus` (np. z kodem HTTP), **nie** informację
„film jest za duży, nagraj krótszy". Do tego `useFileUpload` ma logikę ponawiania
(`shouldRetryErrorMessage` łapie m.in. `" 400"`), więc przy części błędów cały upload
zostanie **powtórzony od zera** — podwajając transfer, zanim się ostatecznie wywali.

### P5 — Regex `contentType` jest jednocześnie zepsuty i martwy (Wysoki)

`packages/orpc/src/api/routers/storage/index.ts:44-50`:

```ts
contentType: z
  .string()
  .regex(
    /^image\/(jpeg|png|webp|gif)|application\/pdf|video\/(mp4|mov|webm)$/,
    "Unsupported content type",
  )
  .optional(),
```

**Błąd pierwszy — priorytet operatorów.** W wyrażeniu regularnym alternatywa `|` ma
najniższy priorytet, więc kotwice `^` i `$` należą tylko do skrajnych gałęzi. Faktycznie
zapisano:

```
(^image\/(jpeg|png|webp|gif))  |  (application\/pdf)  |  (video\/(mp4|mov|webm)$)
```

Środkowa gałąź nie jest zakotwiczona wcale. Wynik uruchomienia tego wyrażenia
(zweryfikowane empirycznie na tym samym literale):

| Typ MIME | Wynik | Komentarz |
| --- | --- | --- |
| `image/jpeg` | PRZECHODZI | OK |
| `video/mp4` | PRZECHODZI | OK |
| `video/webm` | PRZECHODZI | OK |
| `application/pdf` | PRZECHODZI | OK |
| **`video/quicktime`** | **ODRZUCA** | to jest MIME pliku `.mov` z iPhone'a |
| **`video/x-m4v`** | **ODRZUCA** | `.m4v`, też iOS |
| `image/heic` | ODRZUCA | domyślny format zdjęć iPhone'a |
| `image/jpeg-and-more` | PRZECHODZI | brak kotwicy `$` w pierwszej gałęzi |
| `evil/exe application/pdf hack` | PRZECHODZI | środkowa gałąź bez kotwic |

**Błąd drugi — nieistniejący typ MIME.** Gałąź `video/mov` odnosi się do typu, który
nie istnieje. Zarejestrowanym typem dla kontenera QuickTime jest `video/quicktime`.
Regex akceptuje więc typ, którego żadne urządzenie nie wyśle, i odrzuca ten, który
faktycznie przychodzi z iPhone'a.

**Błąd trzeci — to i tak jest martwy kod.** Klient nigdy nie przekazuje `contentType`
do `createUploadUrl`. `useFileUpload.ts:144-147`:

```ts
const uploadTicket = await orpcClient.storage.createUploadUrl.call({
  storagePath: input.storagePath,
  upsert: input.upsert,
});
```

`contentType` jest wyliczany (`useFileUpload.ts:143`, przez `getFileContentType`
w `apps/native/src/utils/image.ts:29`, który poprawnie zwraca `video/quicktime` dla `.mov`)
i wędruje wyłącznie do metadanych `tus` (`buildTusUploadOptions`, linie 84–88).
Do walidacji serwerowej nie trafia nigdy.

**Wniosek:** faktyczna walidacja typu zawartości po stronie serwera wynosi **zero**.
Do bucketa można wgrać dowolny typ pliku. A gdyby ktoś „naprawił" klienta, dopisując
`contentType` do wywołania bez poprawienia regexa, **natychmiast rozwaliłby wysyłkę
wideo z iPhone'a**, bo `video/quicktime` jest odrzucane.

### P6 — Cały film pobiera się od nowa przy każdym zamontowaniu ekranu (Wysoki)

`apps/native/src/components/judgement/SubmissionAssetPreview.tsx:57-74`:

```ts
useEffect(() => {
  if (!hasVideo) {
    resetVideo();
    return;
  }

  resetVideo();
  void downloadVideo({
    storagePath: submission.videoId ?? "",
    skipCache: true,
  }).catch(() => {
    // Video may be temporarily unavailable; render fallback instead.
  });

  return () => {
    abortVideo();
  };
}, [abortVideo, downloadVideo, hasVideo, resetVideo, submission.videoId]);
```

Co robi `skipCache: true` — `apps/native/src/hooks/files/useFileDownload.ts:156-170`:

```ts
if (stableCachedFile.exists && !input.skipCache) {
  // ... zwróć plik z cache, koniec
}
if (stableCachedFile.exists && input.skipCache) {
  try {
    stableCachedFile.delete();
  } catch { /* Silently ignore cache cleanup errors */ }
}
```

i analogicznie dla `targetFile` (linie 183–200). Czyli flaga nie tylko pomija cache —
**aktywnie kasuje już pobrany plik**, po czym `File.downloadFileAsync` ściąga go
w całości od nowa.

To jest ta sama flaga, która dla obrazów jest używana świadomie przy podmianie zdjęcia
(`trips/challenges/[id].tsx:199`, `deleteCachedDownload`). Tutaj jednak dotyczy plików
o dwa rzędy wielkości większych i pliku, który się nie zmienia.

Skutek dla kadry oceniającej talię zgłoszeń: **każde przewinięcie karty w tył i w przód
to ponowne pobranie całego filmu.** Przy 20 zgłoszeniach po 40 MB i kilku przejściach
przez talię to kilka GB transferu na jednego oceniającego, na łączu wyjazdowym.
Dodatkowo `useVideoPlayer` dostaje `useCaching: true` (linia 32) — cache `expo-video`
jest włączony, ale nie ma czego cachować, bo źródłowy plik został właśnie skasowany
i pobrany pod nową nazwę.

Nie ma też żadnego sprzątania katalogu `Paths.cache/downloads` — poza `skipCache`
i `deleteCachedDownload` nic nie usuwa pobranych plików z telefonu.

### P7 — Trzy różne zestawy nazw bucketów. Polityki RLS dotyczą bucketów, które nie istnieją (Wysoki)

To, czego **oczekuje kod aplikacji** — `packages/common/src/storage/standard.ts:7-11`:

```ts
export const STANDARD_BUCKETS = {
  IMAGES: "images",
  VIDEOS: "videos",
  PUBLIC: "files-public",
} as const;
```

Ta stała jest jedynym źródłem prawdy dla `packages/orpc/src/utils/storage.ts`
i dla `resolveStoragePath` (`packages/orpc/src/api/routers/storage/utils.ts:11-23`),
który odrzuca każdy bucket spoza tej listy błędem `BAD_REQUEST`.
Nazwy są **zaszyte na sztywno** — żadna zmienna środowiskowa ich nie nadpisuje.

To, co **tworzy seed** — `apps/seed/src/config/env.ts:4-6`:

```ts
imageBucket: process.env.SUPABASE_STORAGE_IMAGE_BUCKET ?? "image",
videoBucket: process.env.SUPABASE_STORAGE_VIDEO_BUCKET ?? "video",
publicBucket: process.env.SUPABASE_STORAGE_PUBLIC_BUCKET ?? "files-public",
```

Fallbacki są w **liczbie pojedynczej** (`image`, `video`). `apps/seed/.env.example:6-8`
podaje wprawdzie liczbę mnogą:

```
SUPABASE_STORAGE_PUBLIC_BUCKET="files-public"
SUPABASE_STORAGE_IMAGE_BUCKET="images"
SUPABASE_STORAGE_VIDEO_BUCKET="videos"
```

ale **`environment/.env.example` nie definiuje tych zmiennych w ogóle**. Jeżeli seed
zostanie uruchomiony bez własnego `apps/seed/.env`, `ensureBuckets`
(`apps/seed/src/storage.ts:19-35`) utworzy buckety `image` i `video`, do których
aplikacja nigdy nie sięgnie, a bucketów `images` i `videos` nie utworzy wcale.

To, co **zakłada RLS** — `environment/volumes/db/init/data.sql` w całości:

```sql
-- Allow authenticated users to insert/update/delete any objects in image/video buckets.
alter table storage.objects enable row level security;

drop policy if exists "storage_objects_auth_insert_image_video_avatar" on storage.objects;
create policy "storage_objects_auth_insert_image_video"
on storage.objects
for insert
to authenticated
with check (bucket_id in ('image', 'video', 'avatar'));

drop policy if exists "storage_objects_auth_update_image_video_avatar" on storage.objects;
create policy "storage_objects_auth_update_image_video"
on storage.objects
for update
to authenticated
using (bucket_id in ('image', 'video'))
with check (bucket_id in ('image', 'video', 'avatar'));

drop policy if exists "storage_objects_auth_delete_image_video_avatar" on storage.objects;
create policy "storage_objects_auth_delete_image_video_avatar"
on storage.objects
for delete
to authenticated
using (bucket_id in ('image', 'video', 'avatar'));
```

Zestawienie:

| Bucket | Kod aplikacji (`STANDARD_BUCKETS`) | Seed (fallback) | Seed (`.env.example`) | Polityki RLS |
| --- | --- | --- | --- | --- |
| obrazy | `images` | `image` | `images` | `image` |
| wideo | `videos` | `video` | `videos` | `video` |
| publiczny | `files-public` | `files-public` | `files-public` | — (brak polityki) |
| — | — | — | — | `avatar` (nie istnieje nigdzie w kodzie) |

**Żadna z trzech polityk nie obejmuje bucketu, którego faktycznie używa aplikacja.**
Bucket `avatar` nie występuje w kodzie w ogóle — ścieżki `avatar/` są mapowane na bucket
`images` (`packages/orpc/src/utils/storage.ts`, `inferBucketFromPath`).

Trzy dodatkowe problemy z tym plikiem:

1. **Niespójne nazwy polityk.** Dla `insert` i `update` skrypt usuwa politykę o nazwie
   `..._image_video_avatar`, a tworzy `..._image_video`. Dla `delete` usuwa i tworzy tę
   samą nazwę. Wygląda to na niedokończoną migrację nazewnictwa.
2. **Skrypt nie jest idempotentny.** Ponowne uruchomienie na tej samej bazie wywali się:
   `DROP POLICY IF EXISTS "..._insert_image_video_avatar"` nie usunie nic (bo istnieje
   już `..._insert_image_video`), a `CREATE POLICY "..._insert_image_video"` zgłosi błąd
   „policy already exists" — PostgreSQL 15 nie wspiera `CREATE POLICY IF NOT EXISTS`
   ani `CREATE OR REPLACE POLICY`.
3. **Ten skrypt prawdopodobnie nigdy nie wykonał się na produkcji.**
   `environment/docker-compose.prod.yml:516` montuje go jako:

   ```yaml
   - ./volumes/db/init/data.sql:/docker-entrypoint-initdb.d/init-scripts/97-data.sql:Z
   ```

   Skrypty z `docker-entrypoint-initdb.d` obraz `postgres` uruchamia **wyłącznie przy
   inicjalizacji pustego katalogu `PGDATA`**. `PGDATA` jest tu bind-mountem
   (`./volumes/db/data:/var/lib/postgresql/data`), więc po pierwszym starcie skrypt jest
   ignorowany. Stan RLS na produkcji trzeba zweryfikować zapytaniem z sekcji 6.1.

**Do zweryfikowania przez operatora:** jaki jest faktyczny stan `storage.buckets`
i `pg_policies` na produkcji (zapytania w sekcji 6.1). Możliwe, że działa to wyłącznie
dlatego, że backend używa `SERVICE_ROLE_KEY`, który omija RLS — w takim razie
przy wysyłce tokenem użytkownika obowiązują polityki i sytuacja wymaga sprawdzenia
oddzielnie.

### P8 — Usunięcie zgłoszenia nie usuwa pliku. Brak jakiejkolwiek retencji (Wysoki, kosztowy)

`packages/orpc/src/api/routers/challengeSubmission/mutations.ts:460` (`deleteMineSubmission`)
oraz linia 689 (usunięcie administracyjne) wykonują wyłącznie:

```ts
await context.db.delete(challengeSubmissions).where(eq(challengeSubmissions.id, input.id));
```

Żadne wywołanie `supabase.storage.from(...).remove(...)` nie występuje w `packages/orpc/src`
ani w `apps/backend-server/src`. Jedyne miejsce w repo, które kasuje obiekty ze Storage,
to `apps/seed/reset.ts` — skrypt developerski, który czyści buckety w całości.

To dotyczy również ścieżki „retake": `handleRetake` w `useChallengeCapture.ts:327`
usuwa rekord zgłoszenia, ale plik już wgrany do Storage zostaje. Przy `upsert: true`
i ścieżce zawierającej `Date.now()` **każda kolejna próba tworzy nowy obiekt**, a stary
zostaje osierocony na zawsze.

`docs/conventions/data-retention.md` definiuje polityki dla `notification_pushes`,
`activity_feeds`, `coin_transactions` i `audit_logs`. **Nie ma tam ani słowa
o `challenge_submissions` ani o obiektach w Supabase Storage** — czyli o jedynych
danych, które faktycznie rosną w tempie liniowym do liczby uczestników i mają
rozmiar liczony w megabajtach na sztukę.

Zapytanie liczące osierocone pliki znajduje się w sekcji 6.1.

### P9 — Wnioskowanie bucketu z rozszerzenia jest kruche (Średni)

Opisane w 3.3. Dodatkowo logika `inferBucketFromPath` jest **zduplikowana** w dwóch
pakietach: `packages/orpc/src/utils/storage.ts` i `packages/common/src/storage/resolveStorageUrl.ts:31`.
Obie kopie mają dziś tę samą listę `VIDEO_EXTENSIONS`, ale nic tego nie wymusza —
rozjazd między nimi objawi się jako „film wgrał się, ale nie da się go pobrać".

---

## 5. Co musi się zmienić, żeby wideo było realnie używalne

Uporządkowane rosnąco według nakładu pracy. Punkty w grupie S są konieczne nawet dla
minimalnego, „awaryjnego" włączenia wideo.

### 5.1 Nakład S — godziny, zmiany punktowe

| # | Zmiana | Plik | Rozwiązuje |
| --- | --- | --- | --- |
| S1 | Ustawić `videoMaxDuration` (proponowane 30 s) i `videoQuality` (720p) w `launchImageLibraryAsync` | `apps/native/src/hooks/challenges/useChallengeCapture.ts:219` | P4 |
| S2 | Sprawdzić `fileInfo.size` przed startem uploadu i pokazać zrozumiały komunikat po polsku, zamiast surowego błędu `tus` po kilku minutach | `apps/native/src/hooks/files/useFileUpload.ts:139` | P4 |
| S3 | Wynieść limit 50 MiB do wspólnej stałej w `packages/common/src/storage` i użyć jej po obu stronach zamiast literałów | `packages/common/src/storage/standard.ts`, `environment/docker-compose.prod.yml:366` | P4 |
| S4 | Naprawić regex: zakotwiczyć całość i wymienić `video/mov` na `video/quicktime`, dodać `video/x-m4v` | `packages/orpc/src/api/routers/storage/index.ts:47` | P5 |
| S5 | Faktycznie przesyłać `contentType` i `fileSize` z klienta — **dopiero po S4**, inaczej wysyłka z iPhone'a przestanie działać | `apps/native/src/hooks/files/useFileUpload.ts:144` | P5 |
| S6 | Usunąć `skipCache: true` dla wideo (obiekty są niemutowalne — ścieżka zawiera timestamp, więc cache nigdy nie będzie nieświeży) | `apps/native/src/components/judgement/SubmissionAssetPreview.tsx:66` | P6 |
| S7 | Usunąć fallbacki `"image"` / `"video"` w seedzie — wymagać jawnej wartości albo użyć `STANDARD_BUCKETS` | `apps/seed/src/config/env.ts:4-5` | P7 |
| S8 | Dodać `SUPABASE_STORAGE_*_BUCKET` do `environment/.env.example` | `environment/.env.example` | P7 |

### 5.2 Nakład M — od jednego do trzech dni

| # | Zmiana | Rozwiązuje |
| --- | --- | --- |
| M1 | Poprawić `environment/volumes/db/init/data.sql`: właściwe nazwy bucketów (`images`, `videos`, `files-public`), spójne nazwy polityk, idempotencja (`drop policy if exists` z tą samą nazwą, którą się potem tworzy). Osobno wykonać ten skrypt na istniejącej produkcyjnej bazie — `docker-entrypoint-initdb.d` się nie odpali (P7 pkt 3). | P7 |
| M2 | Ustawić per-bucket `file_size_limit` i `allowed_mime_types` w `storage.buckets` dla bucketu `videos` — to jedyny limit, który Supabase faktycznie egzekwuje niezależnie od klienta. Zrobić to w seedzie (`createBucket` przyjmuje te opcje) oraz migracją na produkcji. | P4 |
| M3 | Wyekstrahować wspólny komponent odtwarzacza (np. `apps/native/src/components/media/SubmissionVideoPlayer.tsx`) z `SubmissionAssetPreview` i podpiąć go w trzech miejscach: `ExistingSubmissionCard`, `ChallengeCommunitySubmissionsCard`, `SubmissionReviewCard`. | P1, P3 |
| M4 | Naprawić priorytet mediów w `SubmissionAssetPreview` — zgłoszenie z obrazem i filmem powinno pokazywać oba, nie tylko obraz. | 3.4 |
| M5 | Scalić zduplikowane `inferBucketFromPath` do jednej implementacji w `packages/common/src/storage` (`packages/orpc` może z niej korzystać; odwrotny kierunek importu jest zabroniony przez `lint:boundaries`). | P9 |

### 5.3 Nakład L — powyżej trzech dni

| # | Zmiana | Rozwiązuje |
| --- | --- | --- |
| L1 | Pełne wsparcie wideo w głosowaniu: rozszerzyć `VotingSubmission` o ścieżkę wideo, dodać odtwarzacz do kart porównania, przemyśleć UX porównywania parami dla materiału, którego obejrzenie zajmuje 30 s (obecny mechanizm zakłada rzut oka na dwa zdjęcia). **To jest zakres pakietu prac 7 (`fix/challenges-voting`) — koordynować, nie dublować.** | P2 |
| L2 | Sprzątanie osieroconych obiektów: usuwanie ze Storage przy `deleteMineSubmission` i przy `handleRetake`, plus okresowe zadanie zamiatające (`apps/backend-server` — wzorzec opisany w `docs/conventions/data-retention.md`, sekcja „Cleanup Job Implementation Notes"). Uzupełnić `data-retention.md` o wiersze dla `challenge_submissions` i dla obiektów Storage. | P8 |
| L3 | Kompresja / transkodowanie: albo po stronie klienta przed uploadem, albo w workerze po stronie serwera (720p H.264, docelowo ok. 5–10 MB na 30 s). Bez tego każdy wgrany plik jest surowym materiałem z telefonu. | P4, koszt dysku |
| L4 | Miniatury (klatka poster) dla list i feedu, żeby nie pobierać całych filmów tylko po to, by pokazać kafelek. Bez tego feed społecznościowy z wideo będzie nie do użycia na łączu wyjazdowym. | P6 |
| L5 | Monitoring zużycia dysku na hoście z alertem przy przekroczeniu progu (patrz sekcja 7). Obecnie nie ma żadnego. | ryzyko operacyjne |

---

## 6. Pomiar miejsca na dysku — **do wykonania przez operatora**

> **Ta sekcja wymaga dostępu, którego autor audytu nie posiada i nie próbował uzyskać.**
> Host `docker.samorzad.pja.edu.pl` jest osiągalny wyłącznie przez tunel WireGuard,
> użytkownik SSH `ssadmin`, bez `sudo`.
>
> **Wszystkie poniższe polecenia są tylko do odczytu.** Nie ma wśród nich niczego,
> co modyfikuje dane. W szczególności **nie należy** uruchamiać `docker system prune`,
> `docker volume prune` ani `mc rm` — usunęłoby to obiekty Storage bez odpowiadającej
> zmiany w bazie.

### 6.0 Kontekst architektoniczny potrzebny do interpretacji wyników

Z `environment/docker-compose.prod.yml`:

- Supabase Storage działa w trybie **S3**, nie na lokalnym systemie plików:
  `STORAGE_BACKEND: s3`, `GLOBAL_S3_ENDPOINT: ${S3_ENDPOINT:-http://minio:9000}`.
- Backendem S3 jest **MinIO** w kontenerze `minio`, z bind-mountem `./volumes/minio:/data`.
- Wszystkie buckety Supabase (`images`, `videos`, `files-public`) są **prefiksami wewnątrz
  jednego bucketu S3** o nazwie `${MINIO_BUCKET:-pjapp}` (`GLOBAL_S3_BUCKET`),
  pod identyfikatorem najemcy `TENANT_ID: stub`.
- **Katalog danych PostgreSQL leży na tym samym systemie plików**:
  `./volumes/db/data:/var/lib/postgresql/data`. To jest kluczowe dla oceny ryzyka —
  zapełnienie dysku plikami wideo **zatrzyma bazę danych**, czyli całą aplikację,
  a nie tylko funkcję multimediów.
- Kontener bazy nazywa się `supabase-db`, kontener MinIO `minio`.

`<KATALOG_DEPLOYU>` poniżej oznacza katalog na hoście, w którym leży
`docker-compose.prod.yml` (bind-mounty są względne wobec niego).

### 6.1 Zapytania SQL — zużycie według bucketów

Uruchamiane wewnątrz kontenera bazy. Wszystkie to `SELECT`.

```bash
ssh ssadmin@docker.samorzad.pja.edu.pl
cd <KATALOG_DEPLOYU>
```

**A. Jakie buckety faktycznie istnieją.** Wykonać jako pierwsze — wynik rozstrzyga
niejednoznaczność opisaną w P7 i decyduje, czy w kolejnych zapytaniach filtrować po
`videos`, czy po `video`.

```bash
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
select id, name, public, file_size_limit, allowed_mime_types, created_at
from storage.buckets
order by name;
SQL
```

**B. Suma bajtów na bucket — zapytanie główne.**

```bash
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
select
  b.id                                                             as bucket,
  b.public                                                         as publiczny,
  count(o.id)                                                      as liczba_obiektow,
  coalesce(sum((o.metadata->>'size')::bigint), 0)                   as bajty,
  pg_size_pretty(coalesce(sum((o.metadata->>'size')::bigint), 0))   as rozmiar,
  pg_size_pretty(coalesce(max((o.metadata->>'size')::bigint), 0))   as najwiekszy_plik,
  pg_size_pretty(coalesce(avg((o.metadata->>'size')::bigint), 0)::bigint) as sredni_plik
from storage.buckets b
left join storage.objects o on o.bucket_id = b.id
group by b.id, b.public
order by bajty desc;
SQL
```

**C. Rozbicie na prefiksy pierwszego poziomu** (`challenge/`, `avatar/`, `trips/`,
`rewards/`, `activity/`, `group/`) — pokazuje, ile z tego to zgłoszenia do wyzwań.

```bash
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
select
  o.bucket_id,
  split_part(o.name, '/', 1)                                      as prefiks,
  count(*)                                                        as liczba,
  pg_size_pretty(sum((o.metadata->>'size')::bigint))              as rozmiar
from storage.objects o
group by o.bucket_id, split_part(o.name, '/', 1)
order by sum((o.metadata->>'size')::bigint) desc;
SQL
```

**D. Rozkład rozmiarów plików wideo według rozszerzenia.** Odpowiada na pytanie,
czy limit 50 MiB jest w praktyce osiągany.

```bash
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
select
  o.bucket_id,
  lower(nullif(regexp_replace(o.name, '^.*\.', ''), o.name))      as rozszerzenie,
  count(*)                                                        as liczba,
  pg_size_pretty(sum((o.metadata->>'size')::bigint))              as suma,
  pg_size_pretty(max((o.metadata->>'size')::bigint))              as maks,
  pg_size_pretty((percentile_cont(0.5) within group (
      order by (o.metadata->>'size')::double precision))::bigint) as mediana
from storage.objects o
where lower(regexp_replace(o.name, '^.*\.', ''))
      in ('mp4','mov','m4v','webm','avi','mkv')
group by o.bucket_id, 2
order by sum((o.metadata->>'size')::bigint) desc;
SQL
```

**E. Osierocone pliki wideo** — obiekty w Storage, do których nie prowadzi żaden rekord
`challenge_submissions.video_id`. Weryfikuje P8 liczbowo. (`video_id` przechowuje ścieżkę
obiektu **bez** nazwy bucketu, np. `challenge/<id>/<grupa>-<ts>.mov`, więc złączenie
idzie po `storage.objects.name`.)

```bash
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
select
  o.bucket_id,
  count(*)                                                        as osierocone,
  pg_size_pretty(coalesce(sum((o.metadata->>'size')::bigint), 0))  as marnowane
from storage.objects o
where lower(regexp_replace(o.name, '^.*\.', ''))
      in ('mp4','mov','m4v','webm','avi','mkv')
  and not exists (
    select 1 from public.challenge_submissions cs where cs.video_id = o.name
  )
group by o.bucket_id;
SQL
```

**F. Tempo przyrostu — ile przybyło w ostatnich 30 i 90 dniach.** To liczba, która
decyduje o odpowiedzi w sekcji 7, ważniejsza niż stan bieżący.

```bash
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
select
  o.bucket_id,
  date_trunc('month', o.created_at)                               as miesiac,
  count(*)                                                        as liczba,
  pg_size_pretty(sum((o.metadata->>'size')::bigint))              as przyrost
from storage.objects o
where o.created_at > now() - interval '12 months'
group by o.bucket_id, 2
order by 2 desc, 4 desc;
SQL
```

**G. Stan polityk RLS** — weryfikacja P7 punkt 3 (czy `data.sql` w ogóle się wykonał).

```bash
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd, policyname;
SQL
```

**H. Rozmiar samej bazy** (dla kontekstu — baza i MinIO dzielą dysk).

```bash
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
select pg_size_pretty(pg_database_size(current_database())) as baza;

select relname as tabela, pg_size_pretty(pg_total_relation_size(c.oid)) as rozmiar
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public','storage') and c.relkind = 'r'
order by pg_total_relation_size(c.oid) desc
limit 15;
SQL
```

### 6.2 Komendy na hoście dockerowym — miejsce na dysku

Wszystkie read-only. `ssadmin` nie ma `sudo`; poniższe tego nie wymagają, o ile
użytkownik należy do grupy `docker` (co jest konieczne, żeby w ogóle deployować).

```bash
ssh ssadmin@docker.samorzad.pja.edu.pl
```

**1. Ogólny obraz zajętości i — najważniejsze — ile zostało wolnego.**

```bash
df -hT
df -h --output=source,fstype,size,used,avail,pcent,target | sort -k6 -h -r
```

**2. Partycja, na której faktycznie leżą dane.** To ta liczba idzie do progu z sekcji 7.

```bash
cd <KATALOG_DEPLOYU>
df -h .
df -h ./volumes/minio ./volumes/db ./volumes/storage
```

**3. Wyczerpanie i-węzłów** — MinIO trzyma każdy obiekt jako osobny katalog z plikami
metadanych, więc dysk potrafi się „skończyć" mimo wolnych bajtów.

```bash
df -i
```

**4. Rozkład zużycia pomiędzy wolumeny bind-mount.**

```bash
cd <KATALOG_DEPLOYU>
du -sh ./volumes/* 2>/dev/null | sort -h
du -sh ./volumes/minio ./volumes/db/data ./volumes/storage 2>/dev/null
```

**5. Ile zajmuje sam bucket S3 z multimediami** (`pjapp` to wartość `MINIO_BUCKET`;
`stub` to `TENANT_ID`).

```bash
cd <KATALOG_DEPLOYU>
du -sh ./volumes/minio/pjapp 2>/dev/null
du -sh ./volumes/minio/pjapp/stub/* 2>/dev/null | sort -h
```

**6. Przyrost w ostatnich 30 dniach** — liczba do skonfrontowania z zapytaniem F.

```bash
cd <KATALOG_DEPLOYU>
find ./volumes/minio -type f -newermt '-30 days' -printf '%s\n' 2>/dev/null \
  | awk '{s+=$1} END {printf "%.2f GiB w ostatnich 30 dniach (%d plikow)\n", s/1024/1024/1024, NR}'

find ./volumes/minio -type f -newermt '-7 days' -printf '%s\n' 2>/dev/null \
  | awk '{s+=$1} END {printf "%.2f GiB w ostatnich 7 dniach (%d plikow)\n", s/1024/1024/1024, NR}'
```

**7. Ile zajmuje sam Docker** (obrazy, warstwy, logi kontenerów). Watchtower ściąga
nowe obrazy, więc warstwy potrafią urosnąć niezauważenie.

```bash
docker system df -v
docker ps --size --format 'table {{.Names}}\t{{.Size}}\t{{.Status}}'
```

**8. Logi kontenerów** — częsty ukryty konsument miejsca.

```bash
docker ps -q | xargs -I{} sh -c 'docker inspect --format "{{.Name}} {{.LogPath}}" {} 2>/dev/null' \
  | while read name path; do
      [ -f "$path" ] && echo "$(du -h "$path" 2>/dev/null | cut -f1)  $name"
    done | sort -h
```

**9. Zajętość MinIO widziana od strony samego MinIO** (kontrola krzyżowa dla punktu 5).
Obraz `minio/minio` jest minimalny i może nie zawierać `du` — jeśli komenda zwróci
`executable file not found`, pominąć; punkt 5 daje tę samą informację z poziomu hosta.

```bash
docker exec minio du -sh /data 2>/dev/null
docker exec minio du -sh /data/pjapp 2>/dev/null
```

**10. Podsumowanie do wklejenia w komentarzu do issue #15.**

```bash
cd <KATALOG_DEPLOYU>
{
  echo "=== data: $(date -Is) ==="
  echo "--- df ---";              df -h .
  echo "--- inody ---";           df -i . | tail -1
  echo "--- wolumeny ---";        du -sh ./volumes/* 2>/dev/null | sort -h
  echo "--- docker ---";          docker system df
} 2>&1 | tee /tmp/mirai-disk-$(date +%F).txt
```

### 6.3 Co wpisać z powrotem do tego dokumentu

Po pomiarze uzupełnić poniższą tabelę i dołączyć do issue #15:

| Metryka | Wartość | Źródło |
| --- | --- | --- |
| Rozmiar partycji z `volumes/` | | 6.2 pkt 2 |
| Wolne miejsce (GiB) | | 6.2 pkt 2 |
| Wolne miejsce (%) | | 6.2 pkt 2 |
| Wolne i-węzły (%) | | 6.2 pkt 3 |
| `volumes/minio` | | 6.2 pkt 4 |
| `volumes/db/data` | | 6.2 pkt 4 |
| Bucket `images` — obiekty / bajty | | 6.1 B |
| Bucket `videos` — obiekty / bajty | | 6.1 B |
| Największy plik wideo | | 6.1 D |
| Mediana rozmiaru wideo | | 6.1 D |
| Osierocone wideo — sztuk / bajtów | | 6.1 E |
| Przyrost w 30 dni (GiB) | | 6.2 pkt 6 |
| Buckety faktycznie istniejące | | 6.1 A |
| Polityki RLS na `storage.objects` | | 6.1 G |

---

## 7. Rekomendacja

### 7.1 Odpowiedź na pytanie „czy umożliwiamy wideo?"

**Warunkowe TAK — ale nie w obecnym stanie kodu i nie przed pomiarem z sekcji 6.**

Włączenie wideo dzisiaj, bez zmian, oznaczałoby wypuszczenie funkcji, która:

- pokazuje uczestnikowi „Submission has no image asset." po udanej wysyłce (P1),
- pozwala kadrze utworzyć wyzwanie wideo z głosowaniem, w którym nikt nie dostanie
  punktów, bez żadnego komunikatu (P2),
- pozwala moderatorowi zatwierdzać materiał, którego nie może obejrzeć (P3),
- zawodzi po kilku minutach uploadu z niezrozumiałym komunikatem, przy pierwszym
  dłuższym nagraniu z iPhone'a (P4),
- rośnie na dysku bez żadnego mechanizmu sprzątania (P8),
- **na tym samym systemie plików, na którym stoi PostgreSQL** (sekcja 6.0).

Ostatni punkt jest rozstrzygający dla wagi ryzyka. Awaria z powodu braku miejsca nie
byłaby „wideo przestało działać", tylko „aplikacja przestała działać w trakcie wyjazdu",
łącznie z logowaniem, punktami i powiadomieniami.

### 7.2 Warunki włączenia

**Warunek 1 — kod.** Zrealizowane wszystkie punkty z 5.1 (nakład S) oraz M1, M2, M3 z 5.2.
Bez M3 uczestnik nadal nie widzi własnego filmu; bez M2 nie ma limitu, którego serwer
faktycznie pilnuje; bez M1 model uprawnień do bucketów jest nieokreślony.

**Warunek 2 — pomiar.** Wykonana sekcja 6, tabela 6.3 wypełniona.

**Warunek 3 — próg wolnego miejsca.** Przyjmuję próg:

> Wideo można włączyć, jeżeli na partycji zawierającej `volumes/`
> **jednocześnie** spełnione są trzy warunki:
>
> 1. wolne miejsce ≥ **3 × prognozowane szczytowe zużycie wyjazdu**, oraz
> 2. wolne miejsce ≥ **25 % pojemności partycji**, oraz
> 3. wolne miejsce ≥ **50 GB** w wartości bezwzględnej.

Prognozowane szczytowe zużycie wyjazdu liczone jako:

```
liczba_grup × liczba_wyzwan_wideo × limit_na_plik × 1,3
```

gdzie `limit_na_plik` to wartość ustawiona w M2 (proponowane **25 MiB** po ustawieniu
`videoQuality` na 720p i `videoMaxDuration` na 30 s — połowa dzisiejszego limitu
serwisu, z zapasem), a mnożnik 1,3 pokrywa poprawki, ponowne wysyłki i pliki osierocone
do czasu wdrożenia L2.

Przykład dla 20 grup i 10 wyzwań wideo:
`20 × 10 × 25 MiB × 1,3 ≈ 6,5 GiB` szczytu → wymagane ≥ 19,5 GiB z warunku 1,
więc wiążący będzie warunek 3 (50 GB).

**Uzasadnienie progów.**

- **Mnożnik 3×** — nie ma dziś żadnego zadania sprzątającego (P8), więc zużycie jest
  monotoniczne: każdy kolejny wyjazd dokłada się do poprzedniego i nic nie odejmuje.
  Do tego dochodzą pliki osierocone przez „retake" i przez usunięte zgłoszenia, oraz
  narzut MinIO na metadane. Zapas 3× to mniej więcej trzy wyjazdy bez interwencji operatora.
- **25 % pojemności** — PostgreSQL, MinIO i Docker potrzebują miejsca roboczego:
  zrzuty i odtwarzanie bazy, warstwy obrazów ściągane przez Watchtower, logi
  kontenerów. Systemy plików ext4/xfs tracą też wydajność powyżej ok. 80 % zapełnienia.
- **50 GB bezwzględnie** — jeden zrzut bazy plus jeden pobrany obraz Dockera przez
  Watchtower to już kilka GB. Bufor poniżej tej wartości nie daje operatorowi czasu
  na reakcję między alertem a awarią.
- **Dlaczego wolne miejsce, a nie zajęte** — ryzyko dotyczy zapełnienia dysku, a nie
  wielkości katalogu wideo. Metryka musi mierzyć to, co faktycznie boli.

**Jeżeli którykolwiek warunek nie jest spełniony: NIE.** Wtedy przed włączeniem wideo
trzeba albo powiększyć wolumen, albo najpierw wdrożyć L2 i L3 (sprzątanie i kompresję),
albo wynieść Storage na osobny wolumen niezależny od `PGDATA` — to ostatnie jest
warte rozważenia niezależnie od decyzji o wideo, bo rozdziela awarię multimediów
od awarii aplikacji.

### 7.3 Ścieżka minimalna, gdyby wideo było potrzebne szybko

Gdyby decyzja musiała zapaść przed najbliższym wyjazdem, najmniejszy sensowny zakres to:

1. **5.1 w całości** (limit długości i rozdzielczości, sprawdzenie rozmiaru przed uploadem,
   naprawiony regex, usunięty `skipCache`) — 1 dzień pracy.
2. **M2** — per-bucket `file_size_limit` i `allowed_mime_types` na buckecie `videos`.
   To jedyny limit, którego nie da się obejść klientem.
3. **M3** — wspólny odtwarzacz w trzech miejscach, żeby uczestnik i moderator w ogóle
   widzieli treść.
4. **Ograniczenie regulaminowe zamiast kodu**: dopuścić `VIDEO` wyłącznie w połączeniu
   ze `scoringCategory` `JUDGED_STAFF` (jedyna ścieżka, która dziś ma działający
   odtwarzacz), a kombinację `VIDEO` + `PEER_VOTING` zablokować w
   `packages/common/src/challenges/validators.ts` do czasu zamknięcia pakietu prac 7.
   To jedna linijka i eliminuje P2 jako problem produkcyjny.
5. **Ręczny monitoring** `df -h` przed i po każdym dniu wyjazdu, dopóki nie ma L5.

Punkt 4 warto rozważyć jako natychmiastowe zabezpieczenie **niezależnie** od tego, czy
wideo zostanie włączone — dziś ta kombinacja jest dostępna w formularzu admina i cicho
zawodzi.

---

## 8. Załącznik: mapa problemów do plików

| ID | Waga | Plik : linia |
| --- | --- | --- |
| P1 | Krytyczny | `apps/native/src/components/trips/challenges/ExistingSubmissionCard.tsx:105` (gałąź `!hasImage`), `apps/native/src/components/trips/challenges/ChallengeCommunitySubmissionsCard.tsx:47` |
| P2 | Krytyczny | `apps/native/src/app/(tabs)/trips/challenges/vote/[id].tsx:237`, `apps/native/src/app/(tabs)/admin/challenges/staff-vote.tsx:102` |
| P3 | Wysoki | `apps/native/src/components/admin/challenges/SubmissionReviewCard.tsx:128` |
| P4 | Krytyczny | `apps/native/src/hooks/challenges/useChallengeCapture.ts:219`, `apps/native/src/hooks/files/useFileUpload.ts:139`, `packages/orpc/src/api/routers/storage/index.ts:39`, `environment/docker-compose.prod.yml:366` |
| P5 | Wysoki | `packages/orpc/src/api/routers/storage/index.ts:47`, `apps/native/src/hooks/files/useFileUpload.ts:144` |
| P6 | Wysoki | `apps/native/src/components/judgement/SubmissionAssetPreview.tsx:66`, `apps/native/src/hooks/files/useFileDownload.ts:156` |
| P7 | Wysoki | `packages/common/src/storage/standard.ts:7`, `apps/seed/src/config/env.ts:4`, `environment/volumes/db/init/data.sql`, `environment/docker-compose.prod.yml:516` |
| P8 | Wysoki | `packages/orpc/src/api/routers/challengeSubmission/mutations.ts:460,689`, `apps/native/src/hooks/challenges/useChallengeCapture.ts:327`, `docs/conventions/data-retention.md` |
| P9 | Średni | `packages/orpc/src/utils/storage.ts`, `packages/common/src/storage/resolveStorageUrl.ts:31` |
