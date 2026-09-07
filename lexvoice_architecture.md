# System Specification & Architecture: LexVoice AI (Wirtualny Radca Prawny)
# Role: Senior Lead Engineer Core Instructions

## 1. Executive Summary & Core Intent
LexVoice AI to zaawansowana aplikacja LegalTech klasy Enterprise zapewniająca dwukierunkową interakcję (Chat oraz Głos w czasie rzeczywistym). Głównym zadaniem systemu jest precyzyjne mapowanie pytań użytkownika (np. "Co mi grozi za...") na konkretne artykuły, paragrafy oraz sankcje z polskich kodeksów prawnych (Karnego, Cywilnego, Pracy, itp.) z bezwzględnym zerowym poziomem halucynacji.

---

## 2. Market Benchmarks & Implemented Innovations
Aplikacja agreguje najlepsze cechy wiodących systemów rynkowych:
* **IURA / William:** Precyzyjne cytowanie źródeł (Citations Mapping) i integracja z oficjalnymi bazami aktów prawnych (ISAP).
* **Ellis™ / Plavno Legal:** Interfejs głosowy czasu rzeczywistego (Streaming Audio Pipeline) z automatyczną detekcją pojęć prawnych.
* **AI Lawyer Pro:** Skanowanie i analiza dokumentów (OCR + Multimodal LLM) bezpośrednio z aparatu smartfona.

---

## 3. Tech Stack & Infrastructure Architectural Design

### A. Core Architecture
System odrzuca podejście "Naive RAG" na rzecz **Advanced Agentic RAG** sterowanego przez router intencji (Intent Router).

```
[ Użytkownik: Głos / Tekst ]
            │
            ▼
[ Audio Pipeline (STT) ] -> (Whisper-v3 / LiveKit)
            │
            ▼
[ Intent & Guardrail Router ] ──(Naruszenie zasad / Off-topic)──► [ Blokada ]
            │
            ▼ (Legal Query)
[ Hybrid Search Engine ] ──► Wyszukiwanie Wektorowe (Qdrant + E5-Large)
            │             └── Wyszukiwanie Słowne (BM25)
            ▼
[ Cross-Encoder Reranker ] ──► Filtrowanie i wybór TOP 3 artykułów (Cohere Rerank)
            │
            ▼
[ Reasoning Core (LLM) ] ──► Generowanie odpowiedzi (GPT-4o / Claude 3.5 Sonnet)
            │
            ▼
[ Audio Pipeline (TTS) ] ──► Synteza mowy (Cartesia / ElevenLabs SMS)
```

### B. Szczegółowa specyfikacja komponentów
1. **Voice Pipeline (Obsługa mowy):**
   * **STT (Speech-to-Text):** `OpenAI Whisper-v3` (lub `Groq Whisper` dla opóźnień < 100ms).
   * **TTS (Text-to-Speech):** `Cartesia AI` lub `ElevenLabs` z optymalizacją pod kątem naturalnej intonacji tekstów prawniczych i czytania artykułów (np. "Art. 148 paragraf 1").
   * **Orkiestracja Audio:** `LiveKit WebRTC` do zachowania ciągłości konwersacji głosowej pełnego dupleksu (możliwość przerwania asystentowi w pół słowa).
2. **Baza Wiedzy i Parsowanie (Ingestion):**
   * **Zasilanie:** Skrypty ETL pobierające dane z API Sejmu (ISAP).
   * **Hierarchical Chunking:** Tekst dzielony jest nie po liczbie znaków, a strukturalnie: `Jednostka Redakcyjna = 1 Chunk` (Artykuł + Paragraf + Ustęp + Tytuł Kodeksu jako metadane).
3. **Wyszukiwanie Hybrydowe:**
   * **Baza danych:** `Qdrant` lub `Weaviate`.
   * **Embeddings:** `multilingual-e5-large` (doskonałe dopasowanie do semantyki języka polskiego).

---

## 4. Advanced System Features (Specyfikacja Funkcjonalna)

| Funkcja | Opis Techniczny | Korzyść dla Użytkownika |
| :--- | :--- | :--- |
| **Kalkulator Ryzyka Sankcji** | Algorytm analizuje widełki kar (np. "od roku do lat 5") z przytoczonych artykułów KK i wylicza syntetyczne podsumowanie. | Błyskawiczna informacja "Co mi grozi" w formie czytelnego alertu. |
| **Multimodal Document Scanner** | Integracja modułu OCR z LLM (Vision). Użytkownik robi zdjęcie pisma z sądu lub policji. | Natychmiastowe wyjaśnienie żargonu prawniczego na prosty język. |
| **Dynamic Jurisdictional Switch** | Automatyczne dopasowanie kontekstu na bazie geolokalizacji użytkownika lub deklaracji (np. Prawo polskie vs. Prawo UE). | Zapobieganie podawaniu błędnych przepisów przy sprawach transgranicznych. |
| **Interactive Guardrails** | Warstwa filtrująca zapytania o charakterze stricte przestępczym (np. "Jak uniknąć wykrycia oszustwa"). | Bezpieczeństwo prawne (Compliance) oraz brak odpowiedzialności cywilnej twórców aplikacji. |

---

## 5. Claude LLM Execution Rules & Guardrails
*Poniższe instrukcje muszą być bezpośrednio aplikowane przez model LLM podczas generowania odpowiedzi.*

### Rygorystyczne Zasady Odpowiedzi (Prompt Systemowy)
1. **Zasada Prawdy Absolutnej (No Hallucinations):** Odpowiadasz **tylko i wyłącznie** na podstawie kontekstu dostarczonego z bazy RAG. Jeśli w bazie nie ma odpowiedzi na specyficzne pytanie, mówisz: *"Na podstawie aktualnych kodeksów nie jestem w stanie precyzyjnie odpowiedzieć na to pytanie. Skonsultuj się z radcą prawnym."*
2. **Formatowanie Podstawy Prawnej:** Każda odpowiedź o sankcjach musi zaczynać się od jasnego wskazania artykułu w formacie Markdown z linkowaniem do źródła (jeśli dostępne), np. **[Art. 286 § 1 Kodeksu Karnego]**.
3. **Struktura Komunikatu Głosowego vs. Tekstowego:**
   * *Jeśli wyjście to CHAT:* Używaj list wypunktowanych, pogrubień dla kluczowych sankcji i tabel.
   * *Jeśli wyjście to GŁOS (TTS):* Odpowiedź musi być zwięzła (maksymalnie 3-4 zdania), bez znaków specjalnych, nawiasów i skomplikowanych skrótów (zamiast "art. 286 k.k." generuj tekst gotowy do przeczytania: "artykuł dwieście osiemdziesiąty szósty Kodeksu Karnego").
4. **Obowiązkowy Disclaimer:** Na końcu każdej interakcji tekstowej (oraz na początku sesji głosowej) dodaj komunikat: *"Prezentowane informacje mają charakter wyłącznie edukacyjno-informacyjny i nie stanowią wiążącej porady prawnej"*.

---

## 6. Security, Privacy & Data Compliance (GDPR/RODO)
* **Zero Data Retention dla LLM:** Dane użytkowników wprowadzane głosowo i tekstowo nie mogą być wykorzystywane do dotrenowywania modeli zewnętrznych (OpenAI API / Anthropic API Enterprise z włączoną polityką *Zero Data Retention*).
* **Szyfrowanie:** Wszystkie próbki głosowe użytkownika są przesyłane za pomocą bezpiecznego protokołu SRTP i usuwane natychmiast po przetworzeniu przez moduł STT.
* **Anonimizacja w locie:** System przed wysłaniem zapytania do LLM maskuje dane wrażliwe (imiona, nazwiska, numery PESEL, nazwy miast) przy użyciu narzędzia `Microsoft Presidio`.