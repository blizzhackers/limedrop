import { Checkbox } from "@/components/ui/checkbox";
import { getItemPacks } from "@/lib/itemPacksDb";
import { setPacks, useAppStore } from "@/stores/appStore";
import { ArrowUp, Filter, Loader2, RefreshCw } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdvancedFilters } from "./AdvancedFilters";
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
    const [socketFilter, setSocketFilter] = useState<number | null>(null);
    const [activeItemPackId, setActiveItemPackId] = useState<number | null>(
      null,
    );
    const [itemPackMultiplier, setItemPackMultiplier] = useState(1);

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
        if (socketFilter !== null && item.sockets !== socketFilter) {
          return false;
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
      activeItemPackId,
      itemPacks,
      itemPackMultiplier,
      socketFilter,
      gameType,
      gameMode,
      gameClass,
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
      runewordFilter !== null;

    return (
      <section
        className="md:col-span-3 bg-gray-800 rounded shadow p-4 flex flex-col"
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
            socketFilter={socketFilter}
            setSocketFilter={setSocketFilter}
            activeItemPackId={activeItemPackId}
            setActiveItemPackId={setActiveItemPackId}
            itemPackMultiplier={itemPackMultiplier}
            setItemPackMultiplier={setItemPackMultiplier}
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
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-1">
                {pageItems.map((item, idx) => (
                  <InventoryCard key={item.itemid || idx} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
        {totalPages > 1 && !loadingInventory && (
          <div className="flex justify-center gap-2 mt-2">
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
            className="fixed bottom-24 right-8 z-50 bg-lime-600 hover:bg-lime-700 text-white rounded-full shadow-lg p-3 transition-all flex items-center justify-center"
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
