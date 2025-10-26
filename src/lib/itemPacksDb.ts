import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import { openLimeDropDb } from "./openLimeDropDb";

const STORE_NAME = "itemPacks";

export interface ItemPackFilter {
  name?: string;
  itemType?: number[];
  count?: number;
  sockets?: number;
  runeword?: boolean;
  description?: string;
  classid?: number;
  quality?: number;
  itemClass?: number;
  ethereal?: boolean;
  stats?: string[];
  // V2 filters
  ilvl?: number;
  ilvlComparison?: "gte" | "lte" | "eq";
  levelReq?: number;
  levelReqComparison?: "gte" | "lte" | "eq";
  itemCode?: string;
  statFilters?: Array<{
    stat: string;
    comparison: "gte" | "lte" | "eq";
    value: number;
  }>;
}

export interface ItemPackRaw {
  id: number;
  username: string;
  encrypted: string;
  createdAt: number;
}

export interface ItemPack {
  id: number;
  label: string;
  filters: ItemPackFilter[];
  createdAt: number;
}

function encryptPackData(
  data: { label: string; filters: ItemPackFilter[] },
  username: string,
): string {
  const key = `${username}-limedrop`;
  return AES.encrypt(JSON.stringify(data), key).toString();
}

function decryptPackData(
  ciphertext: string,
  username: string,
): { label: string; filters: ItemPackFilter[] } | null {
  const key = `${username}-limedrop`;
  try {
    const bytes = AES.decrypt(ciphertext, key);
    const json = bytes.toString(Utf8);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function addItemPack({
  label,
  filters,
  username,
}: {
  label: string;
  filters: ItemPackFilter[];
  username: string;
}) {
  const db = await openLimeDropDb();
  const encrypted = encryptPackData({ label, filters }, username);
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add({ username, encrypted, createdAt: Date.now() });
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getItemPacks(
  username: string,
  limit = 20,
): Promise<Array<ItemPack>> {
  const db = await openLimeDropDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const packs: ItemPackRaw[] = [];
    const req = store.openCursor(null, "prev");
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor && packs.length < limit) {
        if (cursor.value.username === username) {
          packs.push(cursor.value);
        }
        cursor.continue();
      } else {
        const result: ItemPack[] = packs
          .map((pack) => {
            const decrypted = decryptPackData(pack.encrypted, username);
            return decrypted
              ? { id: pack.id, ...decrypted, createdAt: pack.createdAt }
              : null;
          })
          .filter((p): p is ItemPack => Boolean(p) && p !== null);
        resolve(result);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteItemPack(id: number) {
  const db = await openLimeDropDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateItemPack(
  id: number,
  {
    label,
    filters,
    username,
  }: { label: string; filters: ItemPackFilter[]; username: string },
) {
  const db = await openLimeDropDb();
  const encrypted = encryptPackData({ label, filters }, username);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ id, username, encrypted, createdAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
