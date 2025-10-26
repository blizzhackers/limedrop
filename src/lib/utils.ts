import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApiItemResponse } from "./D2Bot";
import { sdk } from "./sdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type BaseInventoryItem = {
  itemid: string;
  lod: boolean;
  sc: boolean;
  ladder: boolean;
  account: string;
  character: string;
  description: string;
  image?: string;
  title: string;
  realm: string;
  gid: string;
};

type V1InventoryItem = BaseInventoryItem & {
  version: 1;
  id: number;
  quality: number;
  itemType: number;
  itemClass: number;
  runeword: boolean;
  ethereal: boolean;
  sockets: number;
  gfx: number;
  color: number;
};

type ItemInfo = {
  id: number;
  code: string;
  name: string;
  prefix: string | undefined;
  suffix: string | undefined;
  prefixes: string[];
  suffixes: string[];
  prefixnum: number;
  suffixnum: number;
  prefixnums: number[];
  suffixnums: number[];
  itemType: number;
  itemClass: number;
  quality: number;
  sockets: number;
  gfx: number;
  color: number;
  ilvl: number;
  lvlreq: number;
  strreq: number;
  dexreq: number;
  flags: number;
  ethereal: boolean;
  runeword: boolean;
  stats: Record<string, string | number>;
};

type V2InventoryItem = BaseInventoryItem & {
  version: 2;
} & ItemInfo;

export type InventoryItem = V1InventoryItem | V2InventoryItem;

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
    if (!Object.hasOwn(bObj, key) || !deepEqual(aObj[key], bObj[key])) {
      return false;
    }
  }
  return true;
}

export function extractItemInfo(itemid: string, desc: string) {
  /**
    // From Mulelogger.logItem
    let desc = (
      Item.getItemDesc(unit, logIlvl) + "$"
      + unit.gid + ":"
      + unit.classid + ":"
      + unit.location + ":"
      + unit.x + ":"
      + unit.y + ":"
      + {
        id: unit.classid,
        code: unit.code,
        name: name,
        prefix: unit.prefix,
        suffix: unit.suffix,
        prefixes: unit.prefixes,
        suffixes: unit.suffixes,
        prefixnum: unit.prefixnum,
        suffixnum: unit.suffixnum,
        prefixnums: unit.prefixnums,
        suffixnums: unit.suffixnums,
        type: unit.itemType,
        itemClass: unit.itemclass,
        quality: unit.quality,
        sockets: unit.sockets,
        gfx: unit.gfx,
        color: color,
        ilvl: unit.ilvl,
        lvlreq: unit.lvlreq,
        strreq: unit.strreq,
        dexreq: unit.dexreq,
        flags: unit.getFlags(),
        ethereal: unit.getFlag(sdk.items.flags.Ethereal),
        runeword: unit.getFlag(sdk.items.flags.Runeword),
        stats: MuleLogger.dumpItemStats(unit)
      } + ":"
    );
   */
  const [gid, classid, loc, x, y, itemInfo] = itemid.split(":");

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

  // handle old logs without itemInfo
  if (!itemInfo || itemInfo.length === 1) {
    const [
      _gid,
      _classid,
      _loc,
      _x,
      _y,
      ethFlag,
      rwFlag,
      itemType,
      itemQuality,
      itemClass,
      sockets,
      gfx,
      color,
    ] = itemid.split(":");

    return {
      version: 1 as const,
      gid,
      id: Number(classid),
      loc,
      x,
      y,
      ethereal: ethFlag === "1",
      runeword: rwFlag === "1",
      quality: (() => {
        if (itemQuality) {
          return Number(itemQuality);
        }
        const code = desc.slice(0, 3);
        if (code === sdk.colors.Gray && desc.includes("Superior")) {
          return sdk.items.quality.Superior;
        }
        const quality = codeToQuality[code];
        return quality ?? -1;
      })(),
      itemType: Number(itemType),
      itemClass: Number(itemClass),
      sockets: (() => {
        if (sockets) {
          return Number(sockets);
        }
        const match = desc.match(/Socketed \((\d+)\)/);
        return match ? Number(match[1]) : 0;
      })(),
      gfx: Number(gfx),
      color: Number(color),
    };
  }

  const itemDump = JSON.parse(atob(itemInfo)) as ItemInfo;

  return {
    version: 2 as const,
    gid,
    classid: Number(classid),
    loc,
    x,
    y,
    ...itemDump,
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
  const [desc, itemid] = el.description.split("$");
  const itemInfo = extractItemInfo(itemid, desc);

  const baseItem = {
    ...el,
    title: desc.split("\n")[0],
    description: desc,
    itemid: itemid,
    realm: realm.toLowerCase(),
  };

  if (itemInfo.version === 1) {
    return {
      ...baseItem,
      version: 1,
      quality: itemInfo.quality,
      id: itemInfo.id,
      itemClass: itemInfo.itemClass,
      itemType: itemInfo.itemType,
      runeword: itemInfo.runeword,
      ethereal: itemInfo.ethereal,
      sockets: itemInfo.sockets,
      gfx: itemInfo.gfx,
      color: itemInfo.color,
    } as V1InventoryItem;
  }

  return {
    ...baseItem,
    ...itemInfo,
  } as V2InventoryItem;
}

export function isV1Item(item: InventoryItem): item is V1InventoryItem {
  return item.version === 1;
}

export function isV2Item(item: InventoryItem): item is V2InventoryItem {
  return item.version === 2;
}

export const REALMS = ["USEast", "USWest", "Europe", "Asia"] as const;
export const GAME_TYPES = ["Expansion", "Classic"] as const;
export const GAME_MODES = ["Softcore", "Hardcore"] as const;
export const GAME_CLASSES = ["Ladder", "NonLadder"] as const;

export type Realm = (typeof REALMS)[number];
