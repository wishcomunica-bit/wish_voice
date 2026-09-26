import { AudioVersion, HistoryRecord } from '../types';

const DB_NAME = 'VoiceStudioDB';
const DB_VERSION = 1;
const STORE_HISTORY = 'history';
const STORE_VERSIONS = 'versions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VERSIONS)) {
        db.createObjectStore(STORE_VERSIONS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveHistoryItem(item: HistoryRecord): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_HISTORY, 'readwrite');
      const store = transaction.objectStore(STORE_HISTORY);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error saving to IndexedDB:', err);
  }
}

export async function getAllHistory(): Promise<HistoryRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_HISTORY, 'readonly');
      const store = transaction.objectStore(STORE_HISTORY);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as HistoryRecord[];
        // Sort newest first
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error fetching history from IndexedDB:', err);
    return [];
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_HISTORY, 'readwrite');
      const store = transaction.objectStore(STORE_HISTORY);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error deleting from IndexedDB:', err);
  }
}

export async function clearAllHistory(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_HISTORY, 'readwrite');
      const store = transaction.objectStore(STORE_HISTORY);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error clearing history:', err);
  }
}
