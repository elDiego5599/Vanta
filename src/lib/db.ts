import { openDB, type IDBPDatabase } from 'idb';

interface DBSchema {
  cases: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      createdAt: number;
      updatedAt: number;
    };
  };
  evidence: {
    key: string;
    value: {
      id: string;
      caseId: string;
      nombre: string;
      tamano: string;
      estado: string;
      progreso: number;
      isTranscribed: boolean;
      data: ArrayBuffer;
      uploadedAt: number;
    };
  };
  transcriptions: {
    key: string;
    value: {
      id: string;
      evidenceId: string;
      caseId: string;
      lines: { t: string; text: string; start: number; end: number }[];
      createdAt: number;
      saved: boolean;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<DBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<DBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DBSchema>('vanta', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('evidence')) {
          const evidenceStore = db.createObjectStore('evidence', { keyPath: 'id' });
          evidenceStore.createIndex('caseId', 'caseId');
        }
        if (!db.objectStoreNames.contains('transcriptions')) {
          const txStore = db.createObjectStore('transcriptions', { keyPath: 'id' });
          txStore.createIndex('evidenceId', 'evidenceId');
          txStore.createIndex('caseId', 'caseId');
        }
      },
    });
  }
  return dbPromise;
}

export async function createCase(name: string, description: string): Promise<string> {
  const db = await getDB();
  const id = `case-${Date.now()}`;
  const now = Date.now();
  await db.add('cases', { id, name, description, createdAt: now, updatedAt: now });
  return id;
}

export async function getCases(): Promise<DBSchema['cases']['value'][]> {
  const db = await getDB();
  return db.getAll('cases');
}

export async function getCase(id: string): Promise<DBSchema['cases']['value'] | undefined> {
  const db = await getDB();
  return db.get('cases', id);
}

export async function deleteCase(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['cases', 'evidence', 'transcriptions'], 'readwrite');
  await tx.objectStore('cases').delete(id);
  let cursor = await tx.objectStore('evidence').index('caseId').openCursor(id);
  while (cursor) {
    await tx.objectStore('evidence').delete(cursor.primaryKey);
    cursor = await cursor.continue();
  }
  let txCursor = await tx.objectStore('transcriptions').index('caseId').openCursor(id);
  while (txCursor) {
    await tx.objectStore('transcriptions').delete(txCursor.primaryKey);
    txCursor = await txCursor.continue();
  }
  await tx.done;
}

export async function saveEvidence(
  id: string,
  caseId: string,
  nombre: string,
  tamano: string,
  data: ArrayBuffer,
): Promise<void> {
  const db = await getDB();
  await db.add('evidence', {
    id, caseId, nombre, tamano,
    estado: 'listo', progreso: 0, isTranscribed: false,
    data, uploadedAt: Date.now(),
  });
}

export async function getEvidenceByCase(caseId: string): Promise<DBSchema['evidence']['value'][]> {
  const db = await getDB();
  return db.getAllFromIndex('evidence', 'caseId', caseId);
}

export async function getEvidenceByCaseWithStatus(caseId: string): Promise<DBSchema['evidence']['value'][]> {
  const db = await getDB();
  const evs = await db.getAllFromIndex('evidence', 'caseId', caseId);
  const txs = await db.getAllFromIndex('transcriptions', 'caseId', caseId);
  const transcribedIds = new Set(txs.map(t => t.evidenceId));
  return evs.map(e => ({
    ...e,
    isTranscribed: e.isTranscribed || transcribedIds.has(e.id),
  }));
}

export async function getEvidenceFile(id: string): Promise<ArrayBuffer> {
  const db = await getDB();
  const item = await db.get('evidence', id);
  if (!item) throw new Error(`Evidence ${id} not found`);
  return item.data;
}

export async function updateEvidenceStatus(
  id: string,
  estado: string,
  progreso: number,
  isTranscribed?: boolean,
): Promise<void> {
  const db = await getDB();
  const item = await db.get('evidence', id);
  if (!item) return;
  await db.put('evidence', { ...item, estado, progreso, isTranscribed: isTranscribed ?? item.isTranscribed });
}

export async function deleteEvidence(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['evidence', 'transcriptions'], 'readwrite');
  await tx.objectStore('evidence').delete(id);
  let cursor = await tx.objectStore('transcriptions').index('evidenceId').openCursor(id);
  while (cursor) {
    await tx.objectStore('transcriptions').delete(cursor.primaryKey);
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function saveTranscription(
  evidenceId: string,
  caseId: string,
  lines: { t: string; text: string; start: number; end: number }[],
): Promise<string> {
  const db = await getDB();
  const id = `tx-${Date.now()}`;
  await db.add('transcriptions', {
    id, evidenceId, caseId, lines, createdAt: Date.now(), saved: true,
  });
  return id;
}

export async function getTranscriptionByEvidence(evidenceId: string): Promise<DBSchema['transcriptions']['value'] | undefined> {
  const db = await getDB();
  const results = await db.getAllFromIndex('transcriptions', 'evidenceId', evidenceId);
  return results[results.length - 1];
}

export async function getTranscriptionsByCase(caseId: string): Promise<DBSchema['transcriptions']['value'][]> {
  const db = await getDB();
  return db.getAllFromIndex('transcriptions', 'caseId', caseId);
}
