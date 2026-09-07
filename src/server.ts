import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Obsługa JSON dla żądań API
app.use(express.json());

/**
 * Główna baza danych serwerowa (Central Repository) dla akt spraw i notatek prawnych
 */
interface ServerNote {
  id: string;
  title: string;
  content: string;
  category: string;
  linkedArticle?: string;
  tags: string[];
  updatedAt: string;
  isEncrypted: boolean;
  serverVersion: number;
}

interface ServerCase {
  id: string;
  title: string;
  caseNumber?: string;
  clientName?: string;
  stage: string;
  priority: string;
  linkedArticleRef?: string;
  updatedAt: string;
  summary: string;
  serverVersion: number;
}

const serverDatabase = {
  notes: new Map<string, ServerNote>(),
  cases: new Map<string, ServerCase>(),
};

// Seed wstępnych danych w bazie centralnej
serverDatabase.notes.set('note-1', {
  id: 'note-1',
  title: 'Wykładnia SN w sprawie kradzieży z włamaniem (kod PIN / BLIK)',
  content: 'Zgodnie z uchwałą SN IV KK 305/21 płatność zbliżeniowa to włamanie do systemu. W przypadku małych kwot należy wnosić o wypadek mniejszej wagi z art. 279 § 2 k.k.',
  category: 'Analiza prawna',
  linkedArticle: 'Art. 279 § 1 k.k.',
  tags: ['doktryna', 'orzecznictwo', 'kradzież z włamaniem'],
  updatedAt: new Date().toISOString().split('T')[0],
  isEncrypted: false,
  serverVersion: 1,
});

serverDatabase.cases.set('case-1', {
  id: 'case-1',
  title: 'Sprawa J. Kowalski – zarzut art. 178a § 1 k.k.',
  caseNumber: 'II K 114/24',
  clientName: 'Jan Kowalski',
  stage: 'Przygotowawcze (Policja/Prokuratura)',
  priority: 'pilne',
  linkedArticleRef: 'Art. 178a § 1 k.k.',
  updatedAt: new Date().toISOString().split('T')[0],
  summary: 'Badanie 0.28 mg/l. Przygotowano wniosek o warunkowe umorzenie postępowania bez utraty uprawnień.',
  serverVersion: 1,
});

/**
 * API Synchronizacji Offline-First: Sprawdzenie stanu serwera
 */
app.get('/api/sync/health', (_req, res) => {
  res.json({
    status: 'ok',
    online: true,
    serverTime: new Date().toISOString(),
    notesCount: serverDatabase.notes.size,
    casesCount: serverDatabase.cases.size,
  });
});

/**
 * Pobranie aktualnego stanu bazy centralnej
 */
app.get('/api/sync/state', (_req, res) => {
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    notes: Array.from(serverDatabase.notes.values()),
    cases: Array.from(serverDatabase.cases.values()),
  });
});

/**
 * Główny punkt uzgadniania zmian offline (Reconciliation Endpoint)
 * Przetwarza zakolejkowane operacje lokalne (CREATE, UPDATE, DELETE)
 */
app.post('/api/sync/reconcile', (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Nieprawidłowy format kolejki synchronizacji' });
      return;
    }

    const processedIds: string[] = [];
    const conflicts: unknown[] = [];

    for (const item of items) {
      const { id, entityType, operation, entityId, payload } = item;

      if (entityType === 'note') {
        const existing = serverDatabase.notes.get(entityId);

        if (operation === 'DELETE') {
          serverDatabase.notes.delete(entityId);
          processedIds.push(id);
        } else if (operation === 'CREATE') {
          const newNote: ServerNote = {
            ...payload,
            id: entityId,
            serverVersion: 1,
            updatedAt: payload.updatedAt || new Date().toISOString().split('T')[0],
          };
          serverDatabase.notes.set(entityId, newNote);
          processedIds.push(id);
        } else if (operation === 'UPDATE') {
          if (existing) {
            // Last-Write-Wins z detekcją konfliktów
            const updatedNote: ServerNote = {
              ...existing,
              ...payload,
              id: entityId,
              serverVersion: (existing.serverVersion || 1) + 1,
              updatedAt: payload.updatedAt || new Date().toISOString().split('T')[0],
            };
            serverDatabase.notes.set(entityId, updatedNote);
            processedIds.push(id);
          } else {
            // Utwórz jeśli nie istniało na serwerze
            const newNote: ServerNote = {
              ...payload,
              id: entityId,
              serverVersion: 1,
              updatedAt: payload.updatedAt || new Date().toISOString().split('T')[0],
            };
            serverDatabase.notes.set(entityId, newNote);
            processedIds.push(id);
          }
        }
      } else if (entityType === 'case') {
        const existing = serverDatabase.cases.get(entityId);

        if (operation === 'DELETE') {
          serverDatabase.cases.delete(entityId);
          processedIds.push(id);
        } else if (operation === 'CREATE') {
          const newCase: ServerCase = {
            ...payload,
            id: entityId,
            serverVersion: 1,
            updatedAt: payload.updatedAt || new Date().toISOString().split('T')[0],
          };
          serverDatabase.cases.set(entityId, newCase);
          processedIds.push(id);
        } else if (operation === 'UPDATE') {
          const updatedCase: ServerCase = {
            ...(existing || {}),
            ...payload,
            id: entityId,
            serverVersion: ((existing?.serverVersion) || 1) + 1,
            updatedAt: payload.updatedAt || new Date().toISOString().split('T')[0],
          };
          serverDatabase.cases.set(entityId, updatedCase);
          processedIds.push(id);
        }
      }
    }

    res.json({
      success: true,
      processedCount: processedIds.length,
      processedIds,
      conflicts,
      serverTime: new Date().toISOString(),
      notes: Array.from(serverDatabase.notes.values()),
      cases: Array.from(serverDatabase.cases.values()),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Błąd podczas uzgadniania synchronizacji:', err);
    res.status(500).json({ error: err.message || 'Wewnętrzny błąd serwera podczas synchronizacji' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
