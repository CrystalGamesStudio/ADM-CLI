# Plan: Crystal ADM-CLI v0.9.0 — TUI Refactor

> Source PRD: https://github.com/CrystalGamesStudio/ADM-CLI/issues/19

## Architectural decisions

Durable decisions that apply across all phases:

- **Architecture style**: TUI-only (ink + React). Jedna komenda `adm` otwiera interfejs TUI. Brak subkomend CLI.
- **Data model**: Komendy rejestrowane w centralnym rejestrze z nazwa, opisem i handlerem. Autocomplete korzysta z tego samego rejestru.
- **Key entities**: Slash commands, command registry, autocomplete engine, GitLab/GitHub API clients
- **Integrations**: GitLab API (`@gitbeaker/node`), GitHub API (`@octokit/rest`), browser open (`open` macOS / `xdg-open` Linux)
- **Version management**: Wersja czytana dynamicznie z `package.json` — nigdy hardcoded
- **Package version**: `0.9.0`

---

## Phase 1: CLI Slim-down & Dynamic Version

**User stories**: 5, 6, 9, 10

### What to build

Usunac wszystkie subkomendy Commander.js z `bin/adm`. Zostaja tylko dwie sciezki: `adm` (otwiera TUI, domyslna) i `adm -v`/`adm --version` (wyswietla wersje i konczy). Wersja jest czytana z `package.json` przez require. W TUI status barze zmienic hardcoded "ADM v0.2.0" na "Crystal ADM-CLI <wersja>" pobierana dynamicznie z `package.json`. Wersja w `package.json` aktualizowana na `0.9.0`.

### Acceptance criteria

- [ ] `adm` w terminalu otwiera TUI
- [ ] `adm -v` i `adm --version` wyswietlaja wersje z package.json
- [ ] Komendy `adm setup`, `adm connect`, `adm pr`, `adm mr`, `adm assistant` nie istnieja
- [ ] Status bar TUI pokazuje "Crystal ADM-CLI 0.9.0"
- [ ] Wersja w package.json to 0.9.0
- [ ] Zmiana wersji w package.json automatycznie zmienia wyswietlanie w TUI i CLI

---

## Phase 2: Command Autocomplete

**User stories**: 1, 2, 3, 4

### What to build

Zastapic obecne podpowiedzi komend (czerwony tekst nad promptem, po przecinku) interaktywna lista pod promptem. Po wpisaniu `/` pojawia sie pelna lista komend. Dalsze pisanie dynamicznie filtruje liste. Nawigacja strzałkami gora/dol z podswietleniem aktywnej pozycji. Enter wybiera komende i wstawia ja do promptu. ESC zamyka liste. Lista pojawia sie TYLKO po `/` — nie przy zwyklym tekscie.

### Acceptance criteria

- [ ] Wpisanie `/` pokazuje pelna liste komend pod promptem
- [ ] Wpisanie `/git` filtruje do `/github` i `/gitlab`
- [ ] Strzalki gora/dol nawiguja po liscie z podswietleniem
- [ ] Enter wybiera aktywna komende i wstawia do promptu
- [ ] ESC zamyka liste bez wyboru
- [ ] Backspace na `/` zamyka liste
- [ ] Lista nie pojawia sie przy zwyklym tekscie (tylko po `/`)
- [ ] Stare czerwone podpowiedzi nad promptem sa usuniete

---

## Phase 3: Download & Feedback Commands

**User stories**: 7, 11, 12, 13

### What to build

Zmiana nazwy komendy `/setup` na `/download` — ta sama funkcjonalnosc, nowa nazwa w rejestrze i podpowiedziach. Nowa komenda `/feedback` wyswietla komunikat "Otworzyc strone w przegladarce? (Y/n)". Po Y otwiera `https://crystalgames.studio/#/contact` w domyslnej przegladarce (`open` na macOS, `xdg-open` na Linuxie). Po N lub ESC anuluje i wraca do promptu.

### Acceptance criteria

- [ ] `/download` dziala identycznie jak stary `/setup`
- [ ] `/setup` nie jest juz dostepny
- [ ] `/feedback` wyswietla komunikat potwierdzajacy
- [ ] Wcisniecie Y otwiera `https://crystalgames.studio/#/contact` w przegladarce
- [ ] Wcisniecie N lub ESC anuluje bez otwierania przegladarki
- [ ] Dziala na macOS (`open`) i Linux (`xdg-open`)

---

## Phase 4: GitLab TUI Command

**User stories**: 8

### What to build

Pelna komenda `/gitlab` w TUI mirrorujaca strukture `/github`. Wykorzystuje istniejacy klient GitLab API. Subkomendy odpowiadaja odpowiednikom z `/github` (MR zamiast PR, repo, issues). Obsluga bledow API GitLab z eleganckimi komunikatami. Komenda pojawia sie w podpowiedziach autocomplete.

### Acceptance criteria

- [ ] `/gitlab` pojawia sie w podpowiedziach po wpisaniu `/git`
- [ ] `/gitlab` ma te same subkomendy co `/github` (adaptowane na GitLab: MR zamiast PR)
- [ ] Operacje GitLab (MR, repo, issues) dzialaja poprawnie
- [ ] Bledy API GitLab sa elegancko obsluzone z czytelnymi komunikatami
- [ ] Uzytkownik bez tokenu GitLab dostaje jasny komunikat o konfiguracji

---

## Phase 5: README & Final Polish

**User stories**: 14

### What to build

Zaktualizowac README zeby odzwierciedlalo TUI-only nature projektu. Usunac referencje do subkomend CLI. Dodac dokumentacje nowych komend (`/download`, `/gitlab`, `/feedback`). Zaktualizowac sekcje instalacji i uzycia. Koncowa weryfikacja wszystkich faz — przejscie calosci od `adm` do kazdej komendy.

### Acceptance criteria

- [ ] README jasno stwierdza ze projekt jest TUI-only
- [ ] Dokumentacja komend zawiera `/download`, `/gitlab`, `/feedback`
- [ ] Brak referencji do usunietych komend CLI (`adm setup`, `adm connect`, itp.)
- [ ] Sekcja instalacji i uzycia jest aktualna
- [ ] Koncowa weryfikacja: `adm` dziala, wszystkie komendy TUI dzialaja
