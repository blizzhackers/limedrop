import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApiItemResponse } from "./D2Bot";
import { sdk } from "./sdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InventoryItem {
  itemid: string;
  lod: boolean;
  sc: boolean;
  ladder: boolean;

  account: string;
  character: string;

  // Item details
  description: string;
  image?: string;

  title: string;
  realm: string;
  classid: number;
  quality: number;
}

// Deep equality helper for objects/arrays
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (
      !Object.prototype.hasOwnProperty.call(bObj, key) ||
      !deepEqual(aObj[key], bObj[key])
    ) {
      return false;
    }
  }
  return true;
}

export function extractItemInfo(itemid: string, desc: string) {
  //unit.gid ":" + unit.classid + ":" + unit.location + ":" + unit.x + ":" + unit.y + ":" + unit.ethereal;
  const [gid, classid, loc, x, y, eth] = itemid.split(":");
  const codeToQuality = {
    [sdk.colors.White]: sdk.items.quality.Normal,
    [sdk.colors.Blue]: sdk.items.quality.Magic,
    [sdk.colors.NeonGreen]: sdk.items.quality.Set,
    [sdk.colors.Yellow]: sdk.items.quality.Rare,
    [sdk.colors.LightGold]: sdk.items.quality.Crafted,
    [sdk.colors.DarkGold]: sdk.items.quality.Unique,
    [sdk.colors.Orange]: sdk.items.quality.Normal,
    [sdk.colors.Gray]: sdk.items.quality.Normal,
  };

  return {
    gid,
    classid: Number(classid),
    loc,
    x,
    y,
    eth: !!eth,
    quality: (() => {
      const code = desc.slice(0, 3);
      if (code === sdk.colors.Gray && desc.includes("Superior")) {
        return sdk.items.quality.Superior;
      }
      const quality = codeToQuality[code];
      // console.debug(code, desc.split("\n")[0]);
      return quality ?? -1;
    })(),
    rune: desc.slice(0, 3) === sdk.colors.Orange,
    quest: Object.values(sdk.items.quest).includes(Number(classid)),
  };
}

// Natural sort helper for account names
export function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

// Helper to append items without duplicates
export function appendUniqueItems(
  prev: InventoryItem[],
  newItems: InventoryItem[],
) {
  const existingIds = new Set(prev.map((i) => i.itemid));
  return prev.concat(newItems.filter((i) => !existingIds.has(i.itemid)));
}

export function mapApiItemToInventoryItem(
  el: ApiItemResponse,
  realm: string,
): InventoryItem {
  const [desc, id] = el.description.split("$");
  const { quality, classid } = extractItemInfo(id, desc);

  return {
    ...el,
    title: desc.split("\n")[0],
    description: desc,
    itemid: id,
    realm: realm.toLowerCase(),
    quality,
    classid,
  };
}

export const REALMS = ["USEast", "USWest", "Europe", "Asia"] as const;
export const GAME_TYPES = ["Expansion", "Classic"] as const;
export const GAME_MODES = ["Softcore", "Hardcore"] as const;
export const GAME_CLASSES = ["Ladder", "NonLadder"] as const;

export type Realm = (typeof REALMS)[number];
