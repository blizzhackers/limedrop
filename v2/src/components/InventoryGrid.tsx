import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sdk } from "@/lib/sdk";
import type { InventoryItem } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { ArrowUp, RefreshCw } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { InventoryCard } from "./InventoryCard";
import { Button } from "./ui/button";

interface InventoryGridProps {
  session: string | null;
  inventory: InventoryItem[];
  loadingInventory: boolean;
  qualityFilter: number | null;
  setQualityFilter: React.Dispatch<React.SetStateAction<number | null>>;
  fetchInventory: () => Promise<void>;
  loadingAccounts: boolean;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  session,
  inventory,
  loadingInventory,
  qualityFilter,
  setQualityFilter,
  fetchInventory,
  loadingAccounts,
  onLoadMore,
  hasMore,
  isFetchingMore,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !hasMore || isFetchingMore) return;
    setShowBackToTop(el.scrollTop > 300);
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 400) {
      onLoadMore();
    }
  };

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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  });

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
              onClick={fetchInventory}
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
      {session && inventory.length > 0 && (
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
      ) : loadingInventory || (loadingAccounts && !inventory.length) ? (
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
              {inventory.map((item, idx) => {
                return <InventoryCard key={item.itemid || idx} item={item} />;
              })}
              {isFetchingMore && (
                <div className="col-span-full flex justify-center py-4">
                  <span className="animate-spin h-6 w-6 border-4 border-lime-500 border-t-transparent rounded-full inline-block"></span>
                  <span className="ml-2 text-lime-400">Loading more...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {session && inventory.length > 0 && showBackToTop && (
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
};
