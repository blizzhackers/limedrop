const DB_NAME = "limedrop-db";
const DB_VERSION = 2;

const STORES = [
  { name: "recentDrops", options: { keyPath: "id", autoIncrement: true } },
  { name: "itemPacks", options: { keyPath: "id", autoIncrement: true } },
];

export function openLimeDropDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store.name)) {
          db.createObjectStore(store.name, store.options);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
