import { memo } from "react";
import {
  ColorFilterField,
  EtherealFilterField,
  IdentifiedFilterField,
  ItemClassFilterField,
  ItemCodeFilterField,
  ItemTypesSelector,
  NumericFilterWithComparison,
  QualityFilterField,
  RunewordFilterField,
  SocketsFilterField,
} from "@/components/FilterFields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setQualityFilter, useAppStore } from "@/stores/appStore";
import { type StatFilter, StatFilterBuilder } from "./StatFilterBuilder";

export type { StatFilter };

interface AdvancedFiltersProps {
  itemClassFilter: number | null;
  setItemClassFilter: (value: number | null) => void;
  itemTypeFilter: Set<number>;
  setItemTypeFilter: React.Dispatch<React.SetStateAction<Set<number>>>;
  etherealFilter: boolean | null;
  setEtherealFilter: (value: boolean | null) => void;
  runewordFilter: boolean | null;
  setRunewordFilter: (value: boolean | null) => void;
  identifiedFilter: boolean | null;
  setIdentifiedFilter: (value: boolean | null) => void;
  socketFilter: number | null;
  setSocketFilter: (value: number | null) => void;
  colorFilter: number | null;
  setColorFilter: (value: number | null) => void;
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
  strReqFilter: number | null;
  setStrReqFilter: (value: number | null) => void;
  strReqComparison: "gte" | "lte" | "eq";
  setStrReqComparison: (value: "gte" | "lte" | "eq") => void;
  dexReqFilter: number | null;
  setDexReqFilter: (value: number | null) => void;
  dexReqComparison: "gte" | "lte" | "eq";
  setDexReqComparison: (value: "gte" | "lte" | "eq") => void;
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
    identifiedFilter,
    setIdentifiedFilter,
    socketFilter,
    setSocketFilter,
    colorFilter,
    setColorFilter,
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
    strReqFilter,
    setStrReqFilter,
    strReqComparison,
    setStrReqComparison,
    dexReqFilter,
    setDexReqFilter,
    dexReqComparison,
    setDexReqComparison,
    itemCodeFilter,
    setItemCodeFilter,
    statFilters,
    setStatFilters,
  }) => {
    const qualityFilter = useAppStore((s) => s.qualityFilter);
    const itemPacks = useAppStore((s) => s.packs);

    return (
      <div className="mb-4 bg-gray-900 p-4 rounded border border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          <div className="flex flex-col gap-4">
            <QualityFilterField
              value={qualityFilter}
              onValueChange={setQualityFilter}
            />
          </div>

          <div className="flex flex-col gap-4">
            <ItemClassFilterField
              value={itemClassFilter}
              onValueChange={setItemClassFilter}
            />
          </div>

          <div className="flex flex-col gap-4">
            <EtherealFilterField
              value={etherealFilter}
              onValueChange={setEtherealFilter}
            />
          </div>

          <div className="flex flex-col gap-4">
            <RunewordFilterField
              value={runewordFilter}
              onValueChange={setRunewordFilter}
            />
          </div>

          <div className="flex flex-col gap-4">
            <IdentifiedFilterField
              value={identifiedFilter}
              onValueChange={setIdentifiedFilter}
            />
          </div>

          <div className="flex flex-col gap-4">
            <SocketsFilterField
              value={socketFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSocketFilter(val === "" ? null : Number(val));
              }}
            />
          </div>

          <div className="flex flex-col gap-4">
            <ColorFilterField
              value={colorFilter}
              onValueChange={setColorFilter}
            />
          </div>

          <div className="flex flex-col gap-4">
            <NumericFilterWithComparison
              id="ilvl-input"
              label="Item Level"
              value={ilvlFilter}
              comparison={ilvlComparison}
              onValueChange={setIlvlFilter}
              onComparisonChange={setIlvlComparison}
              placeholder="ilvl"
              showClearButton={true}
            />
          </div>

          <div className="flex flex-col gap-4">
            <NumericFilterWithComparison
              id="levelreq-input"
              label="Level Req"
              value={levelReqFilter}
              comparison={levelReqComparison}
              onValueChange={setLevelReqFilter}
              onComparisonChange={setLevelReqComparison}
              placeholder="lvl req"
              showClearButton={true}
            />
          </div>

          <div className="flex flex-col gap-4">
            <NumericFilterWithComparison
              id="strreq-input"
              label="Str Req"
              value={strReqFilter}
              comparison={strReqComparison}
              onValueChange={setStrReqFilter}
              onComparisonChange={setStrReqComparison}
              placeholder="str req"
              showClearButton={true}
            />
          </div>

          <div className="flex flex-col gap-4">
            <NumericFilterWithComparison
              id="dexreq-input"
              label="Dex Req"
              value={dexReqFilter}
              comparison={dexReqComparison}
              onValueChange={setDexReqFilter}
              onComparisonChange={setDexReqComparison}
              placeholder="dex req"
              showClearButton={true}
            />
          </div>

          <div className="flex flex-col gap-4">
            <ItemCodeFilterField
              value={itemCodeFilter}
              onValueChange={setItemCodeFilter}
            />
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 mt-6">
          <div className="flex flex-col flex-1">
            <StatFilterBuilder
              statFilters={statFilters}
              setStatFilters={setStatFilters}
              showCollapsible={true}
              defaultOpen={true}
            />
          </div>

          <div className="flex flex-col flex-1">
            <ItemTypesSelector
              itemTypeFilter={itemTypeFilter}
              onItemTypeChange={(type, checked) => {
                setItemTypeFilter((prev) => {
                  const next = new Set(prev);
                  if (checked) {
                    next.add(type);
                  } else {
                    next.delete(type);
                  }
                  return next;
                });
              }}
              showSearch={true}
              showCollapsible={true}
              defaultOpen={true}
            />
          </div>
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
