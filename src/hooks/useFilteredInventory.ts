import { useMemo } from "react";
import { NTIPAliasFlag } from "@/constants/NTItemAlias";
import type { InventoryItem } from "@/lib/utils";
import { isV2Item } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import type {
  Comparison,
  FilterFormValues,
  StatFilter,
} from "@/types/filterTypes";

function compareNumeric(
  value: number,
  filter: number,
  comparison: Comparison,
): boolean {
  if (comparison === "gte") return value >= filter;
  if (comparison === "lte") return value <= filter;
  return value === filter;
}

function checkStatFilters(
  item: InventoryItem,
  statFilters: StatFilter[],
): boolean {
  if (!isV2Item(item)) return statFilters.length === 0;
  return statFilters.every((sf) => {
    const raw = item.stats[sf.stat];
    if (raw === undefined) return false;
    const num = typeof raw === "string" ? Number.parseFloat(raw) : raw;
    return !Number.isNaN(num) && compareNumeric(num, sf.value, sf.comparison);
  });
}

export function useFilteredInventory(
  deferredFilterValues: FilterFormValues,
): InventoryItem[] {
  const inventory = useAppStore((s) => s.inventory);
  const searchResults = useAppStore((s) => s.searchResults);
  const searchTerm = useAppStore((s) => s.searchTerm);
  const selectedAccount = useAppStore((s) => s.selectedAccount);
  const selectedCharacter = useAppStore((s) => s.selectedCharacter);
  const itemPacks = useAppStore((s) => s.packs);
  const gameType = useAppStore((s) => s.gameType);
  const gameMode = useAppStore((s) => s.gameMode);
  const gameClass = useAppStore((s) => s.gameClass);

  return useMemo(() => {
    const {
      qualityFilter,
      itemClassFilter,
      itemTypeFilter,
      etherealFilter,
      runewordFilter,
      identifiedFilter,
      socketFilter,
      colorFilter,
      activeItemPackId,
      itemPackMultiplier,
      ilvlFilter,
      ilvlComparison,
      levelReqFilter,
      levelReqComparison,
      strReqFilter,
      strReqComparison,
      dexReqFilter,
      dexReqComparison,
      itemCodeFilter,
      statFilters,
    } = deferredFilterValues;

    const base = searchTerm ? searchResults : inventory;

    // ── Item pack filter ─────────────────────────────────────────────────────
    if (activeItemPackId && itemPacks.length) {
      const pack = itemPacks.find((p) => p.id === activeItemPackId);
      if (pack) {
        let result: typeof base = [];
        const usedIds = new Set<string>();

        for (let m = 0; m < itemPackMultiplier; ++m) {
          for (const f of pack.filters) {
            let matches = base.filter((item) => {
              if (usedIds.has(item.itemid)) return false;
              if (f.name !== undefined && !item.title.match(f.name))
                return false;
              if (f.itemType !== undefined) {
                if (Array.isArray(f.itemType)) {
                  if (!f.itemType.includes(item.itemType)) return false;
                } else {
                  if (item.itemType !== f.itemType) return false;
                }
              }
              if (f.quality !== undefined && item.quality !== f.quality)
                return false;
              if (f.itemClass !== undefined && item.itemClass !== f.itemClass)
                return false;
              if (f.ethereal !== undefined && item.ethereal !== f.ethereal)
                return false;
              if (f.runeword !== undefined && item.runeword !== f.runeword)
                return false;
              if (f.stats !== undefined && Array.isArray(f.stats)) {
                try {
                  return f.stats.every((stat) => item.description.match(stat));
                } catch (e) {
                  console.error(e);
                  return false;
                }
              }
              if (f.sockets !== undefined && item.sockets !== f.sockets)
                return false;
              if (isV2Item(item)) {
                if (
                  f.ilvl !== undefined &&
                  !compareNumeric(item.ilvl, f.ilvl, f.ilvlComparison || "gte")
                )
                  return false;
                if (
                  f.levelReq !== undefined &&
                  !compareNumeric(
                    item.lvlreq,
                    f.levelReq,
                    f.levelReqComparison || "lte",
                  )
                )
                  return false;
                if (
                  f.itemCode &&
                  !item.code.toLowerCase().includes(f.itemCode.toLowerCase())
                )
                  return false;
                if (
                  f.statFilters?.length &&
                  !checkStatFilters(item, f.statFilters as StatFilter[])
                )
                  return false;
              }
              return true;
            });

            if (f.count !== undefined) {
              matches = matches.slice(0, f.count);
            }
            result = result.concat(matches);
            for (const el of result) usedIds.add(el.itemid);
          }
        }
        return result;
      }
    }

    // ── Standard filter ─────────────────────────────────────────────────────
    return base.filter((item) => {
      // Search API doesn't pre-filter by game mode — apply here only for search results
      if (searchTerm) {
        if (item.lod !== (gameType === "Expansion")) return false;
        if (item.sc !== (gameMode === "Softcore")) return false;
        if (item.ladder !== (gameClass === "Ladder")) return false;
      }
      if (selectedAccount !== "Show All" && item.account !== selectedAccount)
        return false;
      if (
        selectedCharacter !== "Show All" &&
        item.character !== selectedCharacter.split(".")[0]
      )
        return false;
      if (qualityFilter !== null && item.quality !== qualityFilter)
        return false;
      if (itemClassFilter !== null && item.itemClass !== itemClassFilter)
        return false;
      if (itemTypeFilter.size > 0 && !itemTypeFilter.has(item.itemType))
        return false;
      if (etherealFilter !== null && item.ethereal !== etherealFilter)
        return false;
      if (runewordFilter !== null && item.runeword !== runewordFilter)
        return false;
      if (identifiedFilter !== null && isV2Item(item)) {
        const isIdentified = (item.flags & NTIPAliasFlag.identified) !== 0;
        if (isIdentified !== identifiedFilter) return false;
      }
      if (socketFilter !== null && item.sockets !== socketFilter) return false;
      if (colorFilter !== null && item.color !== colorFilter) return false;
      if (
        ilvlFilter !== null &&
        !compareNumeric(item.ilvl, ilvlFilter, ilvlComparison)
      )
        return false;
      if (
        levelReqFilter !== null &&
        !compareNumeric(item.lvlreq, levelReqFilter, levelReqComparison)
      )
        return false;
      if (
        strReqFilter !== null &&
        !compareNumeric(item.strreq, strReqFilter, strReqComparison)
      )
        return false;
      if (
        dexReqFilter !== null &&
        !compareNumeric(item.dexreq, dexReqFilter, dexReqComparison)
      )
        return false;
      if (isV2Item(item)) {
        if (
          itemCodeFilter &&
          !item.code.toLowerCase().includes(itemCodeFilter.toLowerCase())
        )
          return false;
        if (!checkStatFilters(item, statFilters)) return false;
      } else {
        if (itemCodeFilter || statFilters.length > 0) return false;
      }
      return true;
    });
  }, [
    inventory,
    searchResults,
    searchTerm,
    selectedAccount,
    selectedCharacter,
    deferredFilterValues,
    itemPacks,
    gameType,
    gameMode,
    gameClass,
  ]);
}
