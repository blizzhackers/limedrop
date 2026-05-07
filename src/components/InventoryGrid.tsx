import { useStore } from "@tanstack/react-form";
import { ArrowUp, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type React from "react";
import { memo, useDeferredValue, useEffect, useRef, useState } from "react";
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
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
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
    const totalPages = Math.ceil(filteredInventory.length / PAGE_SIZE);
    const pageItems = filteredInventory.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE,
    );

    const { loadedCount, isLoadingMore, showBackToTop } = useInfiniteScroll({
      scrollRef,
      filteredCount: filteredInventory.length,
      pageSize: PAGE_SIZE,
      onFilteredCountReset: () => setPage(1),
    });

    const infiniteScrollItems = filteredInventory.slice(0, loadedCount);

    const filtersActive =
      (
        [
          "qualityFilter",
          "itemClassFilter",
          "etherealFilter",
          "runewordFilter",
          "identifiedFilter",
          "socketFilter",
          "colorFilter",
          "ilvlFilter",
          "levelReqFilter",
          "strReqFilter",
          "dexReqFilter",
        ] as const
      ).some((k) => filterValues[k] !== null) ||
      filterValues.itemTypeFilter.size > 0 ||
      filterValues.itemCodeFilter.length > 0 ||
      filterValues.classIdFilter.length > 0 ||
      filterValues.statFilters.length > 0;

    const handleBackToTop = () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    function handleToggleSelectAll() {
      const cartItemIds = useAppStore.getState().cartItemIds;
      if (selectAll) {
        useAppStore.setState((state) => {
          const cart = state.cart.filter(
            (item) =>
              !cartItemIds.has(item.itemid) ||
              !filteredInventory.some((i) => i.itemid === item.itemid),
          );
          const newCartItemIds = new Set(cart.map((i) => i.itemid));
          return { ...state, cart, cartItemIds: newCartItemIds };
        });
        setSelectAll(false);
      } else {
        useAppStore.setState((state) => {
          const toAdd = filteredInventory.filter(
            (i) => !cartItemIds.has(i.itemid),
          );
          const cart = [...state.cart, ...toAdd];
          const newCartItemIds = new Set(cart.map((i) => i.itemid));
          return { ...state, cart, cartItemIds: newCartItemIds };
        });
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
        className="rounded shadow p-0.5 md:px-2 flex flex-col flex-1 min-h-0"
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
          <div className="hidden md:flex justify-center items-center gap-1 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-25"
              onClick={() => {
                setPage((p) => Math.max(p - 1, 1));
                handleBackToTop();
              }}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-400 px-3 min-w-27.5 text-center">
              {page}
              {" / "}
              {fullyLoaded || selectedAccount !== "Show All" ? (
                totalPages
              ) : (
                <Loader2 className="w-3 h-3 animate-spin inline-block align-middle" />
              )}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-25"
              onClick={() => {
                setPage((p) => Math.min(p + 1, totalPages));
                handleBackToTop();
              }}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
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
