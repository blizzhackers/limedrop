import { ArrowUp, Filter, Loader2, RefreshCw, X } from "lucide-react";
import {
  Activity,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { NTIPAliasColor, NTIPAliasFlag } from "@/constants/NTItemAlias";
import { sdk } from "@/constants/sdk";
import { getItemPacks } from "@/db/itemPacksDb";
import type { D2BotAPI } from "@/lib/D2Bot";
import { isV2Item } from "@/lib/utils";
import {
  setApiUrl,
  setLoadingInventory,
  setLoginOpen,
  setPacks,
  setPassword,
  setSession,
  setUsername,
  useAppStore,
} from "@/stores/appStore";
import { AdvancedFilters, type StatFilter } from "./AdvancedFilters";
import { InventoryCard } from "./InventoryCard";
import { Button } from "./ui/button";

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface InventoryGridProps {
  api: D2BotAPI;
  session: string | null;
  loadingAccounts: boolean;
  fetchInventory: () => Promise<void>;
  fetchAccounts: (session: string) => Promise<void>;
}

export const InventoryGrid: React.FC<InventoryGridProps> = memo(
  ({ session, fetchInventory, loadingAccounts, api, fetchAccounts }) => {
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
    const username = useAppStore((s) => s.username);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
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
        if (item.lod !== (gameType === "Expansion")) {
          return false;
        }
        if (item.sc !== (gameMode === "Softcore")) {
          return false;
        }
        if (item.ladder !== (gameClass === "Ladder")) {
          return false;
        }
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
    const [loadedItemsCount, setLoadedItemsCount] = useState(PAGE_SIZE); // For mobile infinite scroll
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const totalPages = Math.ceil(filteredInventory.length / PAGE_SIZE);

    // Desktop pagination
    const pageItems = filteredInventory.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE,
    );

    // Mobile infinite scroll
    const infiniteScrollItems = filteredInventory.slice(0, loadedItemsCount);

    const handleScroll = useCallback(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const el = scrollRef.current;
        if (el) {
          setShowBackToTop(el.scrollTop > 300);

          // Mobile infinite scroll detection
          const isNearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 500;
          const isMobile = window.innerWidth < 768; // md breakpoint

          if (
            isNearBottom &&
            isMobile &&
            !isLoadingMore &&
            loadedItemsCount < filteredInventory.length
          ) {
            setIsLoadingMore(true);

            // Add delay to show loading state
            setTimeout(() => {
              const newLoadedCount = Math.min(
                loadedItemsCount + PAGE_SIZE,
                filteredInventory.length,
              );
              setLoadedItemsCount(newLoadedCount);
              setIsLoadingMore(false);

              // Auto-scroll to show new content after loading
              setTimeout(() => {
                // Calculate approximate scroll distance based on loaded items
                // Assuming average item height of ~200px (including gaps)
                const approximateItemHeight = 200;
                const scrollDistance = Math.min(
                  PAGE_SIZE * approximateItemHeight * 0.3,
                  400,
                );

                el.scrollBy({
                  top: scrollDistance,
                  behavior: "smooth",
                });
              }, 200);
            }, 300);
          }
        }
      }, 100);
    }, [isLoadingMore, loadedItemsCount, filteredInventory.length]);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // Reset infinite scroll when filters change
    const prevFilteredLength = useRef(filteredInventory.length);
    useEffect(() => {
      if (prevFilteredLength.current !== filteredInventory.length) {
        setLoadedItemsCount(PAGE_SIZE);
        setPage(1);
        prevFilteredLength.current = filteredInventory.length;
      }
    }, [filteredInventory.length]);

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
      if (!filteredInventory.length) {
        setLoadingInventory(true);
      }
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
        className="md:col-span-3 bg-gray-800 rounded shadow p-0.5 md:p-2 flex flex-col"
        style={{ minHeight: "80vh" }}
      >
        {username === "demo" && session && (
          <div className="flex md:hidden items-center justify-between gap-1 px-2 py-1 mb-1 bg-orange-900/50 border border-orange-600/50 rounded text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-orange-200 font-medium text-xs">Demo</span>
              <span className="text-orange-300/70 text-xs">
                You're viewing sample inventory data
              </span>
            </div>
            <Button
              onClick={() => {
                setLoginOpen(true);
              }}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-0.5 h-5 ml-1"
            >
              Sign In
            </Button>
          </div>
        )}
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

        {username === "demo" && session && (
          <div className="hidden md:block mb-4 bg-gradient-to-r from-orange-900/50 to-yellow-900/50 border border-orange-600/50 rounded p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-orange-200 font-medium text-sm">
                  Demo Mode
                </span>
                <span className="text-orange-300/70 text-xs">
                  You're viewing sample inventory data
                </span>
              </div>
              <Button
                onClick={() => {
                  setLoginOpen(true);
                }}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
        {!showAdvancedFilters && filtersActive && (
          <div className="mb-4 bg-gray-900 p-3 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-300">
                Active Filters:
              </span>
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
                className="px-3 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-200 text-xs font-medium transition-colors border border-red-700"
              >
                Clear All Filters
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
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
            </div>
          </div>
        )}
        <Activity mode={showAdvancedFilters ? "visible" : "hidden"}>
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
        </Activity>
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
          <div className="bg-gray-900 rounded p-6 border border-gray-700">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-300">
                Sign in to view your inventory
              </h3>
              <p className="text-gray-400">
                Login with your account to access your Diablo 2 items, or try
                our demo to see how it works.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button
                  onClick={() => {
                    setLoginOpen(true);
                  }}
                  className="bg-lime-600 hover:bg-lime-700 text-white px-6 py-2"
                >
                  Sign In
                </Button>
                <span className="text-gray-500">or</span>
                <Button
                  onClick={async () => {
                    setIsDemoLoading(true);
                    try {
                      const demoUsername = "demo";
                      const demoPassword = "demo";
                      const demoApiUrl =
                        import.meta.env.VITE_DEMO_API_URL || DEFAULT_API_URL;
                      const session = await api.login(
                        demoUsername,
                        demoPassword,
                        demoApiUrl,
                      );

                      const validate = await api.validate(
                        demoPassword,
                        session,
                      );
                      if (!validate) {
                        throw new Error("Failed to validate session");
                      }
                      setSession(session || null);
                      setLoginOpen(false);

                      setApiUrl(demoApiUrl);
                      setUsername(demoUsername);
                      setPassword(demoPassword);

                      toast.success("Login successful!", {
                        description: "Welcome to LimeDrop!",
                      });
                      await fetchAccounts(session);
                    } catch (err: unknown) {
                      toast.error(
                        "Demo login failed. Please try again. " +
                          (err as Error).message,
                      );
                    } finally {
                      setIsDemoLoading(false);
                    }
                  }}
                  variant="outline"
                  disabled={isDemoLoading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 px-6 py-2 disabled:opacity-50"
                >
                  {isDemoLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Try Demo"
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Demo includes sample inventory data to explore features
              </p>
            </div>
          </div>
        ) : loadingInventory ? (
          <div
            ref={scrollRef}
            style={{ height: "86dvh", overflowY: "auto" }}
            className="bg-gray-900 rounded p-2"
          >
            <div className="grid gap-4 p-1 mobile:grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-4 desktop:grid-cols-5 ultrawide:grid-cols-7 portrait:grid-cols-2">
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
              <>
                <div className="grid gap-4 p-1 mobile:grid-cols-1 tablet:grid-cols-2 sm-laptop:grid-cols-4 laptop:grid-cols-5 desktop:grid-cols-5 ultrawide:grid-cols-7 portrait:grid-cols-2">
                  {/* Mobile: infinite scroll, Desktop: pagination */}
                  <div className="md:hidden contents">
                    {infiniteScrollItems.map((item, idx) => (
                      <InventoryCard key={item.itemid || idx} item={item} />
                    ))}
                  </div>
                  <div className="hidden md:contents">
                    {pageItems.map((item, idx) => (
                      <InventoryCard key={item.itemid || idx} item={item} />
                    ))}
                  </div>
                </div>
                {/* Mobile loading indicator - positioned as a sticky overlay */}
                {isLoadingMore && (
                  <div className="md:hidden sticky bottom-4 left-0 right-0 z-10 flex justify-center py-2">
                    <div className="flex items-center gap-2 bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 rounded-full px-4 py-2 shadow-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-lime-500" />
                      <span className="text-gray-300 text-sm font-medium">
                        Loading more items...
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {totalPages > 1 && !loadingInventory && (
          <>
            {/* Desktop pagination only */}
            <div className="hidden md:flex justify-center gap-2 mt-2 mb-[-8px]">
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
          </>
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
