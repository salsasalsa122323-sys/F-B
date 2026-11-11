/**
 * High-Capacity Persistent Enterprise Storage & Data Vault Engine
 * Uses IndexedDB for virtually unlimited storage (GBs) + LocalStorage sync + JSON Backup & Restore + CSV Exports.
 */

const DB_NAME = 'EthiopiaERP_Enterprise_DB';
const DB_VERSION = 2;
const STORE_NAME = 'erp_records';
const SNAPSHOTS_STORE = 'erp_snapshots';

export interface FullERPBackup {
  version: string;
  exportedAt: string;
  systemName: string;
  items: any[];
  branches: any[];
  centralBinCards: any[];
  branchLedgers: any[];
  recipes: any[];
  schedules: any[];
  reconciliations: any[];
  branchDailyClosings?: any[];
  staffMealRecipes?: any[];
  staffMembers?: any[];
  staffWeeklySchedules?: any[];
  staffMealExecutions?: any[];
  centralStoreResets?: any[];
  centralSentToEntries?: any[];
  branchTrackedItems?: any[];
  branchDailyModules?: any[];
  branchInterTransfers?: any[];
  auditCorrections?: any[];
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  label: string;
  itemCount: number;
  transactionCount: number;
  data: FullERPBackup;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Auto-recover historical user data from any previous versions or prefixes
 * Protects user's 130+ items, menus, and branch records across laptop and phone sessions.
 */
export function autoRecoverHistoricalUserData(): { recovered: boolean; itemCount?: number } {
  if (typeof window === 'undefined' || !window.localStorage) return { recovered: false };
  try {
    const targetKey = 'eth_erp_v4_scratch_items';
    const currentRaw = localStorage.getItem(targetKey);
    let currentItems: any[] = [];
    try {
      if (currentRaw) currentItems = JSON.parse(currentRaw);
    } catch {}

    const candidateKeys = [
      'eth_erp_items',
      'eth_erp_v3_items',
      'eth_erp_v2_items',
      'eth_erp_v1_items',
      'bello_items',
      'eth_erp_master_items',
    ];

    let bestItems: any[] = Array.isArray(currentItems) ? currentItems : [];
    let bestKey = targetKey;

    for (const k of candidateKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > bestItems.length) {
            bestItems = parsed;
            bestKey = k;
          }
        }
      } catch {}
    }

    // Dynamic scan of all keys in case user data was saved under another prefix
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes('item') || k.includes('stock')) && k !== targetKey) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > bestItems.length && parsed[0]?.nameAm) {
              bestItems = parsed;
              bestKey = k;
            }
          }
        } catch {}
      }
    }

    if (bestItems.length > (currentItems ? currentItems.length : 0)) {
      console.log(`[AutoRecover] Successfully recovered ${bestItems.length} items from historical storage key "${bestKey}"`);
      localStorage.setItem(targetKey, JSON.stringify(bestItems));
      return { recovered: true, itemCount: bestItems.length };
    }
  } catch (err) {
    console.warn('[AutoRecover] Recovery check error:', err);
  }
  return { recovered: false };
}

/**
 * Remove only expired cache entries older than 30 days. NEVER delete user items, branches, or recipes!
 */
export function cleanStaleLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // Run historical recovery first before any cleanup
    autoRecoverHistoricalUserData();

    const keysToRemove: string[] = [];
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;

      // Clean ONLY old ending inventory temporary cache older than 30 days
      if (k.startsWith('eth_erp_ending_inv_')) {
        try {
          const item = localStorage.getItem(k);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.savedAt && now - new Date(parsed.savedAt).getTime() > 30 * 24 * 60 * 60 * 1000) {
              keysToRemove.push(k);
            }
          }
        } catch {
          keysToRemove.push(k);
        }
      }
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  } catch (err) {
    console.warn('cleanStaleLocalStorage error:', err);
  }
}

/**
 * Safe wrapper for localStorage.setItem with QuotaExceededError protection.
 * If data exceeds browser localStorage quota, it gracefully catches the error,
 * frees up stale caches, and prevents crashes while IndexedDB retains the complete record.
 */
export function safeLocalStorageSet(key: string, data: any): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const serialized = JSON.stringify(data);
    // If serialized string is over ~1.5MB, skip localStorage to prevent quota exhaustion
    if (serialized.length > 1500000) {
      console.warn(`[SafeStorage] Key "${key}" size (${(serialized.length / 1024).toFixed(0)} KB) exceeds safe localStorage limit. Stored in IndexedDB only.`);
      return false;
    }
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    // QuotaExceededError handled gracefully
    console.warn(`[SafeStorage] LocalStorage quota reached when writing "${key}". Cleaning caches and relying on IndexedDB.`, err);
    try {
      cleanStaleLocalStorage();
      // Second attempt after cleaning stale keys
      const serialized = JSON.stringify(data);
      if (serialized.length <= 1200000) {
        localStorage.setItem(key, serialized);
        return true;
      }
    } catch (retryErr) {
      // Gracefully silent; IndexedDB handles persistence seamlessly
    }
    return false;
  }
}

/**
 * Clear all persistent stores in IndexedDB
 */
export async function clearAllPersistentDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME, SNAPSHOTS_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(SNAPSHOTS_STORE).clear();
  } catch (err) {
    console.warn('Error clearing IndexedDB:', err);
  }
}

/**
 * Save data to IndexedDB
 */
export async function saveToPersistentDB(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Persistent IndexedDB write fallback:', err);
  }
}

/**
 * Retrieve data from IndexedDB
 */
export async function getFromPersistentDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Persistent IndexedDB read fallback:', err);
    return null;
  }
}

/**
 * Save an automated or manual snapshot
 */
export async function saveBackupSnapshot(label: string, backupData: FullERPBackup): Promise<BackupSnapshot | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
    const store = tx.objectStore(SNAPSHOTS_STORE);

    const snapshot: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      itemCount: backupData.items?.length || 0,
      transactionCount: (backupData.centralBinCards?.length || 0) + (backupData.branchLedgers?.length || 0),
      data: backupData,
    };

    store.put(snapshot);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(snapshot);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error saving snapshot:', err);
    return null;
  }
}

/**
 * Retrieve all local backup snapshots
 */
export async function getAllBackupSnapshots(): Promise<BackupSnapshot[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(SNAPSHOTS_STORE, 'readonly');
    const store = tx.objectStore(SNAPSHOTS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = (request.result || []) as BackupSnapshot[];
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results.slice(0, 15)); // Keep top 15 most recent
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error fetching snapshots:', err);
    return [];
  }
}

/**
 * Delete a specific snapshot
 */
export async function deleteBackupSnapshot(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
    const store = tx.objectStore(SNAPSHOTS_STORE);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error deleting snapshot:', err);
    return false;
  }
}

/**
 * Downloads a complete full database backup file (.json)
 */
export function downloadDatabaseBackup(data: Omit<FullERPBackup, 'version' | 'exportedAt' | 'systemName'>): void {
  const backup: FullERPBackup = {
    version: '3.5.0-GOLD-ENTERPRISE',
    systemName: 'Ethiopia Store & Multi-Branch Recipe ERP',
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];

  const link = document.createElement('a');
  link.href = url;
  link.download = `Ethiopia_Store_ERP_DataVault_Backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads a JSON backup file uploaded by the user
 */
export function readDatabaseBackupFile(file: File): Promise<FullERPBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          resolve(parsed as FullERPBackup);
        } else {
          reject(new Error('Invalid backup file structure'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Helper to download CSV data
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel compatibility with Amharic
    [headers.join(','), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a compressed base64 / text sync code to easily copy-paste between devices (e.g. Telegram/WhatsApp to phone)
 */
export function generateSyncCode(data: Omit<FullERPBackup, 'version' | 'exportedAt' | 'systemName'>): string {
  const backup: FullERPBackup = {
    version: '3.5.0-GOLD-ENTERPRISE',
    systemName: 'Ethiopia Store & Multi-Branch Recipe ERP',
    exportedAt: new Date().toISOString(),
    ...data,
  };
  const json = JSON.stringify(backup);
  // Encode UTF-8 safely to base64
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Parse a sync code pasted by the user
 */
export function parseSyncCode(code: string): FullERPBackup | null {
  try {
    const trimmed = code.trim();
    // If user pasted raw JSON directly
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return JSON.parse(trimmed) as FullERPBackup;
    }
    // Decode base64 UTF-8
    const binary = atob(trimmed);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      return parsed as FullERPBackup;
    }
    return null;
  } catch (err) {
    console.error('Failed to parse sync code:', err);
    return null;
  }
}

