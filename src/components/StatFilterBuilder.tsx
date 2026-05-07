import { ChevronsUpDown, Edit2Icon, Plus, Search, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NTIPAliasStat } from "@/constants/NTItemAlias";
import { naturalSort } from "@/lib/utils";
import type { FilterField, StatFilter } from "./filterTypes";

export type { StatFilter };

interface StatFilterBuilderProps {
  field: FilterField<StatFilter[]>;
  showLabel?: boolean;
  labelText?: string;
  showCollapsible?: boolean;
  defaultOpen?: boolean;
}

export const StatFilterBuilder: React.FC<StatFilterBuilderProps> = memo(
  ({
    field,
    showLabel = true,
    labelText = "Item Stats",
    showCollapsible = false,
    defaultOpen = true,
  }) => {
    const statFilters = field.state.value;
    const [statSearch, setStatSearch] = useState("");
    const [statDropdownFocusIndex, setStatDropdownFocusIndex] = useState(-1);
    const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(defaultOpen);
    const collapseableRef = useRef<HTMLButtonElement>(null);
    const statDropdownRef = useRef<HTMLDivElement>(null);
    const statInputRef = useRef<HTMLInputElement>(null);
    const valueInputRef = useRef<HTMLInputElement>(null);
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
    const [newStatFilter, setNewStatFilter] = useState<{
      stat: string;
      comparison: "gte" | "lte" | "eq";
      value: string;
    }>({
      stat: "",
      comparison: "gte",
      value: "",
    });

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

      if (editingFilterId) {
        field.handleChange(
          statFilters.map((f) =>
            f.id === editingFilterId
              ? {
                  ...f,
                  stat: newStatFilter.stat,
                  comparison: newStatFilter.comparison,
                  value: Number(newStatFilter.value),
                }
              : f,
          ),
        );
        setEditingFilterId(null);
      } else {
        const filter: StatFilter = {
          id: `${Date.now()}-${Math.random()}`,
          stat: newStatFilter.stat,
          comparison: newStatFilter.comparison,
          value: Number(newStatFilter.value),
        };
        field.handleChange([...statFilters, filter]);
      }

      setNewStatFilter({ stat: "", comparison: "gte", value: "" });
      setStatSearch("");
    }, [newStatFilter, statFilters, field, editingFilterId]);

    const handleEditStatFilter = useCallback(
      (filter: StatFilter) => {
        // Only open the collapsible if it's currently closed
        if (showCollapsible && !isCollapsibleOpen) {
          collapseableRef.current?.click();
        }
        setNewStatFilter({
          stat: filter.stat,
          comparison: filter.comparison,
          value: String(filter.value),
        });
        setEditingFilterId(filter.id);
        setStatSearch("");
      },
      [showCollapsible, isCollapsibleOpen],
    );

    const handleCancelEdit = useCallback(() => {
      setEditingFilterId(null);
      setNewStatFilter({ stat: "", comparison: "gte", value: "" });
      setStatSearch("");
    }, []);

    const handleRemoveStatFilter = useCallback(
      (id: string) => {
        if (editingFilterId === id) {
          setEditingFilterId(null);
        }
        field.handleChange(statFilters.filter((f) => f.id !== id));
      },
      [statFilters, field, editingFilterId],
    );

    const activeFiltersContent = (
      <>
        {statFilters.length > 0 && (
          <div className="mb-3 space-y-2">
            {statFilters.map((filter) => {
              const isEditing = editingFilterId === filter.id;
              return (
                <div
                  key={filter.id}
                  className={`flex items-center gap-2 p-2 rounded border transition-colors ${
                    isEditing
                      ? "bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/50"
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  <span className="text-sm text-gray-300 flex-1 min-w-0">
                    <span className="font-semibold text-lime-400 break-words">
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
                    {isEditing && (
                      <span className="ml-2 text-xs text-blue-400 font-semibold">
                        (editing)
                      </span>
                    )}
                  </span>
                  <div className="flex gap-1 mobile:gap-2 shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 hover:text-blue-400"
                      onClick={() => handleEditStatFilter(filter)}
                      title="Edit stat filter"
                      disabled={isEditing}
                    >
                      <Edit2Icon className="w-4 h-4" />
                    </Button>
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
                </div>
              );
            })}
          </div>
        )}
      </>
    );

    const formContent = (
      <div className="bg-gray-800 p-3 rounded border border-gray-700">
        <div className="flex flex-col gap-2">
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
                ref={statInputRef}
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
                  } else if (e.key === "Enter" && statDropdownFocusIndex >= 0) {
                    e.preventDefault();
                    const selectedStat = displayedStats[statDropdownFocusIndex];
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

          <div className="grid grid-cols-1 tablet:grid-cols-2 md:grid-cols-3 items-center gap-2">
            <div className="flex flex-col gap-1">
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
                  className="bg-gray-900 border-gray-700 text-white w-full"
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

            <div className="flex flex-col gap-1">
              <label
                htmlFor="stat-value-input"
                className="text-xs text-gray-400"
              >
                Value
              </label>
              <Input
                id="stat-value-input"
                ref={valueInputRef}
                type="number"
                placeholder="Value"
                value={newStatFilter.value}
                onChange={(e) =>
                  setNewStatFilter({
                    ...newStatFilter,
                    value: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddStatFilter();
                  } else if (e.key === "Tab" && !e.shiftKey) {
                    const isDisabled =
                      !newStatFilter.stat || newStatFilter.value === "";
                    if (isDisabled) {
                      e.preventDefault();
                      statInputRef.current?.focus();
                    }
                  }
                }}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="flex flex-col gap-1 tablet:col-span-2">
              <div className="text-xs text-gray-400">&nbsp;</div>
              {editingFilterId ? (
                <div className="flex gap-2">
                  <Button
                    ref={addButtonRef}
                    type="button"
                    onClick={handleAddStatFilter}
                    disabled={!newStatFilter.stat || newStatFilter.value === ""}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && !e.shiftKey) {
                        e.preventDefault();
                        statInputRef.current?.focus();
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    Update
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCancelEdit}
                    variant="ghost"
                    className="text-gray-400 hover:text-white flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && !e.shiftKey) {
                        e.preventDefault();
                        statInputRef.current?.focus();
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  ref={addButtonRef}
                  type="button"
                  onClick={handleAddStatFilter}
                  disabled={!newStatFilter.stat || newStatFilter.value === ""}
                  onKeyDown={(e) => {
                    if (e.key === "Tab" && !e.shiftKey) {
                      e.preventDefault();
                      statInputRef.current?.focus();
                    }
                  }}
                  className="bg-lime-600 hover:bg-lime-700 text-white w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    if (showCollapsible) {
      return (
        <div className="flex flex-col">
          <Collapsible
            open={isCollapsibleOpen}
            onOpenChange={setIsCollapsibleOpen}
          >
            <div className="flex items-center justify-between">
              {showLabel && (
                <div className="text-sm tablet:text-base mb-1 text-gray-300 font-semibold">
                  {labelText}{" "}
                  {statFilters.length > 0 && `(${statFilters.length})`}
                </div>
              )}
              <CollapsibleTrigger
                ref={collapseableRef}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-300 cursor-pointer"
                aria-label="Toggle Item Stats"
              >
                <ChevronsUpDown className="w-4 h-4" />
              </CollapsibleTrigger>
            </div>
            {activeFiltersContent}
            <CollapsibleContent>{formContent}</CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {showLabel && (
          <div className="text-sm tablet:text-base mb-1 text-gray-300 font-semibold">
            {labelText} {statFilters.length > 0 && `(${statFilters.length})`}
          </div>
        )}
        {activeFiltersContent}
        {formContent}
      </div>
    );
  },
);

StatFilterBuilder.displayName = "StatFilterBuilder";
