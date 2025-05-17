import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sdk } from "@/lib/sdk";
import { setQualityFilter, useAppStore } from "@/stores/useAppStore";
import { ArrowUp, Loader2, RefreshCw } from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InventoryCard } from "./InventoryCard";
import { Button } from "./ui/button";

interface InventoryGridProps {
  session: string | null;
  loadingAccounts: boolean;
  fetchInventory: () => Promise<void>;
}

export const InventoryGrid: React.FC<InventoryGridProps> = memo(({
  session,
  fetchInventory,
  loadingAccounts,
}) => {
  const inventory = useAppStore((s) => s.inventory);
  const loadingInventory = useAppStore((s) => s.loadingInventory);
  const searchTerm = useAppStore((s) => s.searchTerm);
  const searchResults = useAppStore((s) => s.searchResults);
  const selectedAccount = useAppStore((s) => s.selectedAccount);
  const selectedCharacter = useAppStore((s) => s.selectedCharacter);
  const qualityFilter = useAppStore((s) => s.qualityFilter);
  const fullyLoaded = useAppStore((s) => s.fullyLoaded);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const filteredInventory = useMemo(() => {
    return (searchTerm ? searchResults : inventory).filter((item) => {
      if (selectedAccount !== "Show All" && item.account !== selectedAccount) {
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
      return true;
    });
  }, [
    inventory,
    searchResults,
    selectedAccount,
    selectedCharacter,
    qualityFilter,
    searchTerm,
  ]);

  // Pagination setup: show 100 items per page
  const PAGE_SIZE = 100;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filteredInventory.length / PAGE_SIZE);
  const pageItems = filteredInventory.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // On scroll, update back-to-top visibility only
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
            !inventory.some((i) => i.itemid === item.itemid),
        );
        return { ...state, cart: cartItems };
      });
      setSelectAll(false);
    } else {
      useAppStore.setState((state) => {
        const toAdd = inventory.filter((i) => !cartItemIds.has(i.itemid));
        return { ...state, cart: [...state.cart, ...toAdd] };
      });
      setSelectAll(true);
    }
  }

  function refreshInvo() {
    setPage(1);
    fetchInventory();
  }

  return (
    <section
      className="md:col-span-3 bg-gray-800 rounded shadow p-4 flex flex-col"
      style={{ minHeight: "80vh" }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Inventory</span>
          {session && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={refreshInvo}
              aria-label="Refresh Inventory"
            >
              <RefreshCw />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-0 justify-end">
          <span className="font-semibold">Quality:</span>
          <Select
            value={qualityFilter !== null ? String(qualityFilter) : "all"}
            onValueChange={(v) =>
              setQualityFilter(v === "all" ? null : Number(v))
            }
          >
            <SelectTrigger className="w-40 bg-gray-900 border border-gray-700 text-white">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border border-gray-700 text-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value={String(sdk.items.quality.Normal)}>
                Normal
              </SelectItem>
              <SelectItem value={String(sdk.items.quality.Superior)}>
                Superior
              </SelectItem>
              <SelectItem value={String(sdk.items.quality.Magic)}>
                Magic
              </SelectItem>
              <SelectItem value={String(sdk.items.quality.Rare)}>
                Rare
              </SelectItem>
              <SelectItem value={String(sdk.items.quality.Set)}>Set</SelectItem>
              <SelectItem value={String(sdk.items.quality.Unique)}>
                Unique
              </SelectItem>
              <SelectItem value={String(sdk.items.quality.Crafted)}>
                Crafted
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </h2>
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
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 p-1">
            {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <div
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
          {inventory.length === 0 ? (
            <div className="text-gray-400">No items found.</div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 p-1">
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
});
