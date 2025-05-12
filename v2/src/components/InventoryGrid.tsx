import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { type InventoryItem } from "@/lib/utils";
import { renderColorText } from "@/lib/util";
import { sdk } from "@/lib/sdk";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";

interface InventoryGridProps {
  session: string | null;
  inventory: InventoryItem[];
  loadingInventory: boolean;
  cart: InventoryItem[];
  handleSelectItem: (item: InventoryItem) => void;
  allVisibleSelected: boolean;
  handleToggleSelectAll: () => void;
  qualityFilter: number | null;
  setQualityFilter: React.Dispatch<React.SetStateAction<number | null>>;
  fetchInventory: () => Promise<void>;
  loadingAccounts: boolean;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  session,
  inventory,
  loadingInventory,
  cart,
  handleSelectItem,
  allVisibleSelected,
  handleToggleSelectAll,
  qualityFilter,
  setQualityFilter,
  fetchInventory,
  loadingAccounts
}) => (
  <section className="md:col-span-3 bg-gray-800 rounded shadow p-4 flex flex-col" style={{ minHeight: '80vh' }}>
    <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>Inventory</span>
        {session && <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={fetchInventory}
          aria-label="Refresh Inventory"
        >
          <RefreshCw />
        </Button>}
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-0 justify-end">
        <span className="font-semibold">Quality:</span>
        <Select
          value={qualityFilter !== null ? String(qualityFilter) : "all"}
          onValueChange={v => setQualityFilter(v === "all" ? null : Number(v))}
        >
          <SelectTrigger className="w-40 bg-gray-900 border border-gray-700 text-white">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border border-gray-700 text-white">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value={String(sdk.items.quality.Normal)}>Normal</SelectItem>
            <SelectItem value={String(sdk.items.quality.Superior)}>Superior</SelectItem>
            <SelectItem value={String(sdk.items.quality.Magic)}>Magic</SelectItem>
            <SelectItem value={String(sdk.items.quality.Rare)}>Rare</SelectItem>
            <SelectItem value={String(sdk.items.quality.Set)}>Set</SelectItem>
            <SelectItem value={String(sdk.items.quality.Unique)}>Unique</SelectItem>
            <SelectItem value={String(sdk.items.quality.Crafted)}>Crafted</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </h2>
    {session && inventory.length > 0 && (
      <div className="flex items-center gap-2 mb-2">
        <Checkbox id="select-all" checked={allVisibleSelected} onCheckedChange={handleToggleSelectAll} className="data-[state=checked]:bg-lime-500 border-gray-600" />
        <label htmlFor="select-all" className="text-sm select-none cursor-pointer">
          {allVisibleSelected ? "Deselect All" : "Select All"} (visible)
        </label>
      </div>
    )}
    {!session ? (
      <div className="text-gray-400">Please login to view inventory.</div>
    ) : (loadingInventory || (loadingAccounts && !inventory.length)) ? (
      <div className="text-gray-400">Loading...</div>
    ) : (
      <ScrollArea className="h-[86dvh] bg-gray-900 rounded p-2">
        {inventory.length === 0 ? (
          <div className="text-gray-400">No items found.</div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 p-1">
            {inventory.map((item, idx) => {
              const title = (item.description ? item.description.split("$", 1)[0] : "");
              let desc = item.description || "";
              if (desc.startsWith(title)) desc = desc.slice(title.length);
              const inCart = cart.some((i) => i.itemid === item.itemid);
              return (
                <div
                  key={item.itemid || idx}
                  className={
                    `bg-gray-700 rounded p-2 flex flex-col items-center shadow-filter relative cursor-pointer transition-all duration-100 ` +
                    (inCart ? "ring-2 ring-green-400 bg-green-950" : "hover:ring-2 hover:ring-green-400")
                  }
                  style={{ minHeight: 160 }}
                  onClick={() => handleSelectItem(item)}
                  title={inCart ? "Remove from Drop List" : "Add to Drop List"}
                >
                  {/* <span className="absolute top-0 right-0">{quality}</span> */}
                  {item.image && (
                    <img
                      src={`data:image/jpeg;base64,${item.image}`}
                      alt={"item"}
                      className="ld-item mb-2"
                      style={{ maxWidth: 80, maxHeight: 80, imageRendering: 'crisp-edges' }}
                    />
                  )}
                  <div className="comment-text w-full text-center pb-7">
                    <div className="font-semibold text-base">{renderColorText(title)}</div>
                    <div className="text-sm">{renderColorText(desc)}</div>
                  </div>
                  <div className="absolute bottom-2 left-0 w-full px-2 flex flex-row justify-between text-xs text-gray-400 items-center">
                    <span>{item.account} / {item.character}</span>
                    <span className="ml-2 text-gray-500 whitespace-nowrap">{item.itemid}</span>
                  </div>
                  {inCart && (
                    <span className="absolute top-2 right-2 bg-green-600 text-xs px-2 py-0.5 rounded-full text-white">In Drop List</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    )}
  </section>
);
