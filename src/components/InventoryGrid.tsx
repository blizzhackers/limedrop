import { ArrowUp, Filter, Loader2, RefreshCw, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { getItemPacks } from "@/lib/itemPacksDb";
import { NTIPAliasColor, NTIPAliasFlag } from "@/lib/NTItemAlias";
import { sdk } from "@/lib/sdk";
import { isV2Item } from "@/lib/utils";
import { setPacks, useAppStore } from "@/stores/appStore";
import { AdvancedFilters, type StatFilter } from "./AdvancedFilters";
import { InventoryCard } from "./InventoryCard";
import { Button } from "./ui/button";

interface InventoryGridProps {
  session: string | null;
  loadingAccounts: boolean;
  fetchInventory: () => Promise<void>;
}

export const InventoryGrid: React.FC<InventoryGridProps> = memo(
  ({ session, fetchInventory, loadingAccounts }) => {
    const inventory = useAppStore((s) => s.inventory);
    const loadingInventory = useAppStore((s) => s.loadingInventory);
    const searchTerm = useAppStore((s) => s.searchTerm);
    const searchResults = useAppStore((s) => s.searchResults);
    const selectedAccount = useAppStore((s) => s.selectedAccount);
    const selectedCharacter = useAppStore((s) => s.selectedCharacter);
    const qualityFilter = useAppStore((s) => s.qualityFilter);
    const fullyLoaded = useAppStore((s) => s.fullyLoaded);
    const itemPacks = useAppStore((s) => s.packs);
    const gameType = useAppStore((s) => s.gameType);
    const gameMode = useAppStore((s) => s.gameMode);
    const gameClass = useAppStore((s) => s.gameClass);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [itemClassFilter, setItemClassFilter] = useState<number | null>(null);
    const [itemTypeFilter, setItemTypeFilter] = useState<Set<number>>(
      new Set(),
    );
    const [etherealFilter, setEtherealFilter] = useState<null | boolean>(null);
    const [runewordFilter, setRunewordFilter] = useState<null | boolean>(null);
    const [identifiedFilter, setIdentifiedFilter] = useState<null | boolean>(
      null,
    );
    const [socketFilter, setSocketFilter] = useState<number | null>(null);
    const [colorFilter, setColorFilter] = useState<number | null>(null);
    const [activeItemPackId, setActiveItemPackId] = useState<number | null>(
      null,
    );
    const [itemPackMultiplier, setItemPackMultiplier] = useState(1);

    // V2 Item filters
    const [ilvlFilter, setIlvlFilter] = useState<number | null>(null);
    const [ilvlComparison, setIlvlComparison] = useState<"gte" | "lte" | "eq">(
      "gte",
    );
    const [levelReqFilter, setLevelReqFilter] = useState<number | null>(null);
    const [levelReqComparison, setLevelReqComparison] = useState<
      "gte" | "lte" | "eq"
    >("lte");
    const [strReqFilter, setStrReqFilter] = useState<number | null>(null);
    const [strReqComparison, setStrReqComparison] = useState<
      "gte" | "lte" | "eq"
    >("lte");
    const [dexReqFilter, setDexReqFilter] = useState<number | null>(null);
    const [dexReqComparison, setDexReqComparison] = useState<
      "gte" | "lte" | "eq"
    >("lte");
    const [itemCodeFilter, setItemCodeFilter] = useState("");
    const [statFilters, setStatFilters] = useState<StatFilter[]>([]);

    useEffect(() => {
      if (!session) return;
      getItemPacks(useAppStore.getState().username).then((packs) =>
        setPacks(packs.filter((p) => typeof p.id === "number")),
      );
    }, [session]);

    const filteredInventory = useMemo(() => {
      const base = searchTerm ? searchResults : inventory;
      if (activeItemPackId && itemPacks.length) {
        const pack = itemPacks.find((p) => p.id === activeItemPackId);
        if (pack) {
          let result: typeof base = [];
          const usedIds = new Set();
          for (let m = 0; m < itemPackMultiplier; ++m) {
            for (const f of pack.filters) {
              let matches = base.filter((item) => {
                if (usedIds.has(item.itemid)) return false;
                if (f.name !== undefined && !item.title.match(f.name)) {
                  return false;
                }
                if (f.itemType !== undefined) {
                  if (Array.isArray(f.itemType)) {
                    if (!f.itemType.includes(item.itemType)) return false;
                  } else {
                    if (item.itemType !== f.itemType) return false;
                  }
                }
                if (f.quality !== undefined && item.quality !== f.quality) {
                  return false;
                }
                if (
                  f.itemClass !== undefined &&
                  item.itemClass !== f.itemClass
                ) {
                  return false;
                }
                if (f.ethereal !== undefined && item.ethereal !== f.ethereal) {
                  return false;
                }
                if (f.runeword !== undefined && item.runeword !== f.runeword) {
                  return false;
                }
                if (f.stats !== undefined && Array.isArray(f.stats)) {
                  try {
                    return f.stats.every((stat) =>
                      item.description.match(stat),
                    );
                  } catch (e) {
                    console.error(e);
                    return false;
                  }
                }
                if (f.sockets !== undefined && item.sockets !== f.sockets) {
                  return false;
                }

                // V2 Item Pack Filters
                if (isV2Item(item)) {
                  if (f.ilvl !== undefined) {
                    const comparison = f.ilvlComparison || "gte";
                    if (comparison === "gte" && item.ilvl < f.ilvl)
                      return false;
                    if (comparison === "lte" && item.ilvl > f.ilvl)
                      return false;
                    if (comparison === "eq" && item.ilvl !== f.ilvl)
                      return false;
                  }
                  if (f.levelReq !== undefined) {
                    const comparison = f.levelReqComparison || "lte";
                    if (comparison === "gte" && item.lvlreq < f.levelReq)
                      return false;
                    if (comparison === "lte" && item.lvlreq > f.levelReq)
                      return false;
                    if (comparison === "eq" && item.lvlreq !== f.levelReq)
                      return false;
                  }
                  if (
                    f.itemCode &&
                    !item.code.toLowerCase().includes(f.itemCode.toLowerCase())
                  ) {
                    return false;
                  }
                  if (f.statFilters && f.statFilters.length > 0) {
                    for (const statFilter of f.statFilters) {
                      const itemStatValue = item.stats[statFilter.stat];
                      if (itemStatValue === undefined) {
                        return false;
                      }
                      const numericValue =
                        typeof itemStatValue === "string"
                          ? Number.parseFloat(itemStatValue)
                          : itemStatValue;
                      if (Number.isNaN(numericValue)) {
                        return false;
                      }
                      switch (statFilter.comparison) {
                        case "gte":
                          if (numericValue < statFilter.value) return false;
                          break;
                        case "lte":
                          if (numericValue > statFilter.value) return false;
                          break;
                        case "eq":
                          if (numericValue !== statFilter.value) return false;
                          break;
                      }
                    }
                  }
                }

                return true;
              });
              if (f.count !== undefined) {
                matches = matches.slice(0, f.count);
              }
              result = result.concat(matches);

              for (const el of result) {
                usedIds.add(el.itemid);
              }
            }
          }
          return result;
        }
      }
      return base.filter((item) => {
        if (gameType === "Classic" && item.lod) return false;
        if (gameMode === "Hardcore" && item.sc) return false;
        if (gameClass === "Ladder" && !item.ladder) return false;
        if (
          selectedAccount !== "Show All" &&
          item.account !== selectedAccount
        ) {
          return false;
        }
        if (
          selectedCharacter !== "Show All" &&
          item.character !== selectedCharacter.split(".")[0]
        ) {
          return false;
        }
        if (qualityFilter !== null && item.quality !== qualityFilter) {
          return false;
        }
        if (itemClassFilter !== null && item.itemClass !== itemClassFilter) {
          return false;
        }
        if (itemTypeFilter.size > 0 && !itemTypeFilter.has(item.itemType)) {
          return false;
        }
        if (etherealFilter !== null && item.ethereal !== etherealFilter) {
          return false;
        }
        if (runewordFilter !== null && item.runeword !== runewordFilter) {
          return false;
        }
        if (identifiedFilter !== null) {
          if (isV2Item(item)) {
            const isIdentified = (item.flags & NTIPAliasFlag.identified) !== 0;
            if (isIdentified !== identifiedFilter) {
              return false;
            }
          }
        }
        if (socketFilter !== null && item.sockets !== socketFilter) {
          return false;
        }
        if (colorFilter !== null && item.color !== colorFilter) {
          return false;
        }

        // V2 Item filters (only apply to V2 items)
        if (isV2Item(item)) {
          if (ilvlFilter !== null) {
            if (ilvlComparison === "gte" && item.ilvl < ilvlFilter) {
              return false;
            }
            if (ilvlComparison === "lte" && item.ilvl > ilvlFilter) {
              return false;
            }
            if (ilvlComparison === "eq" && item.ilvl !== ilvlFilter) {
              return false;
            }
          }
          if (levelReqFilter !== null) {
            if (levelReqComparison === "gte" && item.lvlreq < levelReqFilter) {
              return false;
            }
            if (levelReqComparison === "lte" && item.lvlreq > levelReqFilter) {
              return false;
            }
            if (levelReqComparison === "eq" && item.lvlreq !== levelReqFilter) {
              return false;
            }
          }
          if (strReqFilter !== null) {
            if (strReqComparison === "gte" && item.strreq < strReqFilter) {
              return false;
            }
            if (strReqComparison === "lte" && item.strreq > strReqFilter) {
              return false;
            }
            if (strReqComparison === "eq" && item.strreq !== strReqFilter) {
              return false;
            }
          }
          if (dexReqFilter !== null) {
            if (dexReqComparison === "gte" && item.dexreq < dexReqFilter) {
              return false;
            }
            if (dexReqComparison === "lte" && item.dexreq > dexReqFilter) {
              return false;
            }
            if (dexReqComparison === "eq" && item.dexreq !== dexReqFilter) {
              return false;
            }
          }
          if (
            itemCodeFilter &&
            !item.code.toLowerCase().includes(itemCodeFilter.toLowerCase())
          ) {
            return false;
          }

          if (statFilters.length > 0) {
            for (const statFilter of statFilters) {
              const statKey = statFilter.stat;

              // Check if the item has this stat
              const itemStatValue = item.stats[statKey];
              if (itemStatValue === undefined) {
                return false; // Item doesn't have this stat
              }

              // Convert stat value to number for comparison
              const numericValue =
                typeof itemStatValue === "string"
                  ? Number.parseFloat(itemStatValue)
                  : itemStatValue;

              if (Number.isNaN(numericValue)) {
                return false; // Can't compare non-numeric value
              }

              // Apply comparison
              switch (statFilter.comparison) {
                case "gte":
                  if (numericValue < statFilter.value) return false;
                  break;
                case "lte":
                  if (numericValue > statFilter.value) return false;
                  break;
                case "eq":
                  if (numericValue !== statFilter.value) return false;
                  break;
              }
            }
          }
        } else {
          // For V1 items, skip if any V2-only filters are active
          if (
            ilvlFilter !== null ||
            levelReqFilter !== null ||
            strReqFilter !== null ||
            dexReqFilter !== null ||
            itemCodeFilter ||
            statFilters.length > 0
          ) {
            return false;
          }
        }

        return true;
      });
    }, [
      inventory,
      searchResults,
      searchTerm,
      selectedAccount,
      selectedCharacter,
      qualityFilter,
      itemClassFilter,
      itemTypeFilter,
      etherealFilter,
      runewordFilter,
      identifiedFilter,
      activeItemPackId,
      itemPacks,
      itemPackMultiplier,
      socketFilter,
      colorFilter,
      gameType,
      gameMode,
      gameClass,
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
    ]);

    const PAGE_SIZE = 100;
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(filteredInventory.length / PAGE_SIZE);
    const pageItems = filteredInventory.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE,
    );

    const handleScroll = useCallback(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const el = scrollRef.current;
        if (el) setShowBackToTop(el.scrollTop > 300);
      }, 100);
    }, []);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    const handleBackToTop = () => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    };

    function handleToggleSelectAll() {
      const cartItemIds = useAppStore.getState().cartItemIds;
      if (selectAll) {
        useAppStore.setState((state) => {
          const cartItems = state.cart.filter(
            (item) =>
              !cartItemIds.has(item.itemid) ||
              !filteredInventory.some((i) => i.itemid === item.itemid),
          );
          return { ...state, cart: cartItems };
        });
        setSelectAll(false);
      } else {
        useAppStore.setState((state) => {
          const toAdd = filteredInventory.filter(
            (i) => !cartItemIds.has(i.itemid),
          );
          return { ...state, cart: [...state.cart, ...toAdd] };
        });
        setSelectAll(true);
      }
    }

    function refreshInvo() {
      toast.info("Refreshing inventory...", { duration: 2000 });
      setPage(1);
      fetchInventory();
    }

    function toggleAdvancedFilter() {
      if (!session) return;
      setShowAdvancedFilters((v) => !v);
    }

    const filtersActive =
      qualityFilter !== null ||
      itemClassFilter !== null ||
      itemTypeFilter.size > 0 ||
      etherealFilter !== null ||
      runewordFilter !== null ||
      identifiedFilter !== null ||
      socketFilter !== null ||
      colorFilter !== null ||
      ilvlFilter !== null ||
      levelReqFilter !== null ||
      strReqFilter !== null ||
      dexReqFilter !== null ||
      itemCodeFilter !== "" ||
      statFilters.length > 0;

    return (
      <section
        className="md:col-span-3 bg-gray-800 rounded shadow p-2 flex flex-col"
        style={{ minHeight: "80vh" }}
      >
        <div className="flex flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center justify-start gap-2">
            <h2 className="text-xl font-bold">Inventory</h2>
            {session && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-5 md:w-5 hover:text-lime-500"
                onClick={refreshInvo}
                aria-label="Refresh Inventory"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant={showAdvancedFilters ? "default" : "outline"}
              size="icon"
              className={`relative ml-2 transition-colors ${
                showAdvancedFilters
                  ? "bg-lime-700 hover:bg-lime-600"
                  : "hover:bg-gray-700"
              }`}
              onClick={toggleAdvancedFilter}
              aria-label={showAdvancedFilters ? "Hide Filters" : "Show Filters"}
              title={
                !showAdvancedFilters && filtersActive
                  ? "Filters are active"
                  : showAdvancedFilters
                    ? "Hide Filters"
                    : "Show Filters"
              }
            >
              <Filter
                className={`transition-colors ${
                  showAdvancedFilters
                    ? "text-lime-400"
                    : "text-gray-400 group-hover:text-lime-400"
                }`}
              />
              {!showAdvancedFilters && filtersActive && (
                <span
                  className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-lime-400 border-2 border-gray-800 shadow"
                  title="Filters active"
                />
              )}
            </Button>
          </div>
        </div>
        {!showAdvancedFilters && filtersActive && (
          <div className="mb-4 bg-gray-900 p-3 rounded border border-gray-700">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-semibold text-gray-300">
                Active Filters:
              </span>
              {qualityFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Quality:</span>
                  <span className="text-white font-medium">
                    {
                      Object.entries(sdk.items.quality).find(
                        ([, v]) => v === qualityFilter,
                      )?.[0]
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      useAppStore.setState({ qualityFilter: null })
                    }
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove quality filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {itemClassFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Class:</span>
                  <span className="text-white font-medium">
                    {
                      Object.entries(sdk.items.class).find(
                        ([, v]) => v === itemClassFilter,
                      )?.[0]
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemClassFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove class filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {itemTypeFilter.size > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Item Types:</span>
                  <span className="text-white font-medium">
                    {itemTypeFilter.size} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemTypeFilter(new Set())}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Clear item type filters"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {etherealFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Ethereal:</span>
                  <span className="text-white font-medium">
                    {etherealFilter ? "Yes" : "No"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEtherealFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove ethereal filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {runewordFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Runeword:</span>
                  <span className="text-white font-medium">
                    {runewordFilter ? "Yes" : "No"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRunewordFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove runeword filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {identifiedFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Identified:</span>
                  <span className="text-white font-medium">
                    {identifiedFilter ? "Yes" : "No"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIdentifiedFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove identified filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {socketFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Sockets:</span>
                  <span className="text-white font-medium">{socketFilter}</span>
                  <button
                    type="button"
                    onClick={() => setSocketFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove socket filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {colorFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Color:</span>
                  <span className="text-white font-medium">
                    {
                      Object.entries(NTIPAliasColor).find(
                        ([, v]) => v === colorFilter,
                      )?.[0]
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setColorFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove color filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {ilvlFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">ilvl:</span>
                  <span className="text-white font-medium">
                    {ilvlComparison === "gte"
                      ? "≥"
                      : ilvlComparison === "lte"
                        ? "≤"
                        : "="}{" "}
                    {ilvlFilter}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIlvlFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove ilvl filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {levelReqFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Level Req:</span>
                  <span className="text-white font-medium">
                    {levelReqComparison === "gte"
                      ? "≥"
                      : levelReqComparison === "lte"
                        ? "≤"
                        : "="}{" "}
                    {levelReqFilter}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLevelReqFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove level requirement filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {strReqFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Str Req:</span>
                  <span className="text-white font-medium">
                    {strReqComparison === "gte"
                      ? "≥"
                      : strReqComparison === "lte"
                        ? "≤"
                        : "="}{" "}
                    {strReqFilter}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStrReqFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove strength requirement filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dexReqFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Dex Req:</span>
                  <span className="text-white font-medium">
                    {dexReqComparison === "gte"
                      ? "≥"
                      : dexReqComparison === "lte"
                        ? "≤"
                        : "="}{" "}
                    {dexReqFilter}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDexReqFilter(null)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove dexterity requirement filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {itemCodeFilter !== "" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
                  <span className="text-gray-400">Item Code:</span>
                  <span className="text-white font-medium">
                    {itemCodeFilter}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemCodeFilter("")}
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label="Remove item code filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statFilters.map((filter) => (
                <span
                  key={filter.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs"
                >
                  <span className="text-lime-400 font-medium">
                    {filter.stat}
                  </span>
                  <span className="text-gray-400">
                    {filter.comparison === "gte"
                      ? "≥"
                      : filter.comparison === "lte"
                        ? "≤"
                        : "="}
                  </span>
                  <span className="text-white font-mono">{filter.value}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setStatFilters(
                        statFilters.filter((f) => f.id !== filter.id),
                      )
                    }
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${filter.stat} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => {
                  useAppStore.setState({ qualityFilter: null });
                  setItemClassFilter(null);
                  setItemTypeFilter(new Set());
                  setEtherealFilter(null);
                  setRunewordFilter(null);
                  setIdentifiedFilter(null);
                  setSocketFilter(null);
                  setColorFilter(null);
                  setIlvlFilter(null);
                  setLevelReqFilter(null);
                  setStrReqFilter(null);
                  setDexReqFilter(null);
                  setItemCodeFilter("");
                  setStatFilters([]);
                }}
                className="ml-auto px-3 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-200 text-xs font-medium transition-colors border border-red-700"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
        {showAdvancedFilters && (
          <AdvancedFilters
            itemClassFilter={itemClassFilter}
            setItemClassFilter={setItemClassFilter}
            itemTypeFilter={itemTypeFilter}
            setItemTypeFilter={setItemTypeFilter}
            etherealFilter={etherealFilter}
            setEtherealFilter={setEtherealFilter}
            runewordFilter={runewordFilter}
            setRunewordFilter={setRunewordFilter}
            identifiedFilter={identifiedFilter}
            setIdentifiedFilter={setIdentifiedFilter}
            socketFilter={socketFilter}
            setSocketFilter={setSocketFilter}
            colorFilter={colorFilter}
            setColorFilter={setColorFilter}
            activeItemPackId={activeItemPackId}
            setActiveItemPackId={setActiveItemPackId}
            itemPackMultiplier={itemPackMultiplier}
            setItemPackMultiplier={setItemPackMultiplier}
            ilvlFilter={ilvlFilter}
            setIlvlFilter={setIlvlFilter}
            ilvlComparison={ilvlComparison}
            setIlvlComparison={setIlvlComparison}
            levelReqFilter={levelReqFilter}
            setLevelReqFilter={setLevelReqFilter}
            levelReqComparison={levelReqComparison}
            setLevelReqComparison={setLevelReqComparison}
            strReqFilter={strReqFilter}
            setStrReqFilter={setStrReqFilter}
            strReqComparison={strReqComparison}
            setStrReqComparison={setStrReqComparison}
            dexReqFilter={dexReqFilter}
            setDexReqFilter={setDexReqFilter}
            dexReqComparison={dexReqComparison}
            setDexReqComparison={setDexReqComparison}
            itemCodeFilter={itemCodeFilter}
            setItemCodeFilter={setItemCodeFilter}
            statFilters={statFilters}
            setStatFilters={setStatFilters}
          />
        )}
        {session && filteredInventory.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleToggleSelectAll}
              className="data-[state=checked]:bg-lime-500 border-gray-600"
            />
            <label
              htmlFor="select-all"
              className="text-sm select-none cursor-pointer"
            >
              {selectAll ? "Deselect All" : "Select All"} (visible)
            </label>
          </div>
        )}
        {!session ? (
          <div className="text-gray-400">Please login to view inventory.</div>
        ) : loadingInventory ? (
          <div
            ref={scrollRef}
            style={{ height: "86dvh", overflowY: "auto" }}
            className="bg-gray-900 rounded p-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-1">
              {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: No better key available here
                  key={idx}
                  className="h-40 bg-gray-700 animate-pulse rounded"
                />
              ))}
            </div>
          </div>
        ) : loadingAccounts && !filteredInventory.length ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <div
            ref={scrollRef}
            style={{ height: "86dvh", overflowY: "auto" }}
            className="bg-gray-900 rounded p-2"
          >
            {filteredInventory.length === 0 ? (
              <div className="text-gray-400">No items found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-1">
                {pageItems.map((item, idx) => (
                  <InventoryCard key={item.itemid || idx} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
        {totalPages > 1 && !loadingInventory && (
          <div className="flex justify-center gap-2 mt-2 mb-[-8px]">
            <Button
              type="button"
              onClick={() => {
                setPage((p) => Math.max(p - 1, 1));
                handleBackToTop();
              }}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-gray-400 self-center inline-flex items-center gap-1">
              Page {page} of{" "}
              {fullyLoaded || selectedAccount !== "Show All" ? (
                totalPages
              ) : (
                <Loader2 className="w-4 h-4 animate-spin inline-block" />
              )}
            </span>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setPage((p) => Math.min(p + 1, totalPages));
                handleBackToTop();
              }}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
        {session && filteredInventory.length > 0 && showBackToTop && (
          <button
            type="button"
            onClick={handleBackToTop}
            className="fixed bottom-6 right-6 z-50 bg-lime-600 hover:bg-lime-700 text-white rounded-full shadow-lg p-3 transition-all flex items-center justify-center"
            aria-label="Back to Top"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
          >
            <ArrowUp className="w-6 h-6" />
          </button>
        )}
      </section>
    );
  },
);
