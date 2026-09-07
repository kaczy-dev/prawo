# 🏛️ Plan Refaktoryzacji UI i Modernizacji Systemu prawnBot (Mobile & Desktop)

Plan opracowany zgodnie z wytycznymi **frontend-design** (unikalna tożsamość kancelaryjna, dyscyplina typograficzna, eliminacja generycznych szablonów, pełna ergonomia mobile & desktop na sali sądowej), audytem kodu Angular 21 oraz konfiguracją serwerów MCP.

---

## 1. Wnioski z Audytu: Co poprawić, usunąć i rozbudować

### 🔍 A. Co poprawić i dopracować (UI / UX / Responsywność):
1. **Pasek Górny (Header) na Mobile**:
   - Kompaktowy nagłówek mobilny z pojedynczą ikoną statusu bezpieczeństwa (Security Pill) i szybką wyszukiwarką.
2. **Nawigacja Mobile (Bottom Navigation Bar)**:
   - Wdrożenie dolnego paska nawigacji mobilnej (**Bottom Navigation Bar**) z 4 głównymi sekcjami (`Kalkulator`, `Kodeks`, `Sejf`, `Czat`) oraz szufladą `Więcej...`.
3. **Tożsamość Wizualna (Frontend Design)**:
   - Zastąpienie krzykliwego bursztynu wyrafinowanym złotem sygnetowym (`#D4AF37` / `#C5A059`) oraz głębokim onyxem i granatem nocy (`#090D16`, `#0F172A`).
   - Wzmocnienie typografii szeryfowej `Cinzel` dla nagłówków artykułów prawnych i tez Sądu Najwyższego oraz ultra-czytelnego kroju `Plus Jakarta Sans` dla tekstów paragrafów.
4. **Pływający odtwarzacz TTS**:
   - Zoptymalizowany pod kątem dolnej nawigacji (`bottom-20 md:bottom-4`), by nie przysłaniał akcji.

---

### 🖥️ B. Dedykowana Refaktoryzacja Desktop UI & Layout (NOWOŚĆ):
1. **Pełnowymiarowa Modalna Paleta Poleceń (Command Palette / Spotlight `Ctrl+K`)**:
   - Zastąpienie prostego `focus()` w headerze nowoczesnym, centrowanym oknem dialogowym typu Spotlight (`Ctrl+K` / `Cmd+K`).
   - Wyszukiwanie w locie: artykuły Kodeksu Karnego (np. `178a`, `278`, `148`), wzory pism procesowych, moduły aplikacji, szybka blokada sejfu (`Ctrl+Shift+L`).
2. **Zaawansowany Układ Wieloszpaltowy (Desktop Multi-Pane Workspace)**:
   - W kalkulatorze zagrożenia i przeglądarce kodeksu: optymalizacja pod monitory 1080p i ultrawide (1440p+).
   - Układ 2/3 (treść artykułu, kalkulator sankcji, tezy SN) do 1/3 (boczny panel z historią nowelizacji, bezpośrednim szkicownikiem notatek obrończych i symulacją art. 4 § 1 k.k.).
   - Wyeliminowanie pustych przestrzeni po bokach lub nadmiernego rozciągania tekstu (zastosowanie max-w-7xl z podwójną/potrójną siatką roboczą).
3. **Przełącznik Gęstości Informacji (Courtroom Density Toggle)**:
   - Opcja przełączania widoku: **Domyślny (Komfortowy)** vs **Zwarty (Sądowy)** – mniejszy padding, skompresowane wiersze paragrafów, pozwalający objąć wzrokiem cały artykuł wraz z orzecznictwem bez przewijania ekranu laptopa na sali sądowej.
4. **Sticky Action Bar na Desktopie**:
   - Pływające lub przypięte paski szybkich akcji (Eksport PDF, Kopiuj do schowka z sygnaturą, Dodaj do dossier klienta).

---

### 🗑️ C. Co usunąć lub uprościć:
1. **Podwójna wyszukiwarka**:
   - Eliminacja duplikacji zapytań pomiędzy headerem a kalkulatorem; ujednolicenie przepływu wyszukiwania z obsługą skrótu `Ctrl+K`.
2. **Nadmiar badge'y w headerze na mobile**:
   - Scalenie wskaźników stanu w jeden dyskretny element ze szczegółami dostępnymi po kliknięciu.

---

### 🚀 D. Rozbudowa merytoryczna i narzędziowa:
1. **Komparator nowelizacji (Diff-View)**:
   - Porównanie stanu prawnego z 2023 vs 2024 (konfiskata pojazdów art. 178a § 5 k.k., próg kradzieży 800 zł w art. 278 k.k., reguła art. 4 § 1 k.k.).
2. **Generowanie Dossier Sprawy (PDF Export)**:
   - Automatyczny eksport zestawienia: metryka klienta, stadium postępowania, kalkulacja sankcji oraz zaszyfrowane notatki z sejfu.
3. **Wzory pism procesowych w Sejfie**:
   - Wnioski o warunkowe umorzenie (art. 66 k.k.), wnioski dowodowe (art. 169 k.p.k.), zażalenia na zatrzymanie prawa jazdy.

---

## 2. Pakiety i Narzędzia MCP (Model Context Protocol)

- **`puppeteer`**: Testowanie responsywności na urządzeniach mobilnych oraz desktopie (1920x1080 i 1440x900), zrzuty ekranu, weryfikacja wizualna.
- **`lighthouse`**: Audyt a11y, WCAG 2.2, kontrastów kolorów i wydajności.
- **`fetch`**: Bezpieczna weryfikacja zewnętrznych źródeł aktów prawnych (ISAP, orzecznictwo SN).
- **`github` & `filesystem`**: Zarządzanie wersjami i inspekcja kodu.

---

## 3. Harmonogram i Status Realizacji

| Etap | Zakres prac | Status |
| :--- | :--- | :--- |
| **Faza 1** | **Refaktoryzacja Mobile Layout**: Dolny pasek nawigacji (Bottom Nav Bar), kompaktowy nagłówek, szuflada "Więcej", pozycjonowanie TTS. | ✅ Ukończone |
| **Faza 2** | **Kancelaryjny Frontend Design**: Paleta barw (onyx, głęboki granat, mosiądz sygnetowy `#D4AF37`), typografia `Cinzel` + `Plus Jakarta Sans`. | ✅ Ukończone |
| **Faza 3** | **Funkcje Merytoryczne**: Komparator nowelizacji (Diff-View), wzory pism w sejfie, eksport Dossier Sprawy do PDF. | ✅ Ukończone |
| **Faza 4** | **Refaktoryzacja Desktop UI & Layout**: Centrowana Command Palette (`Ctrl+K`), wieloszpaltowy workspace 2/3 + 1/3, tryb gęstości sali sądowej (Courtroom Dense Mode), kalkulator kary łącznej (art. 85-86 k.k.), kancelaryjny modal druku A4. | ✅ Ukończone |
| **Faza 5** | **Weryfikacja Końcowa**: Kompilacja produkcyjna (`npx ng build`), testy jednostkowe Vitest (`npx ng test`), audyt layoutu i ergonomii na sali sądowej. | ✅ Ukończone |
| **Faza 6** | **De-cluttering & Czysty Layout (Minimalizm Kancelaryjny)**: Redukcja wizualnego szumu, usunięcie podwójnych wyszukiwarek, scalenie 8 zakładek do 4 logicznych obszarów roboczych (Analiza, Kodeks, Dossier, AI), uproszczenie kalkulatora. | ✅ Ukończone |
| **Faza 7** | **Rozszerzenie Bazy Prawnej & Dyrektywy Sądowe**: Rozbudowa artykułów Kodeksu Karnego (art. 286 k.k. oszustwo, art. 207 k.k. znęcanie, ustawa o przeciwdziałaniu narkomanii art. 56 i 62 UoPN, art. 60 k.k.), automatyczny moduł nadzwyczajnego złagodzenia kary (art. 60 k.k.) w kalkulatorze. | ✅ Ukończone |
| **Faza 8** | **Lokalny Asystent AI w Przeglądarce (WebGPU / WebLLM)**: Integracja lokalnego modelu językowego w 100% offline w przeglądarce (bezwzględna tajemnica obrończa, zerowy transfer sieciowy, detekcja adaptera WebGPU). | ✅ Ukończone |

---

### 🌐 Wdrożenie Produkcyjne (Live):
- **Główny alias produkcyjny**: [https://prawo-sigma.vercel.app](https://prawo-sigma.vercel.app)
- **Status**: Aktywne, zweryfikowane kompilacją produkcyjną (`ng build` exit code 0).


