# prawnBot – Inteligentny Asystent dla Kancelarii Prawnej
## Dokumentacja Techniczna i Architektoniczna

### 1. Przegląd Rozwiązania
**prawnBot** to specjalistyczna aplikacja wspomagająca pracę prawników, aplikantów oraz obywateli w zakresie polskiego prawa karnego (Kodeks Karny, Dz.U. 1997 nr 88 poz. 553 z późn. zm., w tym nowelizacje 2023 i 2024).

Aplikacja została zaprojektowana z zachowaniem rygorystycznej zasady **Zero-Trust & Zero-External-Leaks**:
- **100% Offline & Brak zewnętrznych API**: Żadne zapytania do modeli językowych ani treść spraw nie opuszczają urządzenia użytkownika.
- **Kryptografia po stronie klienta (Client-Side Encryption)**: Wszystkie notatki spraw, dane klientów i historia wyszukiwań są szyfrowane algorytmem **AES-GCM (256-bit)** z kluczem derywowanym przez **PBKDF2 (100 000 iteracji SHA-256)** bezpośrednio w silniku przeglądarki użytkownika (Web Crypto API).
- **Kalkulator "Co mi grozi?"**: Semantyczny analizator ryzyka procesowego z natychmiastowym mapowaniem artykułów, sankcji obligatoryjnych (np. konfiskata pojazdu z art. 178a § 5 k.k.) oraz precedensów Sądu Najwyższego.
- **Eksport do PDF**: Generowanie profesjonalnych wyciągów z orzecznictwa i notatek w formacie PDF z klauzulą tajemnicy zawodowej.

---

### 2. Porównanie Architektoniczne: JavaScript/TypeScript Web Runtime vs Python/Streamlit

Zgodnie z wymogami środowiskowymi nowoczesnych kancelarii oraz natychmiastowym działaniem offline:
| Aspekt | Implementacja prawnBot (Web + Web Crypto API) | Alternatywa Python + Streamlit |
| :--- | :--- | :--- |
| **Działanie Offline** | **Natywne**. Działa w przeglądarce bez konieczności uruchamiania lokalnego serwera Pythona na maszynie klienta. | Wymaga lokalnego środowiska Python, zależności C++ (ChromaDB/hnswlib), zużywa 2-4 GB RAM. |
| **Prywatność i Szyfrowanie** | Klucze szyfrujące AES-256 przebywają wyłącznie w pamięci RAM sesji użytkownika. Brak możliwości podejrzenia danych przez administratora serwera. | Dane w pamięci procesu Python na serwerze; podatne na wycieki przy współdzieleniu serwera. |
| **Interfejs Użytkownika** | Responsywny, natychmiastowy interfejs w Angular 21, bez przeładowań strony, przystosowany do urządzeń mobilnych i tabletów na sali rozpraw. | Streamlit przeładowuje całą sesję przy każdej interakcji (`rerun`), co spowalnia pracę przy obszernych bazach aktów prawnych. |

---

### 3. Moduł Bezpieczeństwa i Kryptografii
- **Wyprowadzanie klucza**: PBKDF2 (`PBKDF2-HMAC-SHA-256`, 100 000 rund, 16-bajtowa losowa sól krypto).
- **Szyfr symetryczny**: AES-GCM (Galois/Counter Mode, 256-bit, unikalny 12-bajtowy IV dla każdego rekordu).
- **Uwierzytelnianie**: Hasz solony SHA-256 weryfikujący tożsamość bez zapisywania hasła w postaci jawnej.

---

### 4. Instrukcja Uruchomienia i Wdrożenia

#### A. Uruchomienie lokalne (Development):
```bash
# Instalacja zależności
npm install

# Uruchomienie deweloperskie
npm run dev
# Aplikacja dostępna pod adresem: http://localhost:3000
```

#### B. Konteneryzacja Docker & Docker Compose:
```bash
# Zbudowanie i uruchomienie wielostopniowego kontenera
docker compose up -d --build

# Sprawdzenie statusu kontenerów
docker compose ps

# Podgląd logów
docker compose logs -f
```

---

### 5. Bezpieczeństwo Sieciowe (SSL & NGINX)
Dołączony plik `nginx.conf` wymusza:
1. Przekierowanie ruchu nieszyfrowanego (HTTP 80 -> HTTPS 443).
2. Obsługę wyłącznie bezpiecznych protokołów **TLS 1.2 i TLS 1.3**.
3. Rygorystyczne nagłówki:
   - `Content-Security-Policy (CSP)`
   - `Strict-Transport-Security (HSTS)`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
