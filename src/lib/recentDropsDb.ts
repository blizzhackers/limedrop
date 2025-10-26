import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import { openLimeDropDb } from "./openLimeDropDb";
import type { InventoryItem } from "./utils";

const STORE_NAME = "recentDrops";

export interface RecentDrop {
  id?: number;
  username: string;
  encrypted: string;
  droppedAt: number;
}

// Encrypt drop data (items and gameName) with a key derived from username
function encryptDropData(
  data: { items: InventoryItem[]; gameName: string },
  username: string,
): string {
  const key = `${username}-limedrop`;
  return AES.encrypt(JSON.stringify(data), key).toString();
}

function decryptDropData(
  ciphertext: string,
  username: string,
): { items: InventoryItem[]; gameName: string } | null {
  const key = `${username}-limedrop`;
  try {
    const bytes = AES.decrypt(ciphertext, key);
    const json = bytes.toString(Utf8);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function addRecentDrop({
  items,
  gameName,
  username,
}: {
  items: InventoryItem[];
  gameName: string;
  username: string;
}) {
  const db = await openLimeDropDb();
  const encrypted = encryptDropData({ items, gameName }, username);
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add({ username, encrypted, droppedAt: Date.now() });
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getRecentDrops(
  username: string,
  limit = 10,
): Promise<
  Array<{
    id?: number;
    items: InventoryItem[];
    gameName: string;
    droppedAt: number;
  }>
> {
  const db = await openLimeDropDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const drops: RecentDrop[] = [];
    const req = store.openCursor(null, "prev");
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor && drops.length < limit) {
        if (cursor.value.username === username) {
          drops.push(cursor.value);
        }
        cursor.continue();
      } else {
        // Decrypt and map
        const result = drops
          .map((drop) => {
            const decrypted = decryptDropData(drop.encrypted, username);
            return decrypted
              ? { id: drop.id, ...decrypted, droppedAt: drop.droppedAt }
              : null;
          })
          .filter(Boolean) as Array<{
          id?: number;
          items: InventoryItem[];
          gameName: string;
          droppedAt: number;
        }>;
        resolve(result);
      }
    };
    req.onerror = () => reject(req.error);
  });
}
