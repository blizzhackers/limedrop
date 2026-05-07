import { Filter, RefreshCw } from "lucide-react";
import type React from "react";
import { memo } from "react";
import { Button } from "./ui/button";

interface InventoryToolbarProps {
  session: string | null;
  filtersActive: boolean;
  showAdvancedFilters: boolean;
  onRefresh: () => void;
  onToggleFilters: () => void;
}

export const InventoryToolbar: React.FC<InventoryToolbarProps> = memo(
  ({
    session,
    filtersActive,
    showAdvancedFilters,
    onRefresh,
    onToggleFilters,
  }) => (
    <div className="flex flex-row items-center justify-between gap-4 mb-4">
      <div className="flex items-center justify-start gap-2">
        <h2 className="text-xl font-bold">Inventory</h2>
        {session && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-5 md:w-5 hover:text-lime-500"
            onClick={onRefresh}
            aria-label="Refresh Inventory"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Button
        type="button"
        variant={showAdvancedFilters ? "default" : "outline"}
        size="icon"
        className={`relative ml-2 transition-colors ${
          showAdvancedFilters
            ? "bg-lime-700 hover:bg-lime-600"
            : "hover:bg-gray-700"
        }`}
        onClick={onToggleFilters}
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
  ),
);

InventoryToolbar.displayName = "InventoryToolbar";
