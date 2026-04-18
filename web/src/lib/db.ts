import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { LogRecord, StoredLogEnvelope } from '../types/log'
import { nowIndiaISOString } from './dates'

const DB_NAME = 'execution-os'
/** v2: LogRecord includes day_type (defaulted on read for older rows). */
const DB_VERSION = 2
const STORE = 'logs'

interface ExecOSDB extends DBSchema {
  logs: {
    key: string
    value: StoredLogEnvelope
    indexes: { 'by-sync': string }
  }
}

let dbPromise: Promise<IDBPDatabase<ExecOSDB>> | null = null

function getDb(): Promise<IDBPDatabase<ExecOSDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ExecOSDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const s = db.createObjectStore(STORE, { keyPath: 'date' })
          s.createIndex('by-sync', 'syncStatus')
        }
      },
    })
  }
  return dbPromise
}

export async function getLogEnvelope(
  date: string,
): Promise<StoredLogEnvelope | undefined> {
  const db = await getDb()
  return db.get(STORE, date)
}

export async function putLogEnvelope(env: StoredLogEnvelope): Promise<void> {
  const db = await getDb()
  await db.put(STORE, env)
}

export async function deleteLogLocal(date: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, date)
}

export async function getAllLogEnvelopes(): Promise<StoredLogEnvelope[]> {
  const db = await getDb()
  return db.getAll(STORE)
}

export async function saveLogLocal(
  data: LogRecord,
  syncStatus: 'pending' | 'synced',
): Promise<void> {
  const env: StoredLogEnvelope = {
    date: data.date,
    data: { ...data, last_updated_at: nowIndiaISOString() },
    syncStatus,
  }
  await putLogEnvelope(env)
}
