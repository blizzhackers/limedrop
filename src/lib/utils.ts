import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { sdk } from "../constants/sdk";
import type { ApiItemResponse } from "./D2Bot";

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
  lvlreq: number;
  strreq: number;
  dexreq: number;
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

function buildV1ItemInfo(itemid: string, desc: string) {
  const [
    gid,
    classid,
    loc,
    x,
    y,
    ethFlag,
    rwFlag,
    itemType,
    itemQuality,
    itemClass,
    sockets,
    gfx,
    color,
  ] = itemid.split(":");

  const codeToQuality = {
    [sdk.colors.White]: sdk.items.quality.Normal,
    [sdk.colors.Blue]: sdk.items.quality.Magic,
    [sdk.colors.NeonGreen]: sdk.items.quality.Set,
    [sdk.colors.Yellow]: sdk.items.quality.Rare,
    [sdk.colors.LightGold]: sdk.items.quality.Crafted,
    [sdk.colors.DarkGold]: sdk.items.quality.Unique,
    [sdk.colors.Orange]: sdk.items.quality.Crafted,
    [sdk.colors.Gray]: sdk.items.quality.Normal,
  };

  return {
    version: 1 as const,
    gid,
    id: Number(classid),
    loc,
    x,
    y,
    ethereal: ethFlag === "1" || ethFlag === "eth",
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
      if (quality === sdk.items.quality.Crafted) {
        if (
          desc.includes("Rune") ||
          desc.includes("Essence") ||
          desc.includes("Token")
        ) {
          return sdk.items.quality.Normal;
        }
      }
      return quality ?? -1;
    })(),
    itemType: (() => {
      if (itemType) {
        return Number(itemType);
      }

      // simplest first
      if (desc.includes("Jewel")) {
        return sdk.items.type.Jewel;
      }
      if (desc.includes("Ring")) {
        return sdk.items.type.Ring;
      }
      if (desc.includes("Rune")) {
        return sdk.items.type.Rune;
      }
      if (desc.includes("Amulet")) {
        return sdk.items.type.Amulet;
      }
      if (desc.includes("Small Charm")) {
        return sdk.items.type.SmallCharm;
      }
      if (desc.includes("Large Charm")) {
        return sdk.items.type.LargeCharm;
      }
      if (desc.includes("Grand Charm")) {
        return sdk.items.type.GrandCharm;
      }
      if (desc.includes("Can be inserted")) {
        if (desc.includes("Amethyst")) {
          return sdk.items.type.Amethyst;
        }
        if (desc.includes("Topaz")) {
          return sdk.items.type.Topaz;
        }
        if (desc.includes("Sapphire")) {
          return sdk.items.type.Sapphire;
        }
        if (desc.includes("Emerald")) {
          return sdk.items.type.Emerald;
        }
        if (desc.includes("Ruby")) {
          return sdk.items.type.Ruby;
        }
        if (desc.includes("Diamond")) {
          return sdk.items.type.Diamond;
        }
        if (desc.includes("Skull")) {
          return sdk.items.type.Skull;
        }
      }

      if (desc.includes("Bow")) {
        if (desc.includes("Amazon Only")) {
          return sdk.items.type.AmazonBow;
        }
        return sdk.items.type.Bow;
      }

      if (desc.includes("Crossbow")) {
        return sdk.items.type.Crossbow;
      }

      if (desc.includes("Javelin")) {
        if (desc.includes("Amazon Only")) {
          return sdk.items.type.AmazonJavelin;
        }
        return sdk.items.type.Javelin;
      }

      if (desc.includes("Spear")) {
        if (desc.includes("Amazon Only")) {
          return sdk.items.type.AmazonSpear;
        }
        return sdk.items.type.Spear;
      }

      if (
        desc.includes("Armor") ||
        desc.includes("Mail") ||
        desc.includes("Plate") ||
        desc.includes("Cuirass") ||
        desc.includes("Scarab Husk")
      ) {
        return sdk.items.type.Armor;
      }

      if (desc.includes("Claw")) {
        return sdk.items.type.AssassinClaw;
      }

      if (desc.includes("Chance to Block")) {
        if (desc.includes("Paladin Only")) {
          return sdk.items.type.AuricShields;
        }
        if (desc.includes("Necromancer Only")) {
          return sdk.items.type.VoodooHeads;
        }
        return sdk.items.type.Shield;
      }

      if (desc.includes("Axe")) {
        if (desc.includes("Quantity")) {
          return sdk.items.type.ThrowingAxe;
        }
        return sdk.items.type.Axe;
      }

      if (
        desc.includes("Belt") ||
        desc.includes("Sash") ||
        desc.includes("Coil")
      ) {
        return sdk.items.type.Belt;
      }

      if (desc.includes("Boots") || desc.includes("Greaves")) {
        return sdk.items.type.Boots;
      }

      if (
        desc.includes("Circlet") ||
        desc.includes("Tiara") ||
        desc.includes("Diadem")
      ) {
        return sdk.items.type.Circlet;
      }

      if (desc.includes("Mace")) {
        if (desc.includes("Hammer") || desc.includes("Maul")) {
          return sdk.items.type.Hammer;
        }

        if (desc.includes("Scepter")) {
          return sdk.items.type.Scepter;
        }
        return sdk.items.type.Mace;
      }

      if (
        desc.includes("Helm") ||
        desc.includes("Mask") ||
        desc.includes("Crown") ||
        desc.includes("Casque") ||
        desc.includes("Cap")
      ) {
        return sdk.items.type.Helm;
      }

      if (desc.includes("Dagger")) {
        if (desc.includes("Quantity")) {
          return sdk.items.type.ThrowingKnife;
        }
        return sdk.items.type.Knife;
      }

      if (desc.includes("Staff")) {
        if (desc.includes("Sorceress Only")) {
          return sdk.items.type.Orb;
        }
        if (desc.includes("Necromancer Only") || desc.includes("Wand")) {
          return sdk.items.type.Wand;
        }
        return sdk.items.type.Staff;
      }

      if (
        desc.includes("Druid Only") &&
        (desc.includes("Antlers") ||
          desc.includes("Helm") ||
          desc.includes("Head") ||
          desc.includes("Mask"))
      ) {
        return sdk.items.type.Pelt;
      }

      if (desc.includes("Polearm")) {
        return sdk.items.type.Polearm;
      }

      if (
        desc.includes("Barbarian Only") &&
        (desc.includes("Helm") ||
          desc.includes("Crown") ||
          desc.includes("Guard"))
      ) {
        return sdk.items.type.PrimalHelm;
      }

      if (desc.includes("Sword")) {
        return sdk.items.type.Sword;
      }

      if (
        desc.includes("Gloves") ||
        desc.includes("Gauntlets") ||
        desc.includes("Bracers") ||
        desc.includes("Vambraces") ||
        desc.includes("Mitts")
      ) {
        return sdk.items.type.Gloves;
      }

      return 0; // Unknown
    })(),
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
    ilvl: (() => {
      // ilvl should always be in the first parentheses
      const match = desc.match(/(\d+)/);
      return match ? Number(match[1]) : 0;
    })(),
    lvlreq: (() => {
      const match = desc.match(/Required Level: (\d+)/);
      return match ? Number(match[1]) : 0;
    })(),
    strreq: (() => {
      const match = desc.match(/Required Strength: (\d+)/);
      return match ? Number(match[1]) : 0;
    })(),
    dexreq: (() => {
      const match = desc.match(/Required Dexterity: (\d+)/);
      return match ? Number(match[1]) : 0;
    })(),
  };
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

  // handle old logs without itemInfo
  if (!itemInfo || itemInfo.length === 1 || itemInfo === "eth") {
    return buildV1ItemInfo(itemid, desc);
  }

  try {
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
  } catch (e) {
    console.error("Failed to parse item info:", e);
    return buildV1ItemInfo(itemid, desc);
  }
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

export type GameRealm = (typeof REALMS)[number];
export type GameType = (typeof GAME_TYPES)[number];
export type GameMode = (typeof GAME_MODES)[number];
export type GameClass = (typeof GAME_CLASSES)[number];

export type Realm = (typeof REALMS)[number];
