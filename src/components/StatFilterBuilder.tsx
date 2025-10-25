import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NTIPAliasStat } from "@/lib/NTItemAlias";
import { naturalSort } from "@/lib/utils";
import { Plus, Search, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type StatFilter = {
  id: string;
  stat: string;
  comparison: "gte" | "lte" | "eq";
  value: number;
};

interface StatFilterBuilderProps {
  statFilters: StatFilter[];
  setStatFilters: (filters: StatFilter[]) => void;
  showLabel?: boolean;
  labelText?: string;
}

export const StatFilterBuilder: React.FC<StatFilterBuilderProps> = memo(
  ({
    statFilters,
    setStatFilters,
    showLabel = true,
    labelText = "Item Stats",
  }) => {
    const [statSearch, setStatSearch] = useState("");
    const [statDropdownFocusIndex, setStatDropdownFocusIndex] = useState(-1);
    const statDropdownRef = useRef<HTMLDivElement>(null);
    const [newStatFilter, setNewStatFilter] = useState<{
      stat: string;
      comparison: "gte" | "lte" | "eq";
      value: string;
    }>({
      stat: "",
      comparison: "gte",
      value: "",
    });

    // Scroll focused item into view
    useEffect(() => {
      if (statDropdownFocusIndex >= 0 && statDropdownRef.current) {
        const focusedButton = statDropdownRef.current.children[
          statDropdownFocusIndex
        ] as HTMLElement;
        if (focusedButton) {
          focusedButton.scrollIntoView({ block: "nearest" });
        }
      }
    }, [statDropdownFocusIndex]);

    const availableStats = useMemo(() => {
      return Object.keys(NTIPAliasStat)
        .filter((name) => name.toLowerCase().includes(statSearch.toLowerCase()))
        .sort((a, b) => naturalSort(a, b));
    }, [statSearch]);

    const handleAddStatFilter = useCallback(() => {
      if (!newStatFilter.stat || newStatFilter.value === "") return;

      const filter: StatFilter = {
        id: `${Date.now()}-${Math.random()}`,
        stat: newStatFilter.stat,
        comparison: newStatFilter.comparison,
        value: Number(newStatFilter.value),
      };

      setStatFilters([...statFilters, filter]);
      setNewStatFilter({ stat: "", comparison: "gte", value: "" });
      setStatSearch("");
    }, [newStatFilter, statFilters, setStatFilters]);

    const handleRemoveStatFilter = useCallback(
      (id: string) => {
        setStatFilters(statFilters.filter((f) => f.id !== id));
      },
      [statFilters, setStatFilters],
    );

    return (
      <div className="flex flex-col">
        {showLabel && (
          <div className="text-xs xl:text-base mb-1 text-gray-300 font-semibold">
            {labelText} {statFilters.length > 0 && `(${statFilters.length})`}
          </div>
        )}

        {/* Active Stat Filters */}
        {statFilters.length > 0 && (
          <div className="mb-3 space-y-2">
            {statFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center gap-2 bg-gray-800 p-2 rounded border border-gray-700"
              >
                <span className="text-sm text-gray-300 flex-1">
                  <span className="font-semibold text-lime-400">
                    {filter.stat}
                  </span>{" "}
                  <span className="text-gray-400">
                    {filter.comparison === "gte"
                      ? "≥"
                      : filter.comparison === "lte"
                        ? "≤"
                        : "="}
                  </span>{" "}
                  <span className="font-mono">{filter.value}</span>
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 hover:text-red-400"
                  onClick={() => handleRemoveStatFilter(filter.id)}
                  title="Remove stat filter"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Stat Filter */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="flex flex-col gap-2">
            {/* Stat Search/Select */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="stat-search-input"
                className="text-xs text-gray-400"
              >
                Stat Name
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="stat-search-input"
                  type="text"
                  placeholder="Search stats (e.g., fireresist, strength)..."
                  value={newStatFilter.stat}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStatSearch(value);
                    setStatDropdownFocusIndex(-1);
                    setNewStatFilter({
                      ...newStatFilter,
                      stat: value,
                    });
                  }}
                  onKeyDown={(e) => {
                    const displayedStats = availableStats.slice(0, 10);
                    const isDropdownOpen =
                      statSearch &&
                      availableStats.length > 0 &&
                      newStatFilter.stat === statSearch;

                    if (!isDropdownOpen) return;

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setStatDropdownFocusIndex((prev) =>
                        prev < displayedStats.length - 1 ? prev + 1 : prev,
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setStatDropdownFocusIndex((prev) =>
                        prev > 0 ? prev - 1 : -1,
                      );
                    } else if (
                      e.key === "Enter" &&
                      statDropdownFocusIndex >= 0
                    ) {
                      e.preventDefault();
                      const selectedStat =
                        displayedStats[statDropdownFocusIndex];
                      if (selectedStat) {
                        setNewStatFilter({
                          ...newStatFilter,
                          stat: selectedStat,
                        });
                        setStatSearch("");
                        setStatDropdownFocusIndex(-1);
                      }
                    } else if (e.key === "Escape") {
                      setStatSearch("");
                      setStatDropdownFocusIndex(-1);
                    }
                  }}
                  className="pl-8 bg-gray-900 border-gray-700 text-white text-sm"
                />
              </div>
              {statSearch &&
                availableStats.length > 0 &&
                newStatFilter.stat === statSearch && (
                  <div
                    ref={statDropdownRef}
                    className="max-h-40 overflow-y-auto bg-gray-900 border border-gray-700 rounded"
                  >
                    {availableStats.slice(0, 10).map((stat, index) => (
                      <button
                        key={stat}
                        type="button"
                        onClick={() => {
                          setNewStatFilter({ ...newStatFilter, stat });
                          setStatSearch("");
                          setStatDropdownFocusIndex(-1);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-700 text-gray-300 hover:text-white ${
                          index === statDropdownFocusIndex
                            ? "bg-gray-700 text-white"
                            : ""
                        }`}
                      >
                        {stat}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {/* Comparison and Value */}
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label
                  htmlFor="stat-comparison-select"
                  className="text-xs text-gray-400"
                >
                  Comparison
                </label>
                <Select
                  value={newStatFilter.comparison}
                  onValueChange={(v) =>
                    setNewStatFilter({
                      ...newStatFilter,
                      comparison: v as "gte" | "lte" | "eq",
                    })
                  }
                >
                  <SelectTrigger
                    id="stat-comparison-select"
                    className="bg-gray-900 border-gray-700 text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gte">≥ (Greater or Equal)</SelectItem>
                    <SelectItem value="lte">≤ (Less or Equal)</SelectItem>
                    <SelectItem value="eq">= (Equal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label
                  htmlFor="stat-value-input"
                  className="text-xs text-gray-400"
                >
                  Value
                </label>
                <Input
                  id="stat-value-input"
                  type="number"
                  placeholder="Value"
                  value={newStatFilter.value}
                  onChange={(e) =>
                    setNewStatFilter({
                      ...newStatFilter,
                      value: e.target.value,
                    })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <Button
                type="button"
                onClick={handleAddStatFilter}
                disabled={!newStatFilter.stat || newStatFilter.value === ""}
                className="bg-lime-600 hover:bg-lime-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

StatFilterBuilder.displayName = "StatFilterBuilder";
