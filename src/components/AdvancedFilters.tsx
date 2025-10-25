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
import { NTIPAliasStat } from "@/lib/NTItemAlias";
import { sdk } from "@/lib/sdk";
import { naturalSort } from "@/lib/utils";
import { setQualityFilter, useAppStore } from "@/stores/appStore";
import { ChevronsUpDown, Plus, Search, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ItemTypeCheckbox } from "./ItemTypeCheckbox";

export type StatFilter = {
  id: string;
  stat: string;
  comparison: "gte" | "lte" | "eq";
  value: number;
};

interface AdvancedFiltersProps {
  itemClassFilter: number | null;
  setItemClassFilter: (value: number | null) => void;
  itemTypeFilter: Set<number>;
  setItemTypeFilter: React.Dispatch<React.SetStateAction<Set<number>>>;
  etherealFilter: boolean | null;
  setEtherealFilter: (value: boolean | null) => void;
  runewordFilter: boolean | null;
  setRunewordFilter: (value: boolean | null) => void;
  socketFilter: number | null;
  setSocketFilter: (value: number | null) => void;
  activeItemPackId: number | null;
  setActiveItemPackId: (value: number | null) => void;
  itemPackMultiplier: number;
  setItemPackMultiplier: (value: number) => void;
  ilvlFilter: number | null;
  setIlvlFilter: (value: number | null) => void;
  ilvlComparison: "gte" | "lte" | "eq";
  setIlvlComparison: (value: "gte" | "lte" | "eq") => void;
  levelReqFilter: number | null;
  setLevelReqFilter: (value: number | null) => void;
  levelReqComparison: "gte" | "lte" | "eq";
  setLevelReqComparison: (value: "gte" | "lte" | "eq") => void;
  itemCodeFilter: string;
  setItemCodeFilter: (value: string) => void;
  statFilters: StatFilter[];
  setStatFilters: (value: StatFilter[]) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = memo(
  ({
    itemClassFilter,
    setItemClassFilter,
    itemTypeFilter,
    setItemTypeFilter,
    etherealFilter,
    setEtherealFilter,
    runewordFilter,
    setRunewordFilter,
    socketFilter,
    setSocketFilter,
    activeItemPackId,
    setActiveItemPackId,
    itemPackMultiplier,
    setItemPackMultiplier,
    ilvlFilter,
    setIlvlFilter,
    ilvlComparison,
    setIlvlComparison,
    levelReqFilter,
    setLevelReqFilter,
    levelReqComparison,
    setLevelReqComparison,
    itemCodeFilter,
    setItemCodeFilter,
    statFilters,
    setStatFilters,
  }) => {
    const qualityFilter = useAppStore((s) => s.qualityFilter);
    const itemPacks = useAppStore((s) => s.packs);

    const [itemTypeSearch, setItemTypeSearch] = useState("");
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

    const handleItemTypeChange = useCallback(
      (val: number) => (checked: boolean) => {
        setItemTypeFilter((prev) => {
          const next = new Set(prev);
          checked ? next.add(val) : next.delete(val);
          return next;
        });
      },
      [setItemTypeFilter],
    );

    const filteredItemTypes = useMemo(() => {
      return Object.entries(sdk.items.type)
        .filter(([name]) =>
          name.toLowerCase().includes(itemTypeSearch.toLowerCase()),
        )
        .sort(([a], [b]) => naturalSort(a, b));
    }, [itemTypeSearch]);

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
      <div className="mb-4 bg-gray-900 p-4 rounded border border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="quality-select"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Quality
              </label>
              <Select
                value={qualityFilter !== null ? String(qualityFilter) : "all"}
                onValueChange={(v) =>
                  setQualityFilter(v === "all" ? null : Number(v))
                }
              >
                <SelectTrigger
                  id="quality-select"
                  className="w-full bg-gray-900 border border-gray-700 text-white"
                >
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
                  <SelectItem value={String(sdk.items.quality.Set)}>
                    Set
                  </SelectItem>
                  <SelectItem value={String(sdk.items.quality.Unique)}>
                    Unique
                  </SelectItem>
                  <SelectItem value={String(sdk.items.quality.Crafted)}>
                    Crafted
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="item-class-select"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Item Class
              </label>
              <Select
                value={
                  itemClassFilter !== null ? String(itemClassFilter) : "all"
                }
                onValueChange={(v) =>
                  setItemClassFilter(v === "all" ? null : Number(v))
                }
              >
                <SelectTrigger
                  id="item-class-select"
                  className="w-full bg-gray-900 border border-gray-700 text-white"
                >
                  <SelectValue placeholder="Item Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {Object.entries(sdk.items.class).map(([name, val]) => (
                    <SelectItem key={val} value={String(val)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="ethereal-select"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Ethereal
              </label>
              <Select
                value={
                  etherealFilter === null
                    ? "all"
                    : etherealFilter
                      ? "yes"
                      : "no"
                }
                onValueChange={(v) =>
                  setEtherealFilter(v === "all" ? null : v === "yes")
                }
              >
                <SelectTrigger
                  id="ethereal-select"
                  className="w-full bg-gray-900 border border-gray-700 text-white"
                >
                  <SelectValue placeholder="Ethereal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="yes">Ethereal</SelectItem>
                  <SelectItem value="no">Non-Eth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="runeword-select"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Runeword
              </label>
              <Select
                value={
                  runewordFilter === null
                    ? "all"
                    : runewordFilter
                      ? "yes"
                      : "no"
                }
                onValueChange={(v) =>
                  setRunewordFilter(v === "all" ? null : v === "yes")
                }
              >
                <SelectTrigger
                  id="runeword-select"
                  className="w-full bg-gray-900 border border-gray-700 text-white"
                >
                  <SelectValue placeholder="Runeword" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="yes">Runeword</SelectItem>
                  <SelectItem value="no">Non-RW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="sockets-input"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Sockets
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="sockets-input"
                  type="number"
                  className="bg-gray-900 text-white"
                  min={0}
                  max={6}
                  value={socketFilter ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSocketFilter(val === "" ? null : Number(val));
                  }}
                  placeholder="Sockets"
                />
                {socketFilter !== null && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setSocketFilter(null)}
                    title="Clear Sockets Filter"
                  >
                    <X />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* V2 Item Filters - Only work with newer item data */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="ilvl-input"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Item Level (V2)
              </label>
              <div className="flex items-center gap-1">
                <Select
                  value={ilvlComparison}
                  onValueChange={(v) =>
                    setIlvlComparison(v as "gte" | "lte" | "eq")
                  }
                >
                  <SelectTrigger className="w-16 bg-gray-900 border border-gray-700 text-white px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gte">≥</SelectItem>
                    <SelectItem value="lte">≤</SelectItem>
                    <SelectItem value="eq">=</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="ilvl-input"
                  type="number"
                  className="bg-gray-900 text-white flex-1"
                  min={0}
                  max={99}
                  value={ilvlFilter ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIlvlFilter(val === "" ? null : Number(val));
                  }}
                  placeholder="ilvl"
                />
                {ilvlFilter !== null && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => setIlvlFilter(null)}
                    title="Clear Item Level Filter"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="levelreq-input"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Level Req (V2)
              </label>
              <div className="flex items-center gap-1">
                <Select
                  value={levelReqComparison}
                  onValueChange={(v) =>
                    setLevelReqComparison(v as "gte" | "lte" | "eq")
                  }
                >
                  <SelectTrigger className="w-16 bg-gray-900 border border-gray-700 text-white px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gte">≥</SelectItem>
                    <SelectItem value="lte">≤</SelectItem>
                    <SelectItem value="eq">=</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="levelreq-input"
                  type="number"
                  className="bg-gray-900 text-white flex-1"
                  min={0}
                  max={99}
                  value={levelReqFilter ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLevelReqFilter(val === "" ? null : Number(val));
                  }}
                  placeholder="lvl req"
                />
                {levelReqFilter !== null && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => setLevelReqFilter(null)}
                    title="Clear Level Requirement Filter"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="itemcode-input"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Item Code (V2)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="itemcode-input"
                  type="text"
                  className="bg-gray-900 text-white"
                  value={itemCodeFilter}
                  onChange={(e) => setItemCodeFilter(e.target.value)}
                  placeholder="e.g. umc, amu"
                />
                {itemCodeFilter && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setItemCodeFilter("")}
                    title="Clear Item Code Filter"
                  >
                    <X />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stat Filters Section (V2) */}
        <div className="flex flex-col mt-6">
          <Collapsible defaultOpen={statFilters.length > 0}>
            <div className="flex items-center justify-between">
              <div className="text-xs xl:text-base mb-1 text-gray-300 font-semibold">
                Item Stats (V2){" "}
                {statFilters.length > 0 && `(${statFilters.length})`}
              </div>
              <CollapsibleTrigger
                className="flex items-center gap-1 text-gray-400 hover:text-gray-300 cursor-pointer"
                aria-label="Toggle Item Stats"
              >
                <ChevronsUpDown className="w-4 h-4" />
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
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
                              prev < displayedStats.length - 1
                                ? prev + 1
                                : prev,
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
                          <SelectItem value="gte">
                            ≥ (Greater or Equal)
                          </SelectItem>
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
                      disabled={
                        !newStatFilter.stat || newStatFilter.value === ""
                      }
                      className="bg-lime-600 hover:bg-lime-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex flex-col mt-6">
          <Collapsible defaultOpen>
            <div className="flex items-center justify-between">
              <label
                htmlFor="item-type-select"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Item Type
              </label>

              <CollapsibleTrigger
                className="flex items-center gap-1 text-gray-400 hover:text-gray-300 cursor-pointer"
                aria-label="Toggle Item Types"
              >
                <ChevronsUpDown className="w-4 h-4" />
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search item types..."
                    value={itemTypeSearch}
                    onChange={(e) => setItemTypeSearch(e.target.value)}
                    className="pl-8 bg-gray-900 border-gray-700 text-white text-sm"
                  />
                  {itemTypeSearch && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                      onClick={() => setItemTypeSearch("")}
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div
                id="item-type-select"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 max-h-54 overflow-y-auto bg-gray-900 border border-gray-700 rounded p-2"
              >
                {filteredItemTypes.map(([name, val]) => (
                  <ItemTypeCheckbox
                    key={val}
                    name={name}
                    checked={itemTypeFilter.has(Number(val))}
                    onChange={handleItemTypeChange(Number(val))}
                  />
                ))}
                {filteredItemTypes.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-4">
                    No item types found matching "{itemTypeSearch}"
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <label
            htmlFor="item-pack-select"
            className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
          >
            Item Pack
          </label>
          <Select
            value={
              activeItemPackId !== null ? String(activeItemPackId) : "none"
            }
            onValueChange={(v) =>
              setActiveItemPackId(v !== "none" ? Number(v) : null)
            }
          >
            <SelectTrigger
              id="item-pack-select"
              className="w-full bg-gray-900 border border-gray-700 text-white"
            >
              <SelectValue placeholder="-- No Pack --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- No Pack --</SelectItem>
              {itemPacks.map((pack) => (
                <SelectItem key={pack.id} value={String(pack.id)}>
                  {pack.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeItemPackId !== null && (
            <div className="flex items-center gap-1 ml-2">
              <label
                htmlFor="item-pack-multiplier"
                className="text-xs text-gray-300"
              >
                x
              </label>
              <input
                id="item-pack-multiplier"
                type="number"
                min={1}
                max={20}
                value={itemPackMultiplier}
                onChange={(e) =>
                  setItemPackMultiplier(
                    Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                  )
                }
                className="w-12 px-1 py-0.5 rounded bg-gray-900 border border-gray-700 text-white text-center text-xs"
              />
            </div>
          )}
        </div>
      </div>
    );
  },
);

AdvancedFilters.displayName = "AdvancedFilters";
