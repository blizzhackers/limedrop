import { useStore } from "@tanstack/react-form";
import { ArrowUp, Loader2 } from "lucide-react";
import type React from "react";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getItemPacks } from "@/db/itemPacksDb";
import { useFilteredInventory } from "@/hooks/useFilteredInventory";
import { useIsPortrait } from "@/hooks/useIsPortrait";
import type { D2BotAPI } from "@/lib/D2Bot";
import { useAppForm } from "@/lib/forms/filterForm";
import { setLoadingInventory, setPacks, useAppStore } from "@/stores/appStore";
import { DEFAULT_FILTER_VALUES } from "@/types/filterTypes";
import { ActiveFilterPills } from "./ActiveFilterPills";
import { AdvancedFilters } from "./AdvancedFilters";
import { InventoryCard } from "./InventoryCard";
import { InventoryToolbar } from "./InventoryToolbar";
import { SignInPrompt } from "./SignInPrompt";
import { Button } from "./ui/button";

interface InventoryGridProps {
  api: D2BotAPI;
  session: string | null;
  loadingAccounts: boolean;
  fetchInventory: () => Promise<void>;
  fetchAccounts: (session: string) => void;
}

const PAGE_SIZE = 100;

export const InventoryGrid: React.FC<InventoryGridProps> = memo(
  ({ session, fetchInventory, loadingAccounts, api, fetchAccounts }) => {
    const loadingInventory = useAppStore((s) => s.loadingInventory);
    const fullyLoaded = useAppStore((s) => s.fullyLoaded);
    const selectedAccount = useAppStore((s) => s.selectedAccount);

    const scrollRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const isPortrait = useIsPortrait();

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const filterForm = useAppForm({ defaultValues: DEFAULT_FILTER_VALUES });
    const filterValues = useStore(filterForm.store, (s) => s.values);
    const deferredFilterValues = useDeferredValue(filterValues);

    const filteredInventory = useFilteredInventory(deferredFilterValues);

    useEffect(() => {
      if (!session) return;
      getItemPacks(useAppStore.getState().username).then((packs) =>
        setPacks(packs.filter((p) => typeof p.id === "number")),
      );
    }, [session]);

    const [page, setPage] = useState(1);
    const [loadedItemsCount, setLoadedItemsCount] = useState(PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const totalPages = Math.ceil(filteredInventory.length / PAGE_SIZE);
    const pageItems = filteredInventory.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE,
    );
    const infiniteScrollItems = filteredInventory.slice(0, loadedItemsCount);

    const filtersActive =
      filterValues.qualityFilter !== null ||
      filterValues.itemClassFilter !== null ||
      filterValues.itemTypeFilter.size > 0 ||
      filterValues.etherealFilter !== null ||
      filterValues.runewordFilter !== null ||
      filterValues.identifiedFilter !== null ||
      filterValues.socketFilter !== null ||
      filterValues.colorFilter !== null ||
      filterValues.ilvlFilter !== null ||
      filterValues.levelReqFilter !== null ||
      filterValues.strReqFilter !== null ||
      filterValues.dexReqFilter !== null ||
      filterValues.itemCodeFilter !== "" ||
      filterValues.statFilters.length > 0;

    const handleScroll = useCallback(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const el = scrollRef.current;
        if (!el) return;

        setShowBackToTop(el.scrollTop > 300);

        const isNearBottom =
          el.scrollHeight - el.scrollTop - el.clientHeight < 500;
        const isMobile = window.innerWidth < 768;

        if (
          isNearBottom &&
          isMobile &&
          !isLoadingMore &&
          loadedItemsCount < filteredInventory.length
        ) {
          setIsLoadingMore(true);
          setTimeout(() => {
            const newLoadedCount = Math.min(
              loadedItemsCount + PAGE_SIZE,
              filteredInventory.length,
            );
            setLoadedItemsCount(newLoadedCount);
            setIsLoadingMore(false);
            setTimeout(() => {
              el.scrollBy({
                top: Math.min(PAGE_SIZE * 200 * 0.3, 400),
                behavior: "smooth",
              });
            }, 200);
          }, 300);
        }
      }, 100);
    }, [isLoadingMore, loadedItemsCount, filteredInventory.length]);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    const prevFilteredLength = useRef(filteredInventory.length);
    useEffect(() => {
      if (prevFilteredLength.current !== filteredInventory.length) {
        setLoadedItemsCount(PAGE_SIZE);
        setPage(1);
        prevFilteredLength.current = filteredInventory.length;
      }
    }, [filteredInventory.length]);

    const handleBackToTop = () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    function handleToggleSelectAll() {
      const cartItemIds = useAppStore.getState().cartItemIds;
      if (selectAll) {
        useAppStore.setState((state) => ({
          ...state,
          cart: state.cart.filter(
            (item) =>
              !cartItemIds.has(item.itemid) ||
              !filteredInventory.some((i) => i.itemid === item.itemid),
          ),
        }));
        setSelectAll(false);
      } else {
        useAppStore.setState((state) => ({
          ...state,
          cart: [
            ...state.cart,
            ...filteredInventory.filter((i) => !cartItemIds.has(i.itemid)),
          ],
        }));
        setSelectAll(true);
      }
    }

    function refreshInvo() {
      toast.info("Refreshing inventory...", { duration: 2000 });
      if (!filteredInventory.length) setLoadingInventory(true);
      setPage(1);
      fetchInventory();
    }

    function toggleAdvancedFilter() {
      if (!session) return;
      setShowAdvancedFilters((v) => !v);
    }

    return (
      <section
        className="md:col-span-3 bg-gray-800 rounded shadow p-0.5 md:p-2 flex flex-col"
        style={{ minHeight: "80vh" }}
      >
        <InventoryToolbar
          session={session}
          filtersActive={filtersActive}
          showAdvancedFilters={showAdvancedFilters}
          onRefresh={refreshInvo}
          onToggleFilters={toggleAdvancedFilter}
        />

        {!showAdvancedFilters && filtersActive && (
          <ActiveFilterPills form={filterForm} />
        )}

        {isPortrait ? (
          showAdvancedFilters && (
            <div className="px-1 pb-4">
              <AdvancedFilters form={filterForm} />
            </div>
          )
        ) : (
          <Sheet
            open={showAdvancedFilters}
            onOpenChange={setShowAdvancedFilters}
          >
            <SheetContent
              side="left"
              className="w-full sm:max-w-md md:max-w-lg bg-gray-900 border-gray-700 overflow-y-auto p-0"
            >
              <SheetHeader className="px-4 pt-4 pb-2">
                <SheetTitle className="text-white">Advanced Filters</SheetTitle>
                <SheetDescription className="text-gray-400 text-xs">
                  Narrow down your inventory results
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4">
                <AdvancedFilters form={filterForm} />
              </div>
            </SheetContent>
          </Sheet>
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
          <SignInPrompt api={api} fetchAccounts={fetchAccounts} />
        ) : loadingInventory ? (
          <div
            ref={scrollRef}
            style={{ height: "86dvh", overflowY: "auto" }}
            className="bg-gray-900 rounded p-2"
          >
            <div className="grid gap-4 p-1 mobile:grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-4 desktop:grid-cols-5 ultrawide:grid-cols-7 portrait:grid-cols-2">
              {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: Only used for loading skeleton, not real data
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
