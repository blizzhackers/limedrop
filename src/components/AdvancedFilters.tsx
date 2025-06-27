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
import { sdk } from "@/lib/sdk";
import { naturalSort } from "@/lib/utils";
import { setQualityFilter, useAppStore } from "@/stores/appStore";
import { ChevronsUpDown, Search, X } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { ItemTypeCheckbox } from "./ItemTypeCheckbox";

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
  }) => {
    const qualityFilter = useAppStore((s) => s.qualityFilter);
    const itemPacks = useAppStore((s) => s.packs);

    const [itemTypeSearch, setItemTypeSearch] = useState("");

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

    return (
      <div className="mb-4 bg-gray-900 p-4 rounded border border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
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
